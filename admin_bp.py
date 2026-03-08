"""
ForgePrompt Admin Blueprint
All /admin/* routes live here.
"""

import json, os, uuid, csv, io
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict, Counter

from flask import (
    Blueprint, render_template, request, jsonify,
    session, redirect, url_for, flash, abort, Response
)
from werkzeug.security import generate_password_hash, check_password_hash

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

# ──────────────────────────────────────────────
# Data helpers — delegated to db.py
# ──────────────────────────────────────────────
import db as _db

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def load_users():        return _db.load_users()
def save_users(d):       _db.save_users(d)
def load_prompts():      return _db.load_prompts()
def save_prompts(d):     _db.save_prompts(d)
def load_reports():      return _db.load_reports()
def save_reports(d):     _db.save_reports(d)
def load_audit():        return _db.load_audit()
def save_audit(d):       _db.save_audit(d)
def load_announcements():return _db.load_announcements()
def save_announcements(d):_db.save_announcements(d)
def load_pages():        return _db.load_pages()
def save_pages(d):       _db.save_pages(d)
def load_search_log():   return _db.load_search_log()
def save_search_log(d):  pass  # append-only
def load_tags_config():  return _db.load_tags_config()
def save_tags_config(d): _db.save_tags_config(d)
def load_rate_log():     return _db.load_rate_log()
def save_rate_log(d):    pass  # append-only

def load_categories():
    return _db.load_categories()

def save_categories(cats):
    _db.save_categories(cats)
    # Sync with main app module
    try:
        import app as app_module
        app_module.CATEGORIES = cats
    except Exception:
        pass

def prompt_upvotes(p):
    return len(p.get("upvoted_by", []))

# ──────────────────────────────────────────────
# Admin credentials (env vars or is_admin flag)
# ──────────────────────────────────────────────
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "changeme123")

def get_admin():
    admin_id = session.get("admin_id")
    if not admin_id:
        return None
    if admin_id == "__env_admin__":
        return {"username": ADMIN_USERNAME, "is_admin": True, "id": "__env_admin__"}
    users = load_users()
    user = next((u for u in users if u["id"] == admin_id), None)
    if user and (user.get("is_admin") or user.get("is_moderator")):
        return user
    return None

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not get_admin():
            return redirect(url_for("admin.admin_login"))
        return f(*args, **kwargs)
    return decorated

def superadmin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        adm = get_admin()
        if not adm:
            return redirect(url_for("admin.admin_login"))
        if not adm.get("is_admin") and adm.get("id") != "__env_admin__":
            flash("This area requires full admin access.", "error")
            return redirect(url_for("admin.dashboard"))
        return f(*args, **kwargs)
    return decorated

def audit(action, detail="", adm=None):
    if adm is None:
        adm = get_admin()
    log = load_audit()
    log.append({
        "id": "al_" + uuid.uuid4().hex[:8],
        "timestamp": datetime.now().isoformat(),
        "admin": adm["username"] if adm else "system",
        "action": action,
        "detail": detail,
    })
    if len(log) > 10000:
        log = log[-10000:]
    save_audit(log)

# ──────────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────────

@admin_bp.route("/login", methods=["GET", "POST"])
def admin_login():
    if get_admin():
        return redirect(url_for("admin.dashboard"))
    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        # Env-var super admin
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session["admin_id"] = "__env_admin__"
            audit("admin_login", f"Env admin '{username}' logged in")
            return redirect(url_for("admin.dashboard"))
        # User with is_admin or is_moderator flag
        users = load_users()
        user = next((u for u in users if u["username"] == username), None)
        if user and (user.get("is_admin") or user.get("is_moderator")):
            if check_password_hash(user["password_hash"], password):
                session["admin_id"] = user["id"]
                audit("admin_login", f"Admin '{username}' logged in", adm=user)
                return redirect(url_for("admin.dashboard"))
        error = "Invalid credentials or insufficient permissions."
    return render_template("admin/login.html", error=error)


@admin_bp.route("/logout")
def admin_logout():
    adm = get_admin()
    if adm:
        audit("admin_logout", f"Admin '{adm['username']}' logged out")
    session.pop("admin_id", None)
    return redirect(url_for("admin.admin_login"))


# ──────────────────────────────────────────────
# DASHBOARD
# ──────────────────────────────────────────────

