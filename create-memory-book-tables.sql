-- Memory Book System Tables

-- Memory Books (simplified for now)
CREATE TABLE IF NOT EXISTS memory_books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    scope TEXT NOT NULL DEFAULT 'global',
    plant_id INTEGER,
    department_id INTEGER,
    tags JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER NOT NULL,
    last_edited_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Memory Book Entries
CREATE TABLE IF NOT EXISTS memory_book_entries (
    id SERIAL PRIMARY KEY,
    memory_book_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    entry_type TEXT NOT NULL DEFAULT 'instruction',
    priority TEXT NOT NULL DEFAULT 'medium',
    category TEXT,
    context JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    tags JSONB DEFAULT '[]',
    is_archived BOOLEAN DEFAULT false,
    created_by INTEGER NOT NULL,
    last_edited_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Memory Book Collaborators
CREATE TABLE IF NOT EXISTS memory_book_collaborators (
    id SERIAL PRIMARY KEY,
    memory_book_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    permission TEXT NOT NULL DEFAULT 'edit',
    added_by INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(memory_book_id, user_id)
);

-- Memory Book Entry History
CREATE TABLE IF NOT EXISTS memory_book_entry_history (
    id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL,
    previous_content TEXT,
    new_content TEXT,
    change_type TEXT NOT NULL,
    change_description TEXT,
    edited_by INTEGER NOT NULL,
    edited_at TIMESTAMP DEFAULT NOW()
);

-- Memory Book Usage Analytics
CREATE TABLE IF NOT EXISTS memory_book_usage (
    id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL,
    user_id INTEGER,
    action_type TEXT NOT NULL,
    context TEXT,
    effectiveness_rating INTEGER,
    used_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for search performance
CREATE INDEX IF NOT EXISTS memory_content_search_idx ON memory_book_entries(content);
CREATE INDEX IF NOT EXISTS memory_title_search_idx ON memory_book_entries(title);
CREATE INDEX IF NOT EXISTS memory_category_idx ON memory_book_entries(category);
CREATE INDEX IF NOT EXISTS memory_type_idx ON memory_book_entries(entry_type);