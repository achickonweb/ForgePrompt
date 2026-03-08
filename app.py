"""
ForgePrompt — app.py (Supabase backend)
All data operations go through db.py → Supabase.
"""
import os, uuid, math, hashlib, json
from datetime import datetime
from functools import wraps
from flask import (
    Flask, render_template, request, jsonify,
    abort, session, redirect, url_for, flash, Response
)
from werkzeug.security import generate_password_hash, check_password_hash
import db

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "change-this-in-production-abc123xyz")

from admin_bp import admin_bp
app.register_blueprint(admin_bp)

AVATAR_COLORS = ["#00ff88","#00d4ff","#ff6b35","#a78bfa","#f472b6","#fbbf24","#34d399","#60a5fa"]
MODEL_OPTIONS = ["GPT-4o","Claude 3.5 Sonnet","Gemini 1.5 Pro","DALL-E 3","Midjourney","Stable Diffusion","LLaMA 3","Any"]
ITEMS_PER_PAGE = 20

def get_categories():
    try: return db.load_categories()
    except: return ["ChatGPT","Coding","Image Generation","Video Generation","Game Development"]

def get_current_user():
    uid=session.get("user_id")
    if not uid: return None
    return db.get_user_by_id(uid)

def prompt_upvotes(p): return len(p.get("upvoted_by",[]))

def enrich_prompt(p, cu=None):
    out=dict(p); out["upvotes"]=prompt_upvotes(p)
    out["user_voted"]=False; out["user_bookmarked"]=False
    if cu:
        out["user_voted"]=cu["id"] in p.get("upvoted_by",[])
        out["user_bookmarked"]=p["id"] in cu.get("bookmarks",[])
    out["verified_models"]=list(set(t.get("model","") for t in p.get("test_results",[]) if t.get("model")))
    return out

def compute_stats():
    prompts=db.load_prompts(); users=db.load_users()
    pub=[p for p in prompts if p.get("status","published")=="published"]
    cats=get_categories()
    return {"total_prompts":len(pub),"total_categories":len(cats),
            "total_tools":5,"total_views":sum(p.get("views",0) for p in pub),
            "total_upvotes":sum(prompt_upvotes(p) for p in pub),"total_users":len(users)}

def log_search(q):
    if not q or len(q.strip())<2: return
    try: db.insert_search_log({"query":q.strip()[:100],"timestamp":datetime.now().isoformat(),"ip":request.remote_addr})
    except: pass

def track_rate(endpoint):
    try: db.insert_rate_log({"ip":request.remote_addr,"endpoint":endpoint,"timestamp":datetime.now().isoformat()})
    except: pass

def load_active_announcements():
    try: return [a for a in db.load_announcements() if a.get("active")]
    except: return []

def login_required(f):
    @wraps(f)
    def decorated(*a,**kw):
        if not session.get("user_id"):
            flash("Please log in to continue.","info")
            return redirect(url_for("login",next=request.path))
        return f(*a,**kw)
    return decorated

def compute_trending_score(p):
    uv=prompt_upvotes(p); v=p.get("views",0)
    try: h=(datetime.now()-datetime.strptime(p.get("created","2020-01-01"),"%Y-%m-%d")).total_seconds()/3600
    except: h=8760
    return uv*3+v*0.5-h*0.1

def count_open_requests():
    try: return len([r for r in db.load_requests() if r.get("status","open")=="open"])
    except: return 0

def search_score(p, terms):
    s=0; tl=p["title"].lower(); xl=p["text"].lower(); gl=" ".join(p.get("tags",[])).lower()
    for t in terms:
        if t in tl: s+=10
        if t in gl: s+=5
        if t in xl: s+=1
    return s

def get_prompt_of_the_day():
    prompts=db.load_prompts()
    pub=[p for p in prompts if p.get("status","published")=="published"]
    if not pub: return None
    h=int(hashlib.md5(datetime.now().strftime("%Y-%m-%d").encode()).hexdigest(),16)
    scored=sorted(pub,key=lambda p:prompt_upvotes(p)*2+p.get("views",0),reverse=True)[:max(20,len(pub))]
    return scored[h%len(scored)]

def push_notification(username, ntype, message, link=""):
    try:
        db.insert_notification({"id":"ntf_"+uuid.uuid4().hex[:8],"user":username,"type":ntype,
            "message":message[:200],"link":link,"created":datetime.now().isoformat(),"read":False})
    except: pass

@app.context_processor
def inject_globals():
    cu=get_current_user()
    anns=load_active_announcements()
    dismissed=session.get("dismissed_announcements",[])
    unread=db.count_unread_notifications(cu["username"]) if cu else 0
    cats=get_categories()
    return {"current_user":cu,"categories":cats,"model_options":MODEL_OPTIONS,
            "announcements":[a for a in anns if a["id"] not in dismissed],
            "is_admin_user":cu and (cu.get("is_admin") or cu.get("is_moderator")),
            "open_requests_count":count_open_requests(),"unread_notif_count":unread}

@app.route("/api/dismiss-announcement/<ann_id>",methods=["POST"])
def dismiss_announcement(ann_id):
    d=session.get("dismissed_announcements",[]); d.append(ann_id); session["dismissed_announcements"]=d
    return jsonify({"ok":True})

@app.route("/page/<slug>")
def custom_page(slug):
    page=db.get_page(slug)
    if not page: abort(404)
    return render_template("custom_page.html",page=page)