@admin_bp.route("/")
@admin_required
def dashboard():
    adm = get_admin()
    users = load_users()
    prompts = load_prompts()
    reports = load_reports()
    now = datetime.now()

    total_users    = len(users)
    total_prompts  = len(prompts)
    total_views    = sum(p.get("views", 0) for p in prompts)
    total_upvotes  = sum(prompt_upvotes(p) for p in prompts)
    pending_count  = len([p for p in prompts if p.get("status") == "pending"])
    hidden_count   = len([p for p in prompts if p.get("status") == "hidden"])
    open_reports   = len([r for r in reports if not r.get("resolved")])
    banned_users   = len([u for u in users if u.get("is_banned")])

    # Signups last 7 days for mini chart
    signups_by_day = defaultdict(int)
    for u in users:
        try:
            d = datetime.strptime(u["created"], "%Y-%m-%d")
            if (now - d).days <= 6:
                signups_by_day[u["created"]] += 1
        except Exception:
            pass
    days = []
    for i in range(6, -1, -1):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        days.append({"date": d[-5:], "count": signups_by_day.get(d, 0)})

    # Recent audit entries
    audit_log = list(reversed(load_audit()))[:8]

    # Feature 8: Request counts
    try:
        all_requests = _db.load_requests()
        open_requests_count = len([r for r in all_requests if r.get("status", "open") == "open"])
        total_requests = len(all_requests)
    except:
        open_requests_count = 0
        total_requests = 0

    return render_template("admin/dashboard.html",
        adm=adm,
        total_users=total_users, total_prompts=total_prompts,
        total_views=total_views, total_upvotes=total_upvotes,
        pending_count=pending_count, hidden_count=hidden_count,
        open_reports=open_reports, banned_users=banned_users,
        signups_chart=days, audit_log=audit_log,
        open_requests_count=open_requests_count, total_requests=total_requests,
    )


# ──────────────────────────────────────────────
# USER MANAGEMENT
# ──────────────────────────────────────────────

@admin_bp.route("/users")
@admin_required
def users_list():
    adm = get_admin()
    users = load_users()
    prompts = load_prompts()

    prompt_counts  = Counter(p["author"] for p in prompts)
    upvote_counts  = defaultdict(int)
    for p in prompts:
        upvote_counts[p["author"]] += prompt_upvotes(p)

    search      = request.args.get("q", "").lower()
    filter_flag = request.args.get("filter", "")

    enriched = []
    for u in users:
        if search and search not in u["username"].lower():
            continue
        if filter_flag == "banned"    and not u.get("is_banned"):       continue
        if filter_flag == "mod"       and not u.get("is_moderator"):    continue
        if filter_flag == "admin"     and not u.get("is_admin"):        continue
        if filter_flag == "modqueue"  and not u.get("needs_moderation"):continue
        enriched.append({
            **u,
            "prompt_count":     prompt_counts.get(u["username"], 0),
            "upvotes_received": upvote_counts.get(u["username"], 0),
        })

    enriched.sort(key=lambda u: u.get("created", ""), reverse=True)
    return render_template("admin/users.html",
        adm=adm, users=enriched, search=search, filter_flag=filter_flag,
        total_all=len(users),
        total_banned=len([u for u in users if u.get("is_banned")]),
        total_mod=len([u for u in users if u.get("is_moderator")]),
        total_modqueue=len([u for u in users if u.get("needs_moderation")]),
    )


@admin_bp.route("/users/<user_id>")
@admin_required
def user_detail(user_id):
    adm = get_admin()
    users = load_users()
    user = next((u for u in users if u["id"] == user_id), None)
    if not user:
        abort(404)
    prompts = load_prompts()
    user_prompts = [p for p in prompts if p["author"] == user["username"]]
    upvotes_received = sum(prompt_upvotes(p) for p in user_prompts)
    return render_template("admin/user_detail.html",
        adm=adm, user=user,
        user_prompts=user_prompts,
        upvotes_received=upvotes_received,
    )


@admin_bp.route("/users/<user_id>/ban", methods=["POST"])
@admin_required
def ban_user(user_id):
    users = load_users()
    user = next((u for u in users if u["id"] == user_id), None)
    if not user: abort(404)
    reason = request.form.get("reason", "").strip()
    user["is_banned"]     = True
    user["banned_reason"] = reason
    save_users(users)
    audit("ban_user", f"Banned '{user['username']}'. Reason: {reason or 'none'}")
    flash(f"User '{user['username']}' banned.", "success")
    return redirect(url_for("admin.user_detail", user_id=user_id))


@admin_bp.route("/users/<user_id>/unban", methods=["POST"])
@admin_required
def unban_user(user_id):
    users = load_users()
    user = next((u for u in users if u["id"] == user_id), None)
    if not user: abort(404)
    user["is_banned"] = False
    user.pop("banned_reason", None)
    save_users(users)
    audit("unban_user", f"Unbanned '{user['username']}'")
    flash(f"User '{user['username']}' unbanned.", "success")
    return redirect(url_for("admin.user_detail", user_id=user_id))


@admin_bp.route("/users/<user_id>/delete", methods=["POST"])
@superadmin_required
def delete_user(user_id):
    users = load_users()
    user = next((u for u in users if u["id"] == user_id), None)
    if not user: abort(404)
    delete_prompts_flag = request.form.get("delete_prompts") == "1"
    username = user["username"]
    users = [u for u in users if u["id"] != user_id]
    save_users(users)
    if delete_prompts_flag:
        prompts = load_prompts()
        prompts = [p for p in prompts if p["author"] != username]
        save_prompts(prompts)
        audit("delete_user", f"Deleted user '{username}' + all their prompts")
    else:
        audit("delete_user", f"Deleted user '{username}' (prompts kept)")
    flash(f"User '{username}' deleted.", "success")
    return redirect(url_for("admin.users_list"))


