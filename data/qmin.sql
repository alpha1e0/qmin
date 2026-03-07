-- Qmin Application Database Schema
-- SQLite database initialization script

-- Document category table
CREATE TABLE IF NOT EXISTS doc_category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    space INTEGER NOT NULL DEFAULT 0,
    create_time TEXT NOT NULL
);

-- Document table
CREATE TABLE IF NOT EXISTS doc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    category_id INTEGER NOT NULL,
    create_time TEXT NOT NULL,
    modify_time TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES doc_category(id) ON DELETE CASCADE
);

-- Image table
CREATE TABLE IF NOT EXISTS image (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content BLOB,
    ext TEXT NOT NULL,
    save_path TEXT,
    create_time TEXT NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_doc_category_id ON doc(category_id);
CREATE INDEX IF NOT EXISTS idx_doc_create_time ON doc(create_time);
CREATE INDEX IF NOT EXISTS idx_image_create_time ON image(create_time);
