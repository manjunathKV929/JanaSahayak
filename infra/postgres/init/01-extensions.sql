-- JanaSahayak PostgreSQL bootstrap extensions
-- Runs automatically on fresh Docker container initialization.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;