@admin_bp.route("/users/<user_id>/promote", methods=["POST"])
@superadmin_required
def promote_user(user_id):
    users = load_users()
    user = next((u for u in users if u["id"] == user_id), None)
    if not user: abort(404)
    role = request.form.get("role", "moderator")
    user["is_moderator"] = (role == "moderator")
    user["is_admin"]     = (role == "admin")
    save_users(users)
    audit("promote_user", f"Promoted '{user['username']}' to {role}")
    flash(f"'{user['username']}' promoted to {role}.", "success")
    return redirect(url_for("admin.user_detail", user_id=user_id))


@admin_bp.route("/users/<user_id>/demote", methods=["POST"])
@superadmin_required
def demote_user(user_id):
    users = load_users()
    user = next((u for u in users if u["id"] == user_id), None)
    if not user: abort(404)
    user["is_moderator"] = False
    user["is_admin"]     = False
    save_users(users)
    audit("demote_user", f"Demoted '{user['username']}' to regular user")
    flash(f"'{user['username']}' demoted.", "success")
    return redirect(url_for("admin.user_detail", user_id=user_id))


@admin_bp.route("/users/<user_id>/toggle-modqueue", methods=["POST"])
@admin_required
def toggle_modqueue(user_id):
    users = load_users()
    user = next((u for u in users if u["id"] == user_id), None)
    if not user: abort(404)
    user["needs_moderation"] = not user.get("needs_moderation", False)
    save_users(users)
    state = "added to" if user["needs_moderation"] else "removed from"
    audit("toggle_modqueue", f"User '{user['username']}' {state} moderation queue")
    flash(f"'{user['username']}' {state} moderation queue.", "success")
    return redirect(url_for("admin.user_detail", user_id=user_id))


# ──────────────────────────────────────────────
# PROMPT MODERATION
# ──────────────────────────────────────────────

@admin_bp.route("/prompts")
@admin_required
def admin_prompts():
    adm = get_admin()
    prompts = load_prompts()
    categories = load_categories()

    status_filter   = request.args.get("status", "")
    search          = request.args.get("q", "").lower()
    category_filter = request.args.get("category", "")

    all_prompts = prompts  # keep full set for stats
    if status_filter:
        prompts = [p for p in prompts if p.get("status", "published") == status_filter]
    if search:
        prompts = [p for p in prompts
                   if search in p["title"].lower() or search in p["author"].lower()]
    if category_filter:
        prompts = [p for p in prompts if p["category"] == category_filter]

    prompts = sorted(prompts, key=lambda p: p.get("created", ""), reverse=True)

    stats = {
        "total":     len(all_prompts),
        "published": len([p for p in all_prompts if p.get("status", "published") == "published"]),
        "pending":   len([p for p in all_prompts if p.get("status") == "pending"]),
        "hidden":    len([p for p in all_prompts if p.get("status") == "hidden"]),
    }

    return render_template("admin/prompts.html",
        adm=adm, prompts=prompts, stats=stats,
        status_filter=status_filter, search=search,
        category_filter=category_filter, categories=categories,
    )


@admin_bp.route("/prompts/<prompt_id>/approve", methods=["POST"])
@admin_required
def approve_prompt(prompt_id):
    prompts = load_prompts()
    p = next((x for x in prompts if x["id"] == prompt_id), None)
    if not p: abort(404)
    p["status"] = "published"
    save_prompts(prompts)
    audit("approve_prompt", f"Approved '{p['title']}' by {p['author']}")
    flash("Prompt approved and published.", "success")
    return redirect(request.referrer or url_for("admin.admin_prompts"))


@admin_bp.route("/prompts/<prompt_id>/hide", methods=["POST"])
@admin_required
def hide_prompt(prompt_id):
    prompts = load_prompts()
    p = next((x for x in prompts if x["id"] == prompt_id), None)
    if not p: abort(404)
    p["status"] = "hidden"
    save_prompts(prompts)
    audit("hide_prompt", f"Hid '{p['title']}' by {p['author']}")
    flash("Prompt hidden.", "success")
    return redirect(request.referrer or url_for("admin.admin_prompts"))


@admin_bp.route("/prompts/<prompt_id>/publish", methods=["POST"])
@admin_required
def publish_prompt(prompt_id):
    prompts = load_prompts()
    p = next((x for x in prompts if x["id"] == prompt_id), None)
    if not p: abort(404)
    p["status"] = "published"
    save_prompts(prompts)
    audit("publish_prompt", f"Published '{p['title']}' by {p['author']}")
    flash("Prompt published.", "success")
    return redirect(request.referrer or url_for("admin.admin_prompts"))


@admin_bp.route("/prompts/<prompt_id>/pin", methods=["POST"])
@admin_required
def pin_prompt(prompt_id):
    prompts = load_prompts()
    p = next((x for x in prompts if x["id"] == prompt_id), None)
    if not p: abort(404)
    p["pinned"] = not p.get("pinned", False)
    state = "pinned" if p["pinned"] else "unpinned"
    save_prompts(prompts)
    audit(f"{state}_prompt", f"{state.capitalize()} '{p['title']}'")
    flash(f"Prompt {state}.", "success")
    return redirect(request.referrer or url_for("admin.admin_prompts"))