# ── Auth ──
@app.route("/register",methods=["GET","POST"])
def register():
    if session.get("user_id"): return redirect(url_for("index"))
    if request.method=="POST":
        username=request.form.get("username","").strip().lower()
        password=request.form.get("password",""); confirm=request.form.get("confirm","")
        errors=[]
        if not username or len(username)<3: errors.append("Username must be at least 3 characters.")
        if not all(c.isalnum() or c in "_-" for c in username): errors.append("Letters, numbers, _ and - only.")
        if len(username)>24: errors.append("Username must be 24 characters or fewer.")
        if not password or len(password)<6: errors.append("Password must be at least 6 characters.")
        if password!=confirm: errors.append("Passwords do not match.")
        if not errors:
            if db.get_user_by_username(username): errors.append("Username already taken.")
        if errors: return render_template("auth/register.html",errors=errors,username=username)
        users=db.load_users()
        nu={"id":"u_"+uuid.uuid4().hex[:10],"username":username,
            "password_hash":generate_password_hash(password),
            "created":datetime.now().strftime("%Y-%m-%d"),"bio":"",
            "avatar_color":AVATAR_COLORS[len(users)%len(AVATAR_COLORS)],
            "bookmarks":[],"following":[],"followers_count":0,
            "is_admin":False,"is_moderator":False,"is_banned":False,
            "banned_reason":"","needs_moderation":False,"accepted_submissions":0}
        db.insert_user(nu); session["user_id"]=nu["id"]
        flash(f"Welcome to ForgePrompt, {username}!","success")
        return redirect(url_for("index"))
    return render_template("auth/register.html",errors=[],username="")

@app.route("/login",methods=["GET","POST"])
def login():
    if session.get("user_id"): return redirect(url_for("index"))
    if request.method=="POST":
        username=request.form.get("username","").strip().lower()
        password=request.form.get("password",""); next_url=request.form.get("next",url_for("index"))
        user=db.get_user_by_username(username)
        if not user or not check_password_hash(user["password_hash"],password):
            return render_template("auth/login.html",error="Invalid username or password.",username=username,next=next_url)
        if user.get("is_banned"):
            return render_template("auth/login.html",error=f"Account banned: {user.get('banned_reason','No reason')}",username=username,next=next_url)
        session["user_id"]=user["id"]; flash(f"Welcome back, {user['username']}!","success")
        return redirect(next_url if next_url.startswith("/") else url_for("index"))
    return render_template("auth/login.html",error=None,username="",next=request.args.get("next",url_for("index")))

@app.route("/logout")
def logout(): session.clear(); flash("You've been logged out.","info"); return redirect(url_for("index"))

@app.route("/settings",methods=["GET","POST"])
@login_required
def settings():
    user=get_current_user(); errors=[]; success=False
    if request.method=="POST":
        action=request.form.get("action")
        if action=="update_bio":
            db.update_user(user["id"], {"bio":request.form.get("bio","").strip()[:280]}); success=True
        elif action=="change_password":
            cp=request.form.get("current_password",""); np_=request.form.get("new_password",""); cp2=request.form.get("confirm_password","")
            if not check_password_hash(user["password_hash"],cp): errors.append("Current password is incorrect.")
            elif len(np_)<6: errors.append("New password must be at least 6 characters.")
            elif np_!=cp2: errors.append("New passwords do not match.")
            else: db.update_user(user["id"],{"password_hash":generate_password_hash(np_)}); success=True
        user=get_current_user()
    return render_template("settings.html",user=user,errors=errors,success=success)

# ── Pages ──
@app.route("/")
def index():
    cu=get_current_user(); prompts=db.load_prompts()
    pub=[p for p in prompts if p.get("status","published")=="published"]
    pinned=[enrich_prompt(p,cu) for p in pub if p.get("pinned")]
    rest=sorted([p for p in pub if not p.get("pinned")],key=prompt_upvotes,reverse=True)
    popular=(pinned+[enrich_prompt(p,cu) for p in rest])[:6]
    potd_raw=get_prompt_of_the_day(); potd=enrich_prompt(potd_raw,cu) if potd_raw else None
    return render_template("index.html",popular_prompts=popular,stats=compute_stats(),potd=potd)

@app.route("/prompts")
def prompts_page():
    cu=get_current_user(); prompts=db.load_prompts(); cats=get_categories()
    category=request.args.get("category",""); search=request.args.get("search","").lower()
    sort_by=request.args.get("sort","upvotes"); tag=request.args.get("tag","")
    model_filter=request.args.get("model",""); page=max(1,int(request.args.get("page","1")))
    if search: log_search(search)
    prompts=[p for p in prompts if p.get("status","published")=="published"]
    if category and category in cats: prompts=[p for p in prompts if p["category"]==category]
    if tag: prompts=[p for p in prompts if tag in p.get("tags",[])]
    if model_filter: prompts=[p for p in prompts if p.get("model","")==model_filter]
    if search:
        terms=search.split()
        prompts=[p for p in prompts if any(t in p["title"].lower() or t in p["text"].lower() or t in " ".join(p.get("tags",[])).lower() for t in terms)]
        if sort_by=="upvotes": prompts=sorted(prompts,key=lambda p:search_score(p,terms),reverse=True)
    if not search or sort_by!="upvotes":
        pinned=[p for p in prompts if p.get("pinned")]; unpinned=[p for p in prompts if not p.get("pinned")]
        if sort_by=="views": unpinned=sorted(unpinned,key=lambda p:p.get("views",0),reverse=True)
        elif sort_by=="newest": unpinned=sorted(unpinned,key=lambda p:p["created"],reverse=True)
        elif sort_by=="trending": unpinned=sorted(unpinned,key=compute_trending_score,reverse=True)
        elif not search: unpinned=sorted(unpinned,key=prompt_upvotes,reverse=True)
        prompts=pinned+unpinned
    total=len(prompts); total_pages=max(1,math.ceil(total/ITEMS_PER_PAGE))
    page=min(page,total_pages); start=(page-1)*ITEMS_PER_PAGE
    enriched=[enrich_prompt(p,cu) for p in prompts[start:start+ITEMS_PER_PAGE]]
    return render_template("prompts.html",prompts=enriched,active_category=category,
        search_query=request.args.get("search",""),sort=sort_by,active_tag=tag,
        active_model=model_filter,page=page,total_pages=total_pages,total_results=total)

