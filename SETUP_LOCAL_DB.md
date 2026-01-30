# Local PostgreSQL Setup

## Quick Setup Commands

### Option 1: Using psql (Recommended)

```bash
# Connect as postgres superuser
psql -U postgres

# Then run these commands:
CREATE USER webhook WITH PASSWORD 'webhook123';
CREATE DATABASE webhookdb OWNER webhook;
\c webhookdb

# Create tables
\i backend/create-tables.sql
```

### Option 2: Using SQL file

```bash
# Create user and database
psql -U postgres -f backend/init-local.sql

# Create tables
psql -U webhook -d webhookdb -f backend/create-tables.sql
```

### Option 3: One-liner

```bash
# Create everything in one go
psql -U postgres << EOF
CREATE USER webhook WITH PASSWORD 'webhook123';
CREATE DATABASE webhookdb OWNER webhook;
\c webhookdb
CREATE TABLE IF NOT EXISTS webhooks (
  id VARCHAR(36) PRIMARY KEY,
  path VARCHAR(255) UNIQUE NOT NULL,
  response_code INTEGER NOT NULL DEFAULT 200,
  response_body TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS webhook_events (
  id VARCHAR(36) PRIMARY KEY,
  webhook_id VARCHAR(36) NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  method VARCHAR(10) NOT NULL,
  headers JSONB,
  body TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF
```

## Verify Setup

```bash
# Test connection
psql -U webhook -d webhookdb -c "\dt"
```

You should see both `webhooks` and `webhook_events` tables listed.