@admin_bp.route("/prompts/<prompt_id>/delete", methods=["POST"])
@admin_required
def admin_delete_prompt(prompt_id):
    prompts = load_prompts()
    p = next((x for x in prompts if x["id"] == prompt_id), None)
    if not p: abort(404)
    title, author = p["title"], p["author"]
    prompts = [x for x in prompts if x["id"] != prompt_id]
    save_prompts(prompts)
    users = load_users()
    for u in users:
        if prompt_id in u.get("bookmarks", []):
            u["bookmarks"].remove(prompt_id)
    save_users(users)
    audit("delete_prompt", f"Deleted '{title}' by {author}")
    flash("Prompt deleted.", "success")
    return redirect(request.referrer or url_for("admin.admin_prompts"))


@admin_bp.route("/prompts/<prompt_id>/edit", methods=["GET", "POST"])
@admin_required
def admin_edit_prompt(prompt_id):
    adm = get_admin()
    prompts = load_prompts()
    p = next((x for x in prompts if x["id"] == prompt_id), None)
    if not p: abort(404)
    categories = load_categories()
    errors = []

    if request.method == "POST":
        title    = request.form.get("title", "").strip()
        category = request.form.get("category", "")
        text     = request.form.get("text", "").strip()
        tags_raw = request.form.get("tags", "")
        tags     = [t.strip().lower() for t in tags_raw.split(",") if t.strip()][:8]
        status   = request.form.get("status", "published")
        pinned   = request.form.get("pinned") == "1"

        if not title:          errors.append("Title is required.")
        if not text or len(text) < 20: errors.append("Prompt text too short (min 20 chars).")

        if not errors:
            model = request.form.get("model", "")
            p.update(title=title[:120], category=category, text=text[:5000],
                     tags=tags, status=status, pinned=pinned)
            if model: p["model"] = model
            else: p.pop("model", None)
            save_prompts(prompts)
            audit("edit_prompt", f"Edited '{title}' by {p['author']}")
            flash("Prompt updated.", "success")
            return redirect(url_for("admin.admin_prompts"))

    return render_template("admin/edit_prompt.html",
        adm=adm, prompt=p, errors=errors, categories=categories,
        model_options=["GPT-4o","Claude 3.5 Sonnet","Gemini 1.5 Pro","DALL-E 3","Midjourney","Stable Diffusion","LLaMA 3","Any"])


@admin_bp.route("/prompts/bulk", methods=["POST"])
@admin_required
def bulk_prompts():
    action = request.form.get("action")
    ids    = request.form.getlist("ids")
    if not ids:
        flash("No prompts selected.", "warning")
        return redirect(url_for("admin.admin_prompts"))

    prompts  = load_prompts()
    affected = 0

    if action == "delete":
        to_del  = {p["id"] for p in prompts if p["id"] in ids}
        prompts = [p for p in prompts if p["id"] not in to_del]
        save_prompts(prompts)
        affected = len(to_del)
        audit("bulk_delete", f"Bulk deleted {affected} prompts")
        flash(f"Deleted {affected} prompts.", "success")

    elif action in ("hide", "publish", "approve"):
        new_status = "hidden" if action == "hide" else "published"
        for p in prompts:
            if p["id"] in ids:
                p["status"] = new_status
                affected += 1
        save_prompts(prompts)
        audit(f"bulk_{action}", f"Bulk {action}d {affected} prompts")
        flash(f"{action.capitalize()}d {affected} prompts.", "success")

    elif action == "change_category":
        new_cat = request.form.get("new_category", "")
        if new_cat:
            for p in prompts:
                if p["id"] in ids:
                    p["category"] = new_cat
                    affected += 1
            save_prompts(prompts)
            audit("bulk_change_category", f"Bulk moved {affected} prompts to '{new_cat}'")
            flash(f"Changed category for {affected} prompts.", "success")

    return redirect(url_for("admin.admin_prompts"))


# ──────────────────────────────────────────────
# REPORTS
# ──────────────────────────────────────────────

@admin_bp.route("/reports")
@admin_required
def reports():
    adm  = get_admin()
    rpts = load_reports()
    prompts = load_prompts()
    show = request.args.get("show", "open")

    if show == "open":
        rpts = [r for r in rpts if not r.get("resolved")]
    elif show == "resolved":
        rpts = [r for r in rpts if r.get("resolved")]

    prompt_map = {p["id"]: p for p in prompts}
    enriched = []
    for r in rpts:
        r = dict(r)
        r["prompt"] = prompt_map.get(r.get("prompt_id"), {})
        enriched.append(r)

    enriched.sort(key=lambda r: r.get("created", ""), reverse=True)
    return render_template("admin/reports.html",
        adm=adm, reports=enriched, show=show,
        open_count=len([r for r in load_reports() if not r.get("resolved")]),
        resolved_count=len([r for r in load_reports() if r.get("resolved")]),
    )


