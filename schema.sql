-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created TEXT NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_color TEXT DEFAULT '#00ff88',
  bookmarks JSONB DEFAULT '[]'::jsonb,
  following JSONB DEFAULT '[]'::jsonb,
  followers_count INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_moderator BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  banned_reason TEXT DEFAULT '',
  needs_moderation BOOLEAN DEFAULT false,
  accepted_submissions INTEGER DEFAULT 0
);

-- Prompts
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  upvoted_by JSONB DEFAULT '[]'::jsonb,
  views INTEGER DEFAULT 0,
  author TEXT NOT NULL DEFAULT '',
  created TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'published',
  pinned BOOLEAN DEFAULT false,
  model TEXT DEFAULT '',
  comments JSONB DEFAULT '[]'::jsonb,
  test_results JSONB DEFAULT '[]'::jsonb,
  versions JSONB DEFAULT '[]'::jsonb,
  forked_from TEXT DEFAULT '',
  fulfills_request TEXT DEFAULT ''
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  prompt_ids JSONB DEFAULT '[]'::jsonb,
  created TEXT NOT NULL DEFAULT '',
  is_public BOOLEAN DEFAULT true
);

-- Requests
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  bounty TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  submissions JSONB DEFAULT '[]'::jsonb,
  upvoted_by JSONB DEFAULT '[]'::jsonb,
  created TEXT NOT NULL DEFAULT ''
);

-- Chains
CREATE TABLE IF NOT EXISTS chains (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  prompt_ids JSONB DEFAULT '[]'::jsonb,
  created TEXT NOT NULL DEFAULT '',
  is_public BOOLEAN DEFAULT true
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  "user" TEXT NOT NULL DEFAULT '',
  type TEXT DEFAULT '',
  message TEXT DEFAULT '',
  link TEXT DEFAULT '',
  created TEXT NOT NULL DEFAULT '',
  read BOOLEAN DEFAULT false
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  prompt_id TEXT DEFAULT '',
  comment_id TEXT DEFAULT '',
  reporter TEXT NOT NULL DEFAULT '',
  reason TEXT DEFAULT '',
  created TEXT NOT NULL DEFAULT '',
  resolved BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  resolved_by TEXT DEFAULT '',
  resolved_at TEXT DEFAULT '',
  type TEXT DEFAULT 'prompt'
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  text TEXT DEFAULT '',
  color TEXT DEFAULT 'accent',
  active BOOLEAN DEFAULT true,
  created TEXT NOT NULL DEFAULT '',
  created_by TEXT DEFAULT ''
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL DEFAULT '',
  admin TEXT DEFAULT '',
  action TEXT DEFAULT '',
  detail TEXT DEFAULT ''
);

-- Pages (CMS)
CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  updated TEXT DEFAULT '',
  updated_by TEXT DEFAULT ''
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  name TEXT PRIMARY KEY
);

-- Insert default categories
INSERT INTO categories (name) VALUES
  ('ChatGPT'), ('Coding'), ('Image Generation'), ('Video Generation'), ('Game Development')
ON CONFLICT DO NOTHING;

-- Tags config
CREATE TABLE IF NOT EXISTS tags_config (
  key TEXT PRIMARY KEY DEFAULT 'main',
  merges JSONB DEFAULT '{}'::jsonb,
  blacklist JSONB DEFAULT '[]'::jsonb,
  renamed JSONB DEFAULT '{}'::jsonb
);
INSERT INTO tags_config (key) VALUES ('main') ON CONFLICT DO NOTHING;

-- Search log
CREATE TABLE IF NOT EXISTS search_log (
  id SERIAL PRIMARY KEY,
  query TEXT DEFAULT '',
  timestamp TEXT DEFAULT '',
  ip TEXT DEFAULT ''
);

-- Rate log
CREATE TABLE IF NOT EXISTS rate_log (
  id SERIAL PRIMARY KEY,
  ip TEXT DEFAULT '',
  endpoint TEXT DEFAULT '',
  timestamp TEXT DEFAULT ''
);

-- Enable Row Level Security but allow all for service_role
-- (Your Flask app uses the service_role key, so all operations are allowed)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_log ENABLE ROW LEVEL SECURITY;

-- Policies: allow service_role full access (Flask backend uses service_role key)
-- These are permissive policies for the service role
CREATE POLICY "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON prompts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON chains FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON search_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON rate_log FOR ALL USING (true) WITH CHECK (true);
