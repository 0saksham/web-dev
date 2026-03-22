# Database Schema Documentation

## Overview

The IKS GEHU Portal uses SQLite database with the following schema design. The database enforces role-based data segregation and maintains referential integrity through foreign keys.

## Database File

- **Location**: `backend/database/iks_portal.db` (created automatically)
- **Type**: SQLite 3
- **Foreign Keys**: Enabled

## Tables

### 1. Users Table

Stores user accounts with role, campus, branch, and contact information.

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Unique user identifier
- `email` (TEXT, UNIQUE, NOT NULL) - User email address
- `password` (TEXT, NOT NULL) - Hashed password (bcrypt)
- `name` (TEXT, NOT NULL) - User's full name
- `role` (TEXT, NOT NULL) - User role: 'campus-in-charge', 'spoc', or 'admin-office'
- `campus` (TEXT) - Campus: 'haldwani', 'bhimtal', or 'dehradun'
- `branch` (TEXT) - Branch: 'cse', 'ece', 'me', 'ce', 'ee', or 'it'
- `phone` (TEXT) - Contact phone number
- `address` (TEXT) - Contact address
- `created_at` (DATETIME) - Account creation timestamp
- `updated_at` (DATETIME) - Last update timestamp

**Constraints:**
- Email must be unique
- Role must be one of the allowed values
- Campus and branch must match allowed values

**Indexes:**
- `idx_users_email` - Fast email lookups
- `idx_users_role` - Role-based queries
- `idx_users_campus` - Campus-based filtering
- `idx_users_branch` - Branch-based filtering

### 2. Events Table

Stores event information with title, description, duration, credits, and dates.

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Unique event identifier
- `title` (TEXT, NOT NULL) - Event title
- `description` (TEXT) - Event description
- `duration` (INTEGER) - Duration in minutes
- `credits` (REAL) - Event credits
- `start_date` (DATETIME, NOT NULL) - Event start date/time
- `end_date` (DATETIME) - Event end date/time
- `status` (TEXT, DEFAULT 'draft') - Event status: 'draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled'
- `created_by` (TEXT, NOT NULL) - User ID who created the event
- `campus` (TEXT) - Associated campus
- `branch` (TEXT) - Associated branch
- `created_at` (DATETIME) - Event creation timestamp
- `updated_at` (DATETIME) - Last update timestamp

**Foreign Keys:**
- `created_by` → `users(id)` ON DELETE CASCADE
- `campus` → `users(campus)` (referential)
- `branch` → `users(branch)` (referential)

**Indexes:**
- `idx_events_created_by` - Find events by creator
- `idx_events_status` - Filter by status
- `idx_events_campus` - Filter by campus
- `idx_events_branch` - Filter by branch
- `idx_events_dates` - Date range queries

### 3. Event Media Table

Stores media files (images, videos, documents) associated with events.

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Unique media identifier
- `event_id` (TEXT, NOT NULL) - Associated event ID
- `media_type` (TEXT, NOT NULL) - Type: 'image', 'video', or 'document'
- `file_name` (TEXT, NOT NULL) - Original file name
- `file_path` (TEXT, NOT NULL) - Storage path
- `file_size` (INTEGER) - File size in bytes
- `mime_type` (TEXT) - MIME type
- `uploaded_by` (TEXT, NOT NULL) - User ID who uploaded
- `created_at` (DATETIME) - Upload timestamp

**Foreign Keys:**
- `event_id` → `events(id)` ON DELETE CASCADE
- `uploaded_by` → `users(id)` ON DELETE SET NULL

**Indexes:**
- `idx_event_media_event_id` - Find media by event
- `idx_event_media_type` - Filter by media type

### 4. Event Status Table

Tracks event status changes and admin remarks.

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Unique status entry identifier
- `event_id` (TEXT, NOT NULL) - Associated event ID
- `status` (TEXT, NOT NULL) - Status value
- `remarks` (TEXT) - Admin remarks/notes
- `reviewed_by` (TEXT) - User ID who reviewed/changed status
- `reviewed_at` (DATETIME) - Review timestamp

**Foreign Keys:**
- `event_id` → `events(id)` ON DELETE CASCADE
- `reviewed_by` → `users(id)` ON DELETE SET NULL

**Indexes:**
- `idx_event_status_event_id` - Find status history by event
- `idx_event_status_status` - Filter by status

## Role-Based Data Segregation

### Campus In-Charge
- Can view events from their campus only
- Can create events for their campus
- Cannot see events from other campuses

### SPOC (Single Point of Contact)
- Can view events from their campus AND branch only
- Can create events for their campus and branch
- Cannot see events from other branches or campuses

### Admin Office
- Can view ALL events (no restrictions)
- Can approve/reject events
- Can add remarks to events
- Full system access

## Relationships

```
users (1) ──→ (many) events
events (1) ──→ (many) event_media
events (1) ──→ (many) event_status
users (1) ──→ (many) event_media (uploaded_by)
users (1) ──→ (many) event_status (reviewed_by)
```

## Data Integrity

- **Cascade Deletes**: When an event is deleted, all associated media and status entries are automatically deleted
- **Set Null on User Delete**: When a user is deleted, their uploaded media and status reviews are preserved but references are set to NULL
- **Foreign Key Constraints**: Enforced at database level
- **Check Constraints**: Role, campus, branch, status values are validated

## Initialization

The database is automatically initialized when the server starts:
1. Tables are created from `schema.sql`
2. Foreign key constraints are enabled
3. Indexes are created
4. Default admin user is created if it doesn't exist

## Migration Notes

To migrate to PostgreSQL/MySQL:
1. Update connection string in `database/db.js`
2. Adjust SQL syntax if needed (SQLite is mostly compatible)
3. Update data types if necessary (TEXT → VARCHAR, etc.)
4. Test foreign key constraints