@admin_bp.route("/reports/<report_id>/resolve", methods=["POST"])
@admin_required
def resolve_report(report_id):
    rpts = load_reports()
    r = next((x for x in rpts if x["id"] == report_id), None)
    if not r: abort(404)
    r["resolved"]    = True
    r["resolved_by"] = get_admin()["username"]
    r["resolved_at"] = datetime.now().isoformat()
    save_reports(rpts)
    audit("resolve_report", f"Resolved report {report_id}")
    flash("Report resolved.", "success")
    return redirect(url_for("admin.reports"))


@admin_bp.route("/reports/<report_id>/dismiss", methods=["POST"])
@admin_required
def dismiss_report(report_id):
    rpts = load_reports()
    r = next((x for x in rpts if x["id"] == report_id), None)
    if not r: abort(404)
    r["resolved"]    = True
    r["dismissed"]   = True
    r["resolved_by"] = get_admin()["username"]
    r["resolved_at"] = datetime.now().isoformat()
    save_reports(rpts)
    audit("dismiss_report", f"Dismissed report {report_id}")
    flash("Report dismissed.", "success")
    return redirect(url_for("admin.reports"))


# ──────────────────────────────────────────────
# CATEGORIES
# ──────────────────────────────────────────────

@admin_bp.route("/categories")
@admin_required
def categories_page():
    adm = get_admin()
    cats = load_categories()
    prompts = load_prompts()
    cat_counts = Counter(p["category"] for p in prompts)
    cats_enriched = [{"name": c, "count": cat_counts.get(c, 0)} for c in cats]
    return render_template("admin/categories.html", adm=adm, categories=cats_enriched)


@admin_bp.route("/categories/add", methods=["POST"])
@superadmin_required
def add_category():
    name = request.form.get("name", "").strip()
    if not name:
        flash("Category name required.", "error")
        return redirect(url_for("admin.categories_page"))
    cats = load_categories()
    if name not in cats:
        cats.append(name)
        save_categories(cats)
        audit("add_category", f"Added category '{name}'")
        flash(f"Category '{name}' added.", "success")
    else:
        flash("Category already exists.", "warning")
    return redirect(url_for("admin.categories_page"))


@admin_bp.route("/categories/rename", methods=["POST"])
@superadmin_required
def rename_category():
    old = request.form.get("old_name", "").strip()
    new = request.form.get("new_name", "").strip()
    cats = load_categories()
    if old not in cats:
        flash("Category not found.", "error")
        return redirect(url_for("admin.categories_page"))
    cats[cats.index(old)] = new
    save_categories(cats)
    prompts = load_prompts()
    for p in prompts:
        if p["category"] == old:
            p["category"] = new
    save_prompts(prompts)
    audit("rename_category", f"Renamed category '{old}' → '{new}'")
    flash(f"Category renamed to '{new}'.", "success")
    return redirect(url_for("admin.categories_page"))


@admin_bp.route("/categories/delete", methods=["POST"])
@superadmin_required
def delete_category():
    name = request.form.get("name", "").strip()
    cats = load_categories()
    if name in cats:
        cats.remove(name)
        save_categories(cats)
        audit("delete_category", f"Deleted category '{name}'")
        flash(f"Category '{name}' removed.", "success")
    return redirect(url_for("admin.categories_page"))


# ──────────────────────────────────────────────
# TAGS
# ──────────────────────────────────────────────

@admin_bp.route("/tags")
@admin_required
def tags_page():
    adm = get_admin()
    prompts    = load_prompts()
    tags_cfg   = load_tags_config()
    tag_counter = Counter()
    for p in prompts:
        for t in p.get("tags", []):
            tag_counter[t] += 1
    tags_list = [{"name": t, "count": c} for t, c in tag_counter.most_common(200)]
    return render_template("admin/tags.html",
        adm=adm, tags=tags_list, tags_config=tags_cfg)


@admin_bp.route("/tags/merge", methods=["POST"])
@admin_required
def merge_tags():
    source = request.form.get("source", "").strip().lower()
    target = request.form.get("target", "").strip().lower()
    if not source or not target or source == target:
        flash("Invalid merge — need two different tags.", "error")
        return redirect(url_for("admin.tags_page"))
    prompts  = load_prompts()
    affected = 0
    for p in prompts:
        tags = p.get("tags", [])
        if source in tags:
            tags.remove(source)
            if target not in tags:
                tags.append(target)
            p["tags"] = tags
            affected += 1
    save_prompts(prompts)
    cfg = load_tags_config()
    cfg["merges"][source] = target
    save_tags_config(cfg)
    audit("merge_tags", f"Merged '{source}' → '{target}' ({affected} prompts)")
    flash(f"Merged '{source}' into '{target}' on {affected} prompts.", "success")
    return redirect(url_for("admin.tags_page"))


