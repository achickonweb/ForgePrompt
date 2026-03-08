"""
db.py — ForgePrompt Database Layer (Supabase)

Drop-in replacement for the old JSON flat-file storage.
Both app.py and admin_bp.py import from here.

Setup:
  1. Create a Supabase project at supabase.com
  2. Run schema.sql in the SQL Editor
  3. Set environment variables:
       SUPABASE_URL=https://xxxxx.supabase.co
       SUPABASE_KEY=your-service-role-key   (NOT anon key — use service_role)
"""
import os, json
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

_client: Client = None

def get_sb() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_KEY environment variables are required. "
                "Get them from your Supabase project → Settings → API."
            )
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client

# ──────────────────────────────────────────────
# Generic helpers
# ──────────────────────────────────────────────
def _all(table):
    """Fetch all rows from a table."""
    resp = get_sb().table(table).select("*").execute()
    return resp.data or []

def _get(table, pk_col, pk_val):
    """Fetch one row by primary key."""
    resp = get_sb().table(table).select("*").eq(pk_col, pk_val).execute()
    rows = resp.data or []
    return rows[0] if rows else None

def _upsert(table, row):
    """Insert or update a row."""
    get_sb().table(table).upsert(row).execute()

def _insert(table, row):
    """Insert a row."""
    get_sb().table(table).insert(row).execute()

def _update(table, pk_col, pk_val, updates):
    """Update specific fields on a row."""
    get_sb().table(table).update(updates).eq(pk_col, pk_val).execute()

def _delete(table, pk_col, pk_val):
    """Delete a row by primary key."""
    get_sb().table(table).delete().eq(pk_col, pk_val).execute()

def _delete_all(table):
    """Delete all rows from a table (careful!)."""
    get_sb().table(table).delete().neq("id", "__never__").execute()

# ──────────────────────────────────────────────
# Users
# ──────────────────────────────────────────────
def load_users():
    return _all("users")

def save_users(users_list):
    """Full replace — used by admin bulk ops. Upserts every user."""
    for u in users_list:
        _upsert("users", u)

def get_user_by_id(uid):
    return _get("users", "id", uid)

def get_user_by_username(username):
    resp = get_sb().table("users").select("*").eq("username", username).execute()
    rows = resp.data or []
    return rows[0] if rows else None

def insert_user(user):
    _insert("users", user)

def update_user(uid, updates):
    _update("users", "id", uid, updates)

# ──────────────────────────────────────────────
# Prompts
# ──────────────────────────────────────────────
def load_prompts():
    return _all("prompts")

def save_prompts(prompts_list):
    """Full replace — used by admin bulk ops."""
    for p in prompts_list:
        _upsert("prompts", p)

def get_prompt(pid):
    return _get("prompts", "id", pid)

def insert_prompt(prompt):
    _insert("prompts", prompt)

def update_prompt(pid, updates):
    _update("prompts", "id", pid, updates)

def delete_prompt(pid):
    _delete("prompts", "id", pid)

# ──────────────────────────────────────────────
# Collections
# ──────────────────────────────────────────────
def load_collections():
    return _all("collections")

def save_collections(cols):
    for c in cols:
        _upsert("collections", c)

def get_collection(cid):
    return _get("collections", "id", cid)

def insert_collection(col):
    _insert("collections", col)

def update_collection(cid, updates):
    _update("collections", "id", cid, updates)

def delete_collection(cid):
    _delete("collections", "id", cid)

# ──────────────────────────────────────────────
# Requests
# ──────────────────────────────────────────────
def load_requests():
    return _all("requests")

def save_requests(reqs):
    for r in reqs:
        _upsert("requests", r)

def get_request(rid):
    return _get("requests", "id", rid)

def insert_request(req):
    _insert("requests", req)

def update_request(rid, updates):
    _update("requests", "id", rid, updates)

def delete_request(rid):
    _delete("requests", "id", rid)

# ──────────────────────────────────────────────
# Chains
# ──────────────────────────────────────────────
def load_chains():
    return _all("chains")

def save_chains(chains):
    for c in chains:
        _upsert("chains", c)

def get_chain(cid):
    return _get("chains", "id", cid)

