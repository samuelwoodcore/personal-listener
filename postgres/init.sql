-- Docker PostgreSQL initialization script
-- This file is automatically executed when the PostgreSQL container starts for the first time
-- Place in /docker-entrypoint-initdb.d/ directory
-- Note: POSTGRES_DB environment variable (webhookdb) automatically creates the database
-- This script runs in the context of that database

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) DEFAULT '',
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
  response_reference VARCHAR(255) UNIQUE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