@admin_bp.route("/tags/rename", methods=["POST"])
@admin_required
def rename_tag():
    old = request.form.get("old", "").strip().lower()
    new = request.form.get("new", "").strip().lower()
    if not old or not new:
        flash("Both old and new tag names required.", "error")
        return redirect(url_for("admin.tags_page"))
    prompts  = load_prompts()
    affected = 0
    for p in prompts:
        tags = p.get("tags", [])
        if old in tags:
            tags.remove(old)
            if new not in tags:
                tags.append(new)
            p["tags"] = tags
            affected += 1
    save_prompts(prompts)
    cfg = load_tags_config()
    cfg["renamed"][old] = new
    save_tags_config(cfg)
    audit("rename_tag", f"Renamed tag '{old}' → '{new}' ({affected} prompts)")
    flash(f"Tag '{old}' renamed to '{new}'.", "success")
    return redirect(url_for("admin.tags_page"))


@admin_bp.route("/tags/blacklist", methods=["POST"])
@admin_required
def blacklist_tag():
    tag = request.form.get("tag", "").strip().lower()
    if not tag:
        flash("Tag name required.", "error")
        return redirect(url_for("admin.tags_page"))
    cfg = load_tags_config()
    if tag not in cfg["blacklist"]:
        cfg["blacklist"].append(tag)
    save_tags_config(cfg)
    prompts  = load_prompts()
    affected = 0
    for p in prompts:
        if tag in p.get("tags", []):
            p["tags"].remove(tag)
            affected += 1
    save_prompts(prompts)
    audit("blacklist_tag", f"Blacklisted tag '{tag}' ({affected} prompts cleaned)")
    flash(f"Tag '{tag}' blacklisted and removed from {affected} prompts.", "success")
    return redirect(url_for("admin.tags_page"))


@admin_bp.route("/tags/unblacklist", methods=["POST"])
@admin_required
def unblacklist_tag():
    tag = request.form.get("tag", "").strip().lower()
    cfg = load_tags_config()
    if tag in cfg["blacklist"]:
        cfg["blacklist"].remove(tag)
    save_tags_config(cfg)
    audit("unblacklist_tag", f"Removed '{tag}' from blacklist")
    flash(f"Tag '{tag}' removed from blacklist.", "success")
    return redirect(url_for("admin.tags_page"))


# ──────────────────────────────────────────────
# ANALYTICS
# ──────────────────────────────────────────────

@admin_bp.route("/analytics")
@admin_required
def analytics():
    adm     = get_admin()
    prompts = load_prompts()
    users   = load_users()
    search_log = load_search_log()
    now     = datetime.now()

    def in_days(date_str, days):
        try:
            d = datetime.strptime(date_str[:10], "%Y-%m-%d")
            return (now - d).days <= days
        except Exception:
            return False

    def top_by(key_fn, days=None, n=10):
        pool = [p for p in prompts if days is None or in_days(p.get("created",""), days)]
        return sorted(pool, key=key_fn, reverse=True)[:n]

    # Signups per day — last 30 days
    signups_by_day = defaultdict(int)
    for u in users:
        d = u.get("created", "")
        if d and in_days(d, 29):
            signups_by_day[d] += 1
    signups_chart = []
    for i in range(29, -1, -1):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        signups_chart.append({"date": d, "count": signups_by_day.get(d, 0)})

    # Active users
    prompt_counts = Counter(p["author"] for p in prompts)
    upvote_counts = defaultdict(int)
    for p in prompts:
        upvote_counts[p["author"]] += prompt_upvotes(p)
    active_users = sorted(
        [{"username": u["username"],
          "prompts":  prompt_counts.get(u["username"], 0),
          "upvotes":  upvote_counts.get(u["username"], 0)}
         for u in users],
        key=lambda x: x["prompts"] + x["upvotes"], reverse=True
    )[:10]

    # Top searches
    search_counter = Counter(s.get("query","").lower() for s in search_log if s.get("query"))
    top_searches   = search_counter.most_common(20)

    return render_template("admin/analytics.html",
        adm=adm,
        week_views    = top_by(lambda p: p.get("views",0), 7),
        month_views   = top_by(lambda p: p.get("views",0), 30),
        all_views     = top_by(lambda p: p.get("views",0)),
        week_upvotes  = top_by(prompt_upvotes, 7),
        month_upvotes = top_by(prompt_upvotes, 30),
        all_upvotes   = top_by(prompt_upvotes),
        signups_chart = signups_chart,
        active_users  = active_users,
        top_searches  = top_searches,
        total_searches= len(search_log),
    )


# ──────────────────────────────────────────────
# AUDIT LOG
# ──────────────────────────────────────────────

@admin_bp.route("/audit")
@superadmin_required
def audit_log_page():
    adm     = get_admin()
    log     = list(reversed(load_audit()))
    filter_admin  = request.args.get("admin_filter", "")
    filter_action = request.args.get("action_filter", "")
    if filter_admin:
        log = [e for e in log if e.get("admin") == filter_admin]
    if filter_action:
        log = [e for e in log if filter_action in e.get("action","")]
    full_log = load_audit()
    all_admins  = sorted(set(e.get("admin","") for e in full_log))
    all_actions = sorted(set(e.get("action","") for e in full_log))
    return render_template("admin/audit_log.html",
        adm=adm, log=log[:500],
        all_admins=all_admins, all_actions=all_actions,
        filter_admin=filter_admin, filter_action=filter_action,
    )


