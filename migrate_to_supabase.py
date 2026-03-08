"""
migrate_to_supabase.py — One-time migration from JSON flat files to Supabase

Usage:
  1. Set SUPABASE_URL and SUPABASE_KEY environment variables
  2. Run schema.sql in Supabase SQL Editor first
  3. Run: python migrate_to_supabase.py

This reads all data/*.json files and inserts them into Supabase tables.
Safe to run multiple times (uses upsert).
"""
import os, json, sys

# Add project to path
sys.path.insert(0, os.path.dirname(__file__))

from db import get_sb

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def load_json(filename, default=None):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return default if default is not None else []
    with open(path) as f:
        return json.load(f)

def migrate():
    sb = get_sb()
    print("Connected to Supabase ✓")

    # Users
    users = load_json("users.json", [])
    if users:
        for u in users:
            # Ensure all fields exist with defaults
            u.setdefault("following", [])
            u.setdefault("followers_count", 0)
            u.setdefault("accepted_submissions", 0)
            u.setdefault("banned_reason", "")
        sb.table("users").upsert(users).execute()
        print(f"  Users: {len(users)} migrated")
    else:
        print("  Users: 0 (empty)")

    # Prompts
    prompts = load_json("prompts.json", [])
    if prompts:
        for p in prompts:
            p.setdefault("status", "published")
            p.setdefault("pinned", False)
            p.setdefault("model", "")
            p.setdefault("comments", [])
            p.setdefault("test_results", [])
            p.setdefault("versions", [])
            p.setdefault("forked_from", "")
            p.setdefault("fulfills_request", "")
        sb.table("prompts").upsert(prompts).execute()
        print(f"  Prompts: {len(prompts)} migrated")
    else:
        print("  Prompts: 0 (empty)")

    # Collections
    collections = load_json("collections.json", [])
    if collections:
        sb.table("collections").upsert(collections).execute()
        print(f"  Collections: {len(collections)} migrated")

    # Requests
    requests = load_json("requests.json", [])
    if requests:
        sb.table("requests").upsert(requests).execute()
        print(f"  Requests: {len(requests)} migrated")

    # Chains
    chains = load_json("chains.json", [])
    if chains:
        sb.table("chains").upsert(chains).execute()
        print(f"  Chains: {len(chains)} migrated")

    # Notifications
    notifs = load_json("notifications.json", [])
    if notifs:
        sb.table("notifications").upsert(notifs).execute()
        print(f"  Notifications: {len(notifs)} migrated")

    # Reports
    reports = load_json("reports.json", [])
    if reports:
        for r in reports:
            r.setdefault("comment_id", "")
            r.setdefault("dismissed", False)
            r.setdefault("resolved_by", "")
            r.setdefault("resolved_at", "")
            r.setdefault("type", "prompt")
        sb.table("reports").upsert(reports).execute()
        print(f"  Reports: {len(reports)} migrated")

    # Announcements
    anns = load_json("announcements.json", [])
    if anns:
        sb.table("announcements").upsert(anns).execute()
        print(f"  Announcements: {len(anns)} migrated")

    # Audit log
    audit = load_json("audit_log.json", [])
    if audit:
        sb.table("audit_log").upsert(audit).execute()
        print(f"  Audit log: {len(audit)} migrated")

    # Pages
    pages = load_json("pages.json", [])
    if pages:
        sb.table("pages").upsert(pages).execute()
        print(f"  Pages: {len(pages)} migrated")

    # Categories
    cats = load_json("categories.json", [])
    if cats:
        for name in cats:
            sb.table("categories").upsert({"name": name}).execute()
        print(f"  Categories: {len(cats)} migrated")

    # Tags config
    tags_cfg = load_json("tags_config.json", {})
    if tags_cfg:
        sb.table("tags_config").upsert({"key": "main", **tags_cfg}).execute()
        print("  Tags config: migrated")

    print("\n✓ Migration complete!")

if __name__ == "__main__":
    migrate()