@app.route("/prompts/<prompt_id>")
def prompt_detail(prompt_id):
    cu=get_current_user(); prompt=db.get_prompt(prompt_id)
    if not prompt: abort(404)
    is_staff=cu and (cu.get("is_admin") or cu.get("is_moderator"))
    if prompt.get("status")=="hidden" and not is_staff: abort(404)
    if prompt.get("status")=="pending" and not is_staff:
        if not cu or cu["username"]!=prompt["author"]: abort(404)
    vk=f"viewed_{prompt_id}"
    if not session.get(vk):
        db.update_prompt(prompt_id,{"views":prompt.get("views",0)+1}); session[vk]=True
        prompt["views"]=prompt.get("views",0)+1
    all_prompts=db.load_prompts()
    related=[enrich_prompt(p,cu) for p in all_prompts if p["category"]==prompt["category"]
             and p["id"]!=prompt_id and p.get("status","published")=="published"][:3]
    user_collections=[c for c in db.load_collections() if c["owner"]==cu["username"]] if cu else []
    user_chains=[c for c in db.load_chains() if c["owner"]==cu["username"]] if cu else []
    forked_from_prompt=None
    if prompt.get("forked_from"):
        forked_from_prompt=db.get_prompt(prompt["forked_from"])
    return render_template("prompt_detail.html",prompt=enrich_prompt(prompt,cu),
        related=related,user_collections=user_collections,user_chains=user_chains,
        forked_from_prompt=forked_from_prompt)

@app.route("/profile/<username>")
def profile(username):
    cu=get_current_user(); user=db.get_user_by_username(username)
    if not user: abort(404)
    prompts=db.load_prompts(); is_staff=cu and (cu.get("is_admin") or cu.get("is_moderator"))
    user_prompts=[]
    for p in prompts:
        if p["author"]!=username: continue
        status=p.get("status","published")
        if status=="published": user_prompts.append(enrich_prompt(p,cu))
        elif cu and (cu["username"]==username or is_staff): user_prompts.append(enrich_prompt(p,cu))
    user_prompts.sort(key=lambda p:p["created"],reverse=True)
    bookmarked=[]
    if cu and cu["id"]==user["id"]:
        bookmarked=[enrich_prompt(p,cu) for p in prompts if p["id"] in user.get("bookmarks",[])]
    is_following=cu and username in cu.get("following",[]) if cu else False
    return render_template("profile.html",profile_user=user,user_prompts=user_prompts,
        bookmarked=bookmarked,is_own_profile=(cu and cu["id"]==user["id"]),
        is_following=is_following,follower_count=user.get("followers_count",0))

@app.route("/tools")
def tools_page(): return render_template("tools.html")
@app.route("/tools/<tool_name>")
def tool_detail(tool_name):
    valid=["json-formatter","base64","password-generator","uuid-generator","text-counter"]
    if tool_name not in valid: abort(404)
    return render_template(f"tools/{tool_name}.html")

@app.route("/prompts/<prompt_id>/edit",methods=["GET","POST"])
@login_required
def edit_prompt(prompt_id):
    cu=get_current_user(); prompt=db.get_prompt(prompt_id)
    if not prompt: abort(404)
    if prompt["author"]!=cu["username"] and not cu.get("is_admin") and not cu.get("is_moderator"): abort(403)
    cats=get_categories(); errors=[]
    if request.method=="POST":
        title=request.form.get("title","").strip(); category=request.form.get("category","")
        text=request.form.get("text","").strip(); tags_raw=request.form.get("tags","")
        tags=[t.strip().lower() for t in tags_raw.split(",") if t.strip()][:8]
        model=request.form.get("model","")
        if not title: errors.append("Title is required.")
        if not category or category not in cats: errors.append("Invalid category.")
        if not text or len(text)<20: errors.append("Prompt text must be at least 20 characters.")
        if not errors:
            old_text=prompt.get("text","")
            updates={"title":title[:120],"category":category,"text":text[:5000],"tags":tags}
            if old_text!=text:
                versions=prompt.get("versions",[])
                versions.append({"text":old_text,"title":prompt.get("title",""),
                    "saved":datetime.now().isoformat(),"by":cu["username"]})
                if len(versions)>20: versions=versions[-20:]
                updates["versions"]=versions
            if model and model in MODEL_OPTIONS: updates["model"]=model
            else: updates["model"]=""
            db.update_prompt(prompt_id,updates)
            flash("Prompt updated successfully.","success")
            return redirect(url_for("prompt_detail",prompt_id=prompt_id))
    return render_template("edit_prompt.html",prompt=prompt,errors=errors)