# ──────────────────────────────────────────────
# INTEGRITY
# ──────────────────────────────────────────────

@admin_bp.route("/integrity")
@superadmin_required
def integrity():
    adm     = get_admin()
    prompts = load_prompts()
    users   = load_users()

    user_map = {u["username"]: u["id"] for u in users}

    self_upvoters = []
    for p in prompts:
        author_id = user_map.get(p["author"])
        if author_id and author_id in p.get("upvoted_by", []):
            self_upvoters.append({
                "prompt_id":    p["id"],
                "prompt_title": p["title"],
                "author":       p["author"],
            })

    upvote_counts = defaultdict(int)
    for p in prompts:
        upvote_counts[p["author"]] += prompt_upvotes(p)

    suspicious = []
    for username, count in upvote_counts.items():
        if count > 20:
            u = next((u for u in users if u["username"] == username), None)
            if u:
                suspicious.append({"username": username, "upvotes": count, "user": u})
    suspicious.sort(key=lambda x: x["upvotes"], reverse=True)

    rate_log  = load_rate_log()
    ip_counts = Counter(e.get("ip","") for e in rate_log)
    top_ips   = ip_counts.most_common(20)

    return render_template("admin/integrity.html",
        adm=adm,
        self_upvoters=self_upvoters,
        suspicious=suspicious,
        top_ips=top_ips,
        total_rate_events=len(rate_log),
    )


@admin_bp.route("/integrity/remove-self-upvote", methods=["POST"])
@superadmin_required
def remove_self_upvote():
    prompt_id = request.form.get("prompt_id")
    prompts   = load_prompts()
    users     = load_users()
    p = next((x for x in prompts if x["id"] == prompt_id), None)
    if not p: abort(404)
    user_map = {u["username"]: u["id"] for u in users}
    author_id = user_map.get(p["author"])
    if author_id and author_id in p.get("upvoted_by", []):
        p["upvoted_by"].remove(author_id)
    save_prompts(prompts)
    audit("remove_self_upvote", f"Removed self-upvote from '{p['title']}' by {p['author']}")
    flash("Self-upvote removed.", "success")
    return redirect(url_for("admin.integrity"))


# ──────────────────────────────────────────────
# PROMPT REQUESTS (Feature 8 admin)
# ──────────────────────────────────────────────

def load_requests_data(): return _db.load_requests()
def save_requests_data(d): _db.save_requests(d)

@admin_bp.route("/requests")
@admin_required
def admin_requests():
    adm = get_admin()
    reqs = load_requests_data()
    status_filter = request.args.get("status", "")
    if status_filter:
        reqs = [r for r in reqs if r.get("status", "open") == status_filter]
    reqs = sorted(reqs, key=lambda r: r.get("created", ""), reverse=True)
    open_count = len([r for r in load_requests_data() if r.get("status", "open") == "open"])
    return render_template("admin/requests.html", adm=adm, requests=reqs,
        status_filter=status_filter, open_count=open_count)

@admin_bp.route("/requests/<req_id>/close", methods=["POST"])
@admin_required
def close_request(req_id):
    reqs = load_requests_data()
    r = next((x for x in reqs if x["id"] == req_id), None)
    if not r: abort(404)
    r["status"] = "closed"
    save_requests_data(reqs)
    audit("close_request", f"Closed request '{r.get('title', '?')}'")
    flash("Request closed.", "success")
    return redirect(url_for("admin.admin_requests"))

@admin_bp.route("/requests/<req_id>/delete", methods=["POST"])
@admin_required
def delete_request(req_id):
    reqs = load_requests_data()
    reqs = [r for r in reqs if r["id"] != req_id]
    save_requests_data(reqs)
    audit("delete_request", f"Deleted request {req_id}")
    flash("Request deleted.", "success")
    return redirect(url_for("admin.admin_requests"))


# ──────────────────────────────────────────────
# ANNOUNCEMENTS
# ──────────────────────────────────────────────

@admin_bp.route("/announcements")
@admin_required
def announcements():
    adm = get_admin()
    anns = load_announcements()
    return render_template("admin/announcements.html", adm=adm, announcements=anns)


@admin_bp.route("/announcements/add", methods=["POST"])
@admin_required
def add_announcement():
    text  = request.form.get("text", "").strip()
    color = request.form.get("color", "accent")
    if not text:
        flash("Announcement text required.", "error")
        return redirect(url_for("admin.announcements"))
    anns = load_announcements()
    anns.append({
        "id":         "ann_" + uuid.uuid4().hex[:8],
        "text":       text[:500],
        "color":      color,
        "active":     True,
        "created":    datetime.now().isoformat(),
        "created_by": get_admin()["username"],
    })
    save_announcements(anns)
    audit("add_announcement", f"Added announcement: {text[:60]}")
    flash("Announcement added.", "success")
    return redirect(url_for("admin.announcements"))


