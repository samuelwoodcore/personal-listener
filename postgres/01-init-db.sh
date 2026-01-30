#!/bin/bash
set -e

# Connect to postgres database to create our target database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    -- Create the database if it doesn't exist
    SELECT 'CREATE DATABASE webhookdb'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'webhookdb')\gexec
EOSQL