@app.route("/prompts/<prompt_id>/delete",methods=["POST"])
@login_required
def delete_prompt(prompt_id):
    cu=get_current_user(); prompt=db.get_prompt(prompt_id)
    if not prompt: abort(404)
    if prompt["author"]!=cu["username"] and not cu.get("is_admin") and not cu.get("is_moderator"): abort(403)
    db.delete_prompt(prompt_id)
    # Remove from bookmarks
    users=db.load_users()
    for u in users:
        if prompt_id in u.get("bookmarks",[]):
            bk=u["bookmarks"]; bk.remove(prompt_id)
            db.update_user(u["id"],{"bookmarks":bk})
    flash("Prompt deleted.","info")
    return redirect(url_for("profile",username=cu["username"]))

@app.route("/prompts/<prompt_id>/history")
def prompt_history(prompt_id):
    prompt=db.get_prompt(prompt_id)
    if not prompt: abort(404)
    return render_template("prompt_history.html",prompt=prompt,versions=list(reversed(prompt.get("versions",[]))))

# ── API: Prompts ──
@app.route("/api/prompts",methods=["GET"])
def api_get_prompts():
    cu=get_current_user(); prompts=db.load_prompts()
    category=request.args.get("category",""); search=request.args.get("search","").lower()
    sort_by=request.args.get("sort","upvotes"); model_filter=request.args.get("model","")
    if search: log_search(search)
    prompts=[p for p in prompts if p.get("status","published")=="published"]
    if category: prompts=[p for p in prompts if p["category"]==category]
    if model_filter: prompts=[p for p in prompts if p.get("model","")==model_filter]
    if search:
        terms=search.split()
        prompts=[p for p in prompts if any(t in p["title"].lower() or t in p["text"].lower() for t in terms)]
    pinned=[p for p in prompts if p.get("pinned")]; unpinned=[p for p in prompts if not p.get("pinned")]
    if sort_by=="views": unpinned=sorted(unpinned,key=lambda p:p.get("views",0),reverse=True)
    elif sort_by=="newest": unpinned=sorted(unpinned,key=lambda p:p["created"],reverse=True)
    elif sort_by=="trending": unpinned=sorted(unpinned,key=compute_trending_score,reverse=True)
    else: unpinned=sorted(unpinned,key=prompt_upvotes,reverse=True)
    return jsonify({"prompts":[enrich_prompt(p,cu) for p in pinned+unpinned],"total":len(pinned+unpinned)})

@app.route("/api/prompts/<prompt_id>",methods=["GET"])
def api_get_prompt(prompt_id):
    cu=get_current_user(); prompt=db.get_prompt(prompt_id)
    if not prompt: return jsonify({"error":"Not found"}),404
    if prompt.get("status")=="hidden" and not (cu and (cu.get("is_admin") or cu.get("is_moderator"))): return jsonify({"error":"Not found"}),404
    return jsonify(enrich_prompt(prompt,cu))

@app.route("/api/prompts",methods=["POST"])
@login_required
def api_create_prompt():
    cu=get_current_user()
    if cu.get("is_banned"): return jsonify({"error":"Account banned."}),403
    data=request.get_json() or {}
    for field in ["title","category","text"]:
        if not data.get(field): return jsonify({"error":f"Missing field: {field}"}),400
    cats=get_categories()
    if data["category"] not in cats: return jsonify({"error":"Invalid category"}),400
    if len(data["text"])<20: return jsonify({"error":"Prompt text too short (min 20 chars)"}),400
    tc=db.load_tags_config(); blacklist=tc.get("blacklist",[])
    tags=[t.strip().lower() for t in data.get("tags",[]) if t.strip()][:8]
    tags=[t for t in tags if t not in blacklist]
    status="pending" if cu.get("needs_moderation") else "published"
    model=data.get("model","")
    np_={"id":"p"+uuid.uuid4().hex[:8],"title":data["title"][:120],"category":data["category"],
        "text":data["text"][:5000],"tags":tags,"upvoted_by":[],"views":0,
        "author":cu["username"],"created":datetime.now().strftime("%Y-%m-%d"),
        "status":status,"pinned":False,"model":model if model in MODEL_OPTIONS else "",
        "comments":[],"test_results":[],"versions":[],"forked_from":"","fulfills_request":""}
    db.insert_prompt(np_); track_rate("create_prompt")
    return jsonify({**enrich_prompt(np_,cu),"queued":status=="pending"}),201

@app.route("/api/prompts/<prompt_id>/upvote",methods=["POST"])
@login_required
def api_upvote(prompt_id):
    cu=get_current_user()
    if cu.get("is_banned"): return jsonify({"error":"Banned."}),403
    prompt=db.get_prompt(prompt_id)
    if not prompt: return jsonify({"error":"Not found"}),404
    uid=cu["id"]; ub=prompt.get("upvoted_by",[])
    if uid in ub: ub.remove(uid); voted=False
    else: ub.append(uid); voted=True
    db.update_prompt(prompt_id,{"upvoted_by":ub}); track_rate("upvote")
    return jsonify({"upvotes":len(ub),"voted":voted})