@admin_bp.route("/announcements/<ann_id>/toggle", methods=["POST"])
@admin_required
def toggle_announcement(ann_id):
    anns = load_announcements()
    ann  = next((a for a in anns if a["id"] == ann_id), None)
    if ann:
        ann["active"] = not ann.get("active", True)
        save_announcements(anns)
        audit("toggle_announcement", f"Toggled announcement {ann_id}")
    flash("Announcement updated.", "success")
    return redirect(url_for("admin.announcements"))


@admin_bp.route("/announcements/<ann_id>/delete", methods=["POST"])
@admin_required
def delete_announcement(ann_id):
    anns = load_announcements()
    anns = [a for a in anns if a["id"] != ann_id]
    save_announcements(anns)
    audit("delete_announcement", f"Deleted announcement {ann_id}")
    flash("Announcement deleted.", "success")
    return redirect(url_for("admin.announcements"))


# ──────────────────────────────────────────────
# EXPORT
# ──────────────────────────────────────────────

@admin_bp.route("/export")
@superadmin_required
def export_page():
    adm = get_admin()
    prompts = load_prompts()
    users   = load_users()
    return render_template("admin/export.html", adm=adm,
        prompt_count=len(prompts), user_count=len(users))


@admin_bp.route("/export/prompts.csv")
@superadmin_required
def export_prompts_csv():
    prompts = load_prompts()
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["id","title","category","author","created","views","upvotes","status","tags","text"])
    for p in prompts:
        w.writerow([p["id"], p["title"], p["category"], p["author"],
                    p.get("created",""), p.get("views",0), prompt_upvotes(p),
                    p.get("status","published"), ",".join(p.get("tags",[])), p["text"]])
    out.seek(0)
    audit("export_prompts_csv", "Exported prompts CSV")
    return Response(out.getvalue(), mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=prompts.csv"})


@admin_bp.route("/export/prompts.json")
@superadmin_required
def export_prompts_json():
    prompts = load_prompts()
    audit("export_prompts_json", "Exported prompts JSON")
    return Response(json.dumps(prompts, indent=2), mimetype="application/json",
        headers={"Content-Disposition": "attachment;filename=prompts.json"})


@admin_bp.route("/export/users.csv")
@superadmin_required
def export_users_csv():
    users = load_users()
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["id","username","created","is_admin","is_moderator","is_banned","needs_moderation"])
    for u in users:
        w.writerow([u["id"], u["username"], u.get("created",""),
                    u.get("is_admin",False), u.get("is_moderator",False),
                    u.get("is_banned",False), u.get("needs_moderation",False)])
    out.seek(0)
    audit("export_users_csv", "Exported users CSV")
    return Response(out.getvalue(), mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=users.csv"})


@admin_bp.route("/export/users.json")
@superadmin_required
def export_users_json():
    users = load_users()
    safe  = [{k: v for k, v in u.items() if k != "password_hash"} for u in users]
    audit("export_users_json", "Exported users JSON")
    return Response(json.dumps(safe, indent=2), mimetype="application/json",
        headers={"Content-Disposition": "attachment;filename=users.json"})


# ──────────────────────────────────────────────
# PAGES (WYSIWYG)
# ──────────────────────────────────────────────

@admin_bp.route("/pages")
@admin_required
def pages_list():
    adm = get_admin()
    pages = load_pages()
    return render_template("admin/pages.html", adm=adm, pages=pages)


@admin_bp.route("/pages/new", methods=["POST"])
@admin_required
def new_page():
    slug = request.form.get("slug","").strip().lower().replace(" ","-")
    if not slug:
        flash("Page slug required.", "error")
        return redirect(url_for("admin.pages_list"))
    return redirect(url_for("admin.edit_page", page_slug=slug))


@admin_bp.route("/pages/<page_slug>/edit", methods=["GET", "POST"])
@admin_required
def edit_page(page_slug):
    adm   = get_admin()
    pages = load_pages()
    page  = next((p for p in pages if p["slug"] == page_slug), None)

    if request.method == "POST":
        content = request.form.get("content", "")
        title   = request.form.get("title", "").strip()
        if page:
            page.update(content=content, title=title,
                updated=datetime.now().isoformat(), updated_by=adm["username"])
        else:
            pages.append({"slug": page_slug, "title": title, "content": content,
                "updated": datetime.now().isoformat(), "updated_by": adm["username"]})
        save_pages(pages)
        audit("edit_page", f"Edited page '{page_slug}'")
        flash("Page saved.", "success")
        return redirect(url_for("admin.pages_list"))

    if not page:
        page = {"slug": page_slug,
                "title": page_slug.replace("-"," ").title(),
                "content": ""}
    return render_template("admin/edit_page.html", adm=adm, page=page)


@admin_bp.route("/pages/<page_slug>/delete", methods=["POST"])
@superadmin_required
def delete_page(page_slug):
    pages = load_pages()
    pages = [p for p in pages if p["slug"] != page_slug]
    save_pages(pages)
    audit("delete_page", f"Deleted page '{page_slug}'")
    flash("Page deleted.", "success")
    return redirect(url_for("admin.pages_list"))
