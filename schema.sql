-- 链接表
CREATE TABLE links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  hit_count INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NULL
);

-- 索引
CREATE INDEX idx_links_slug ON links(slug);
CREATE INDEX idx_links_pinned ON links(pinned);
CREATE INDEX idx_links_expires ON links(expires_at);

-- 点击事件表（可选，用于详细分析）
CREATE TABLE link_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ip_hash TEXT NULL,
  ua_hash TEXT NULL
);
