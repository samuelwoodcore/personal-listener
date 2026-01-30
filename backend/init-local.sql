-- Local PostgreSQL setup script
-- Run this as postgres superuser: psql -U postgres -f init-local.sql

-- Create user/role (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'webhook') THEN
    CREATE USER webhook WITH PASSWORD 'webhook123';
  END IF;
END
$$;

-- Create database (if it doesn't exist)
SELECT 'CREATE DATABASE webhookdb OWNER webhook'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'webhookdb')\gexec