def insert_chain(chain):
    _insert("chains", chain)

def update_chain(cid, updates):
    _update("chains", "id", cid, updates)

def delete_chain(cid):
    _delete("chains", "id", cid)

# ──────────────────────────────────────────────
# Notifications
# ──────────────────────────────────────────────
def load_notifications():
    return _all("notifications")

def save_notifications(notifs):
    for n in notifs:
        _upsert("notifications", n)

def get_user_notifications(username, limit=100):
    resp = (get_sb().table("notifications")
            .select("*")
            .eq("user", username)
            .order("created", desc=True)
            .limit(limit)
            .execute())
    return resp.data or []

def insert_notification(notif):
    _insert("notifications", notif)

def mark_notification_read(nid):
    _update("notifications", "id", nid, {"read": True})

def mark_all_notifications_read(username):
    (get_sb().table("notifications")
     .update({"read": True})
     .eq("user", username)
     .eq("read", False)
     .execute())

def count_unread_notifications(username):
    resp = (get_sb().table("notifications")
            .select("id", count="exact")
            .eq("user", username)
            .eq("read", False)
            .execute())
    return resp.count or 0

# ──────────────────────────────────────────────
# Reports
# ──────────────────────────────────────────────
def load_reports():
    return _all("reports")

def save_reports(reports):
    for r in reports:
        _upsert("reports", r)

def insert_report(report):
    _insert("reports", report)

def update_report(rid, updates):
    _update("reports", "id", rid, updates)

# ──────────────────────────────────────────────
# Announcements
# ──────────────────────────────────────────────
def load_announcements():
    return _all("announcements")

def save_announcements(anns):
    for a in anns:
        _upsert("announcements", a)

def insert_announcement(ann):
    _insert("announcements", ann)

def update_announcement(aid, updates):
    _update("announcements", "id", aid, updates)

def delete_announcement(aid):
    _delete("announcements", "id", aid)

# ──────────────────────────────────────────────
# Audit log
# ──────────────────────────────────────────────
def load_audit():
    return _all("audit_log")

def save_audit(logs):
    for l in logs:
        _upsert("audit_log", l)

def insert_audit(entry):
    _insert("audit_log", entry)

# ──────────────────────────────────────────────
# Pages (CMS)
# ──────────────────────────────────────────────
def load_pages():
    return _all("pages")

def save_pages(pages):
    for p in pages:
        _upsert("pages", p)

def get_page(slug):
    return _get("pages", "slug", slug)

def upsert_page(page):
    _upsert("pages", page)

def delete_page(slug):
    _delete("pages", "slug", slug)

# ──────────────────────────────────────────────
# Categories
# ──────────────────────────────────────────────
def load_categories():
    rows = _all("categories")
    return [r["name"] for r in rows] if rows else [
        "ChatGPT","Coding","Image Generation","Video Generation","Game Development"
    ]

def save_categories(cats):
    # Replace all categories
    get_sb().table("categories").delete().neq("name", "__never__").execute()
    for name in cats:
        _insert("categories", {"name": name})

# ──────────────────────────────────────────────
# Tags config
# ──────────────────────────────────────────────
def load_tags_config():
    row = _get("tags_config", "key", "main")
    if row:
        return {"merges": row.get("merges",{}), "blacklist": row.get("blacklist",[]), "renamed": row.get("renamed",{})}
    return {"merges": {}, "blacklist": [], "renamed": {}}

def save_tags_config(cfg):
    _upsert("tags_config", {"key": "main", **cfg})

# ──────────────────────────────────────────────
# Search log
# ──────────────────────────────────────────────
def load_search_log():
    return _all("search_log")

def insert_search_log(entry):
    get_sb().table("search_log").insert(entry).execute()

def save_search_log(entries):
    """Bulk replace — rarely needed."""
    pass  # Search logs are append-only, no full replace needed

# ──────────────────────────────────────────────
# Rate log
# ──────────────────────────────────────────────
def load_rate_log():
    return _all("rate_log")

def insert_rate_log(entry):
    get_sb().table("rate_log").insert(entry).execute()

def save_rate_log(entries):
    """Bulk replace — rarely needed."""
    pass