@app.route("/api/bookmarks/<prompt_id>",methods=["POST"])
@login_required
def api_toggle_bookmark(prompt_id):
    cu=get_current_user()
    if not db.get_prompt(prompt_id): return jsonify({"error":"Not found"}),404
    user=db.get_user_by_id(cu["id"]); bk=user.get("bookmarks",[])
    if prompt_id in bk: bk.remove(prompt_id); b=False
    else: bk.append(prompt_id); b=True
    db.update_user(cu["id"],{"bookmarks":bk})
    return jsonify({"bookmarked":b})

@app.route("/api/prompts/<prompt_id>/report",methods=["POST"])
@login_required
def api_report_prompt(prompt_id):
    cu=get_current_user()
    if not db.get_prompt(prompt_id): return jsonify({"error":"Not found"}),404
    data=request.get_json() or {}; reason=data.get("reason","").strip()[:500]
    if not reason: return jsonify({"error":"Reason required"}),400
    reports=db.load_reports()
    if any(r.get("prompt_id")==prompt_id and r["reporter"]==cu["username"] and not r.get("resolved") for r in reports):
        return jsonify({"error":"Already reported."}),400
    db.insert_report({"id":"rep_"+uuid.uuid4().hex[:8],"prompt_id":prompt_id,"comment_id":"",
        "reporter":cu["username"],"reason":reason,"created":datetime.now().isoformat(),
        "resolved":False,"dismissed":False,"resolved_by":"","resolved_at":"","type":"prompt"})
    return jsonify({"ok":True,"message":"Report submitted."})

# ── Comments ──
@app.route("/api/prompts/<prompt_id>/comments",methods=["POST"])
@login_required
def api_add_comment(prompt_id):
    cu=get_current_user()
    if cu.get("is_banned"): return jsonify({"error":"Banned."}),403
    prompt=db.get_prompt(prompt_id)
    if not prompt: return jsonify({"error":"Not found"}),404
    data=request.get_json() or {}; text=data.get("text","").strip()
    if len(text)<10: return jsonify({"error":"Min 10 chars."}),400
    if len(text)>1000: return jsonify({"error":"Max 1000 chars."}),400
    comments=prompt.get("comments",[]); now=datetime.now()
    user_recent=[c for c in comments if c["author"]==cu["username"] and (now-datetime.fromisoformat(c["created"])).total_seconds()<3600]
    if len(user_recent)>=5: return jsonify({"error":"Rate limit: 5/hour."}),429
    comment={"id":"cmt_"+uuid.uuid4().hex[:8],"author":cu["username"],"text":text[:1000],"created":now.isoformat(),"edited":False}
    comments.append(comment)
    db.update_prompt(prompt_id,{"comments":comments}); track_rate("comment")
    if prompt["author"]!=cu["username"]:
        push_notification(prompt["author"],"comment",f"{cu['username']} commented on \"{prompt['title'][:40]}\"",f"/prompts/{prompt_id}")
    return jsonify({"ok":True,"comment":comment}),201

@app.route("/api/prompts/<prompt_id>/comments/<cid>",methods=["DELETE"])
@login_required
def api_delete_comment(prompt_id,cid):
    cu=get_current_user(); prompt=db.get_prompt(prompt_id)
    if not prompt: return jsonify({"error":"Not found"}),404
    comment=next((c for c in prompt.get("comments",[]) if c["id"]==cid),None)
    if not comment: return jsonify({"error":"Not found"}),404
    if comment["author"]!=cu["username"] and not cu.get("is_admin") and not cu.get("is_moderator"): return jsonify({"error":"Forbidden"}),403
    comments=[c for c in prompt.get("comments",[]) if c["id"]!=cid]
    db.update_prompt(prompt_id,{"comments":comments})
    return jsonify({"ok":True})

@app.route("/api/prompts/<prompt_id>/comments/<cid>/report",methods=["POST"])
@login_required
def api_report_comment(prompt_id,cid):
    cu=get_current_user(); data=request.get_json() or {}; reason=data.get("reason","").strip()[:500]
    if not reason: return jsonify({"error":"Reason required"}),400
    db.insert_report({"id":"rep_"+uuid.uuid4().hex[:8],"prompt_id":prompt_id,"comment_id":cid,
        "reporter":cu["username"],"reason":reason,"created":datetime.now().isoformat(),
        "resolved":False,"dismissed":False,"resolved_by":"","resolved_at":"","type":"comment"})
    return jsonify({"ok":True})

# ── Fork ──
@app.route("/api/prompts/<prompt_id>/fork",methods=["POST"])
@login_required
def api_fork_prompt(prompt_id):
    cu=get_current_user()
    if cu.get("is_banned"): return jsonify({"error":"Banned."}),403
    orig=db.get_prompt(prompt_id)
    if not orig: return jsonify({"error":"Not found"}),404
    if orig.get("status") not in (None,"published"): return jsonify({"error":"Cannot fork"}),400
    forked={"id":"p"+uuid.uuid4().hex[:8],"title":orig["title"]+" (fork)","category":orig["category"],
        "text":orig["text"],"tags":list(orig.get("tags",[])),"upvoted_by":[],"views":0,
        "author":cu["username"],"created":datetime.now().strftime("%Y-%m-%d"),
        "status":"published","pinned":False,"model":orig.get("model",""),
        "comments":[],"test_results":[],"versions":[],"forked_from":prompt_id,"fulfills_request":""}
    db.insert_prompt(forked)
    if orig["author"]!=cu["username"]:
        push_notification(orig["author"],"fork",f"{cu['username']} forked \"{orig['title'][:40]}\"",f"/prompts/{forked['id']}")
    return jsonify({"ok":True,"prompt":enrich_prompt(forked,cu)}),201

