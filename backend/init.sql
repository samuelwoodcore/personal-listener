-- Create database and user (run as postgres superuser)
-- For local PostgreSQL setup:

-- 1. Connect as postgres user first:
-- psql -U postgres

-- 2. Create user/role (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'webhook') THEN
    CREATE USER webhook WITH PASSWORD 'webhook123';
  END IF;
END
$$;

-- 3. Create database (if it doesn't exist)
SELECT 'CREATE DATABASE webhookdb OWNER webhook'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'webhookdb')\gexec

-- 4. Connect to the new database and create tables
\c webhookdb

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id VARCHAR(36) PRIMARY KEY,
  path VARCHAR(255) UNIQUE NOT NULL,
  response_code INTEGER NOT NULL DEFAULT 200,
  response_body TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id VARCHAR(36) PRIMARY KEY,
  webhook_id VARCHAR(36) NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  method VARCHAR(10) NOT NULL,
  headers JSONB,
  body TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE webhookdb TO webhook;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO webhook;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO webhook;
