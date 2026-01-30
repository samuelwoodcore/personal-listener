#!/bin/bash
set -e

# Connect to postgres database (which always exists) to create our target database
# Use PGPASSWORD environment variable for authentication
export PGPASSWORD="$POSTGRES_PASSWORD"

psql -v ON_ERROR_STOP=1 -h localhost -U "$POSTGRES_USER" -d postgres <<-EOSQL
    -- Create the database if it doesn't exist
    SELECT 'CREATE DATABASE webhookdb'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'webhookdb')\gexec
EOSQL

# The init.sql script will run in the context of POSTGRES_DB (webhookdb)
