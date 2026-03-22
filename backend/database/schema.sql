-- IKS GEHU Portal Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('campus-in-charge', 'spoc', 'admin-office')),
    campus TEXT CHECK(campus IN ('haldwani', 'bhimtal', 'dehradun')),
    branch TEXT CHECK(branch IN ('cse', 'ece', 'me', 'ce', 'ee', 'it')),
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER, -- Duration in minutes
    credits REAL, -- Event credits
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled')),
    created_by TEXT NOT NULL,
    campus TEXT CHECK(campus IN ('haldwani', 'bhimtal', 'dehradun')),
    branch TEXT CHECK(branch IN ('cse', 'ece', 'me', 'ce', 'ee', 'it')),
    submitted_at DATETIME, -- Timestamp when event was submitted for approval
    submitted_by TEXT, -- User who submitted the event
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (campus) REFERENCES users(campus),
    FOREIGN KEY (branch) REFERENCES users(branch)
);

-- Event Media Table
CREATE TABLE IF NOT EXISTS event_media (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video', 'document')),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER, -- Size in bytes
    mime_type TEXT,
    uploaded_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Event Status & Admin Remarks Table
CREATE TABLE IF NOT EXISTS event_status (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled')),
    remarks TEXT,
    reviewed_by TEXT,
    reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_campus ON users(campus);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch);

CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_campus ON events(campus);
CREATE INDEX IF NOT EXISTS idx_events_branch ON events(branch);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_submitted_at ON events(submitted_at);
CREATE INDEX IF NOT EXISTS idx_events_submitted_by ON events(submitted_by);

CREATE INDEX IF NOT EXISTS idx_event_media_event_id ON event_media(event_id);
CREATE INDEX IF NOT EXISTS idx_event_media_type ON event_media(media_type);

CREATE INDEX IF NOT EXISTS idx_event_status_event_id ON event_status(event_id);
CREATE INDEX IF NOT EXISTS idx_event_status_status ON event_status(status);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