# ── Follow ──
@app.route("/api/follow/<username>",methods=["POST"])
@login_required
def api_toggle_follow(username):
    cu=get_current_user()
    if cu["username"]==username: return jsonify({"error":"Cannot follow yourself"}),400
    target=db.get_user_by_username(username)
    if not target: return jsonify({"error":"User not found"}),404
    me=db.get_user_by_id(cu["id"]); following=me.get("following",[])
    if username in following:
        following.remove(username); followed=False
        db.update_user(target["id"],{"followers_count":max(0,target.get("followers_count",0)-1)})
    else:
        following.append(username); followed=True
        db.update_user(target["id"],{"followers_count":target.get("followers_count",0)+1})
        push_notification(username,"follow",f"{cu['username']} started following you",f"/profile/{cu['username']}")
    db.update_user(cu["id"],{"following":following})
    target=db.get_user_by_username(username)
    return jsonify({"followed":followed,"followers_count":target["followers_count"]})

@app.route("/feed")
@login_required
def user_feed():
    cu=get_current_user(); following=cu.get("following",[])
    if not following: return render_template("feed.html",prompts=[],following=following)
    prompts=db.load_prompts()
    feed=[enrich_prompt(p,cu) for p in prompts if p["author"] in following and p.get("status","published")=="published"]
    feed.sort(key=lambda p:p["created"],reverse=True)
    return render_template("feed.html",prompts=feed[:50],following=following)

# ── Collections ──
@app.route("/collections/<username>")
def user_collections(username):
    cu=get_current_user(); user=db.get_user_by_username(username)
    if not user: abort(404)
    cols=db.load_collections(); is_own=cu and cu["username"]==username
    user_cols=[c for c in cols if c["owner"]==username] if is_own else [c for c in cols if c["owner"]==username and c.get("is_public",False)]
    return render_template("collections.html",profile_user=user,collections=user_cols,is_own_profile=is_own)

@app.route("/collection/<cid>")
def collection_detail(cid):
    cu=get_current_user(); col=db.get_collection(cid)
    if not col: abort(404)
    is_own=cu and cu["username"]==col["owner"]
    if not col.get("is_public",False) and not is_own: abort(404)
    prompts=db.load_prompts(); pm={p["id"]:p for p in prompts}
    cp=[enrich_prompt(pm[pid],cu) for pid in col.get("prompt_ids",[]) if pid in pm and pm[pid].get("status","published")=="published"]
    return render_template("collection_detail.html",collection=col,prompts=cp,is_own=is_own)

@app.route("/api/collections",methods=["POST"])
@login_required
def api_create_collection():
    cu=get_current_user(); data=request.get_json() or {}; name=data.get("name","").strip()
    if not name: return jsonify({"error":"Name required"}),400
    nc={"id":"col_"+uuid.uuid4().hex[:8],"owner":cu["username"],"name":name[:80],
        "description":data.get("description","").strip()[:300],"prompt_ids":[],
        "created":datetime.now().strftime("%Y-%m-%d"),"is_public":bool(data.get("is_public",True))}
    db.insert_collection(nc); return jsonify({"ok":True,"collection":nc}),201

@app.route("/api/collections/<cid>/add/<pid>",methods=["POST"])
@login_required
def api_collection_add(cid,pid):
    cu=get_current_user(); col=db.get_collection(cid)
    if not col or col["owner"]!=cu["username"]: return jsonify({"error":"Not found"}),404
    pids=col.get("prompt_ids",[])
    if pid not in pids: pids.append(pid); db.update_collection(cid,{"prompt_ids":pids})
    return jsonify({"ok":True})

@app.route("/api/collections/<cid>/remove/<pid>",methods=["POST"])
@login_required
def api_collection_remove(cid,pid):
    cu=get_current_user(); col=db.get_collection(cid)
    if not col or col["owner"]!=cu["username"]: return jsonify({"error":"Not found"}),404
    pids=col.get("prompt_ids",[])
    if pid in pids: pids.remove(pid); db.update_collection(cid,{"prompt_ids":pids})
    return jsonify({"ok":True})

@app.route("/api/collections/<cid>",methods=["DELETE"])
@login_required
def api_delete_collection(cid):
    cu=get_current_user(); col=db.get_collection(cid)
    if not col or col["owner"]!=cu["username"]: return jsonify({"error":"Not found"}),404
    db.delete_collection(cid); return jsonify({"ok":True})

# ── Chains ──
@app.route("/chains")
def chains_page():
    chains=sorted([c for c in db.load_chains() if c.get("is_public",True)],key=lambda c:c.get("created",""),reverse=True)
    return render_template("chains.html",chains=chains)

@app.route("/chain/<cid>")
def chain_detail(cid):
    cu=get_current_user(); chain=db.get_chain(cid)
    if not chain: abort(404)
    is_own=cu and cu["username"]==chain["owner"]
    if not chain.get("is_public",True) and not is_own: abort(404)
    prompts=db.load_prompts(); pm={p["id"]:p for p in prompts}
    cp=[enrich_prompt(pm[pid],cu) for pid in chain.get("prompt_ids",[]) if pid in pm]
    return render_template("chain_detail.html",chain=chain,prompts=cp,is_own=is_own)

