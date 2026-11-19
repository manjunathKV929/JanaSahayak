-- Migration: 0000_bootstrap
-- Phase 1 foundation: required PostgreSQL extensions for UUIDs and trigram search.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