@app.route("/api/chains",methods=["POST"])
@login_required
def api_create_chain():
    cu=get_current_user(); data=request.get_json() or {}; title=data.get("title","").strip()
    if not title: return jsonify({"error":"Title required"}),400
    nc={"id":"chn_"+uuid.uuid4().hex[:8],"owner":cu["username"],"title":title[:120],
        "description":data.get("description","").strip()[:500],"prompt_ids":data.get("prompt_ids",[])[:20],
        "created":datetime.now().strftime("%Y-%m-%d"),"is_public":bool(data.get("is_public",True))}
    db.insert_chain(nc); return jsonify({"ok":True,"chain":nc}),201

@app.route("/api/chains/<cid>/add/<pid>",methods=["POST"])
@login_required
def api_chain_add(cid,pid):
    cu=get_current_user(); chain=db.get_chain(cid)
    if not chain or chain["owner"]!=cu["username"]: return jsonify({"error":"Not found"}),404
    pids=chain.get("prompt_ids",[])
    if len(pids)>=20: return jsonify({"error":"Max 20"}),400
    if pid not in pids: pids.append(pid); db.update_chain(cid,{"prompt_ids":pids})
    return jsonify({"ok":True})

@app.route("/api/chains/<cid>",methods=["DELETE"])
@login_required
def api_delete_chain(cid):
    cu=get_current_user(); chain=db.get_chain(cid)
    if not chain or chain["owner"]!=cu["username"]: return jsonify({"error":"Not found"}),404
    db.delete_chain(cid); return jsonify({"ok":True})

# ── Test Results ──
@app.route("/api/prompts/<prompt_id>/test-result",methods=["POST"])
@login_required
def api_add_test_result(prompt_id):
    cu=get_current_user()
    if cu.get("is_banned"): return jsonify({"error":"Banned."}),403
    prompt=db.get_prompt(prompt_id)
    if not prompt: return jsonify({"error":"Not found"}),404
    data=request.get_json() or {}; model=data.get("model","").strip(); rt=data.get("result_text","").strip()
    if not model: return jsonify({"error":"Model required"}),400
    if len(rt)<10: return jsonify({"error":"Min 10 chars."}),400
    trs=prompt.get("test_results",[])
    if len([t for t in trs if t["author"]==cu["username"]])>=3: return jsonify({"error":"Max 3 per prompt."}),400
    tr={"id":"tr_"+uuid.uuid4().hex[:8],"author":cu["username"],"model":model[:50],"result_text":rt[:3000],"created":datetime.now().isoformat()}
    trs.append(tr); db.update_prompt(prompt_id,{"test_results":trs})
    return jsonify({"ok":True,"test_result":tr}),201

# ── Notifications ──
@app.route("/notifications")
@login_required
def notifications_page():
    cu=get_current_user()
    notifs=db.get_user_notifications(cu["username"])
    return render_template("notifications.html",notifications=notifs)

@app.route("/api/notifications/read-all",methods=["POST"])
@login_required
def api_read_all_notifications():
    cu=get_current_user(); db.mark_all_notifications_read(cu["username"])
    return jsonify({"ok":True})

@app.route("/api/notifications/<nid>/read",methods=["POST"])
@login_required
def api_read_notification(nid):
    db.mark_notification_read(nid); return jsonify({"ok":True})

# ── RSS ──
@app.route("/feed.xml")
def rss_feed():
    prompts=db.load_prompts()
    pub=sorted([p for p in prompts if p.get("status","published")=="published"],key=lambda p:p.get("created",""),reverse=True)[:20]
    now=datetime.now().strftime("%a, %d %b %Y %H:%M:%S +0000"); items=[]
    for p in pub:
        desc=p["text"][:200].replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
        title=p["title"].replace("&","&amp;").replace("<","&lt;")
        link=request.host_url.rstrip("/")+"/prompts/"+p["id"]
        try: pd=datetime.strptime(p["created"],"%Y-%m-%d").strftime("%a, %d %b %Y 00:00:00 +0000")
        except: pd=now
        items.append(f"    <item><title>{title}</title><description>{desc}</description><link>{link}</link><author>{p['author']}</author><pubDate>{pd}</pubDate><category>{p['category']}</category><guid isPermaLink=\"true\">{link}</guid></item>")
    xml=f"""<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>ForgePrompt</title><link>{request.host_url.rstrip("/")}</link><description>Curated AI prompts</description><lastBuildDate>{now}</lastBuildDate><language>en-us</language>\n{chr(10).join(items)}\n</channel></rss>"""
    return Response(xml,mimetype="application/rss+xml")

# ── Requests ──
@app.route("/requests")
def requests_page():
    cu=get_current_user(); reqs=db.load_requests()
    sf=request.args.get("status","open"); cf=request.args.get("category",""); sb=request.args.get("sort","newest")
    if sf and sf!="all": reqs=[r for r in reqs if r.get("status","open")==sf]
    if cf: reqs=[r for r in reqs if r.get("category","")==cf]
    if sb=="submissions": reqs=sorted(reqs,key=lambda r:len(r.get("submissions",[])),reverse=True)
    elif sb=="wanted": reqs=sorted(reqs,key=lambda r:len(r.get("upvoted_by",[])),reverse=True)
    else: reqs=sorted(reqs,key=lambda r:r.get("created",""),reverse=True)
    return render_template("requests.html",requests=reqs,status_filter=sf,category_filter=cf,sort=sb)

@app.route("/requests/<rid>")
def request_detail(rid):
    cu=get_current_user(); req=db.get_request(rid)
    if not req: abort(404)
    prompts=db.load_prompts(); pm={p["id"]:p for p in prompts}
    for sub in req.get("submissions",[]):
        if sub.get("prompt_id") and sub["prompt_id"] in pm: sub["_prompt"]=enrich_prompt(pm[sub["prompt_id"]],cu)
    user_prompts=[p for p in prompts if cu and p["author"]==cu["username"] and p.get("status","published")=="published"] if cu else []
    return render_template("request_detail.html",req=req,user_prompts=user_prompts)

@app.route("/api/requests",methods=["POST"])
@login_required
def api_create_request():
    cu=get_current_user()
    if cu.get("is_banned"): return jsonify({"error":"Banned."}),403
    data=request.get_json() or {}; title=data.get("title","").strip()
    if not title: return jsonify({"error":"Title required"}),400
    desc=data.get("description","").strip()
    if len(desc)<10: return jsonify({"error":"Description min 10 chars."}),400
    cats=get_categories()
    nr={"id":"req_"+uuid.uuid4().hex[:8],"author":cu["username"],"title":title[:120],"description":desc[:2000],
        "category":data.get("category","") if data.get("category","") in cats else "",
        "tags":[t.strip().lower() for t in data.get("tags",[]) if t.strip()][:5],
        "bounty":data.get("bounty","").strip()[:200],"status":"open","submissions":[],"upvoted_by":[],
        "created":datetime.now().isoformat()}
    db.insert_request(nr); return jsonify({"ok":True,"request":nr}),201

@app.route("/api/requests/<rid>/submit",methods=["POST"])
@login_required
def api_submit_to_request(rid):
    cu=get_current_user()
    if cu.get("is_banned"): return jsonify({"error":"Banned."}),403
    req=db.get_request(rid)
    if not req: return jsonify({"error":"Not found"}),404
    if req.get("status")!="open": return jsonify({"error":"Not open."}),400
    data=request.get_json() or {}; pid=data.get("prompt_id","").strip()
    title=data.get("title","").strip(); text=data.get("text","").strip()
    if pid:
        p=db.get_prompt(pid)
        if not p or p["author"]!=cu["username"]: return jsonify({"error":"Not found"}),404
    elif title and text:
        if len(text)<20: return jsonify({"error":"Too short"}),400
        new_p={"id":"p"+uuid.uuid4().hex[:8],"title":title[:120],"category":req.get("category","") or "ChatGPT",
            "text":text[:5000],"tags":req.get("tags",[])[:5],"upvoted_by":[],"views":0,"author":cu["username"],
            "created":datetime.now().strftime("%Y-%m-%d"),"status":"published","pinned":False,"model":"",
            "comments":[],"test_results":[],"versions":[],"forked_from":"","fulfills_request":rid}
        db.insert_prompt(new_p); pid=new_p["id"]
    else: return jsonify({"error":"Provide prompt_id or title+text"}),400
    sub={"id":"sub_"+uuid.uuid4().hex[:8],"author":cu["username"],"prompt_id":pid,"created":datetime.now().isoformat(),"accepted":False}
    subs=req.get("submissions",[]); subs.append(sub)
    db.update_request(rid,{"submissions":subs})
    if req["author"]!=cu["username"]:
        push_notification(req["author"],"submission",f"{cu['username']} submitted to \"{req['title'][:40]}\"",f"/requests/{rid}")
    return jsonify({"ok":True,"submission":sub}),201

@app.route("/api/requests/<rid>/accept/<sid>",methods=["POST"])
@login_required
def api_accept_submission(rid,sid):
    cu=get_current_user(); req=db.get_request(rid)
    if not req: return jsonify({"error":"Not found"}),404
    if req["author"]!=cu["username"] and not cu.get("is_admin") and not cu.get("is_moderator"): return jsonify({"error":"Forbidden"}),403
    subs=req.get("submissions",[])
    sub=next((s for s in subs if s["id"]==sid),None)
    if not sub: return jsonify({"error":"Not found"}),404
    sub["accepted"]=True
    db.update_request(rid,{"submissions":subs,"status":"fulfilled"})
    target=db.get_user_by_username(sub["author"])
    if target: db.update_user(target["id"],{"accepted_submissions":target.get("accepted_submissions",0)+1})
    push_notification(sub["author"],"accepted",f"Your submission accepted for \"{req['title'][:40]}\"!",f"/requests/{rid}")
    return jsonify({"ok":True})

@app.route("/api/requests/<rid>/upvote",methods=["POST"])
@login_required
def api_upvote_request(rid):
    cu=get_current_user(); req=db.get_request(rid)
    if not req: return jsonify({"error":"Not found"}),404
    uid=cu["id"]; ub=req.get("upvoted_by",[])
    if uid in ub: ub.remove(uid); v=False
    else: ub.append(uid); v=True
    db.update_request(rid,{"upvoted_by":ub})
    return jsonify({"upvotes":len(ub),"voted":v})

@app.route("/api/stats")
def api_stats(): return jsonify(compute_stats())

@app.errorhandler(404)
def not_found(e): return render_template("errors/404.html"),404
@app.errorhandler(403)
def forbidden(e): return render_template("errors/403.html"),403

if __name__=="__main__": app.run(debug=True,port=5000)
