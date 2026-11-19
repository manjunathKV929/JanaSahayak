-- Migration: 0001_core_content_model
-- Relational schema per DATABASE_SCHEMA.md and SYSTEM_ARCHITECTURE.md

-- Enums
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE service_status AS ENUM (
    'DRAFT',
    'IN_REVIEW',
    'VERIFIED',
    'PUBLISHED',
    'REVIEW_DUE',
    'DEPRECATED',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM (
    'VERIFIED',
    'REVIEW_DUE',
    'DEPRECATED',
    'DISPUTED',
    'UNVERIFIED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE review_decision AS ENUM (
    'APPROVED',
    'REJECTED',
    'CHANGES_REQUESTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE journey_progress_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'BLOCKED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Roles & Users
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  status user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  state_code TEXT,
  district_code TEXT,
  accessibility_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Service Records & Versions
CREATE TABLE IF NOT EXISTS service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  service_type TEXT NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  department_name TEXT NOT NULL,
  state_code TEXT,
  status service_status NOT NULL DEFAULT 'DRAFT',
  current_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  language TEXT NOT NULL DEFAULT 'en',
  effective_from DATE,
  effective_to DATE,
  created_by UUID NOT NULL,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_id, version_number)
);

-- Circular FK for current_version_id
DO $$ BEGIN
  ALTER TABLE service_records
    ADD CONSTRAINT fk_service_records_current_version
    FOREIGN KEY (current_version_id)
    REFERENCES service_versions(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Document Issuers & Documents
CREATE TABLE IF NOT EXISTS document_issuers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  issuer_type TEXT NOT NULL,
  portal_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  document_type TEXT NOT NULL,
  issuer_id UUID REFERENCES document_issuers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB,
  display_order INT NOT NULL DEFAULT 1,
  UNIQUE (service_id, document_id)
);

-- 4. Eligibility Questions & Deterministic Rules
CREATE TABLE IF NOT EXISTS eligibility_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  question_text JSONB NOT NULL,
  answer_type TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 1,
  UNIQUE (service_id, key)
);

CREATE TABLE IF NOT EXISTS eligibility_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES eligibility_questions(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label JSONB NOT NULL,
  display_order INT NOT NULL DEFAULT 1,
  UNIQUE (question_id, key)
);

CREATE TABLE IF NOT EXISTS eligibility_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_expression JSONB NOT NULL,
  explanation JSONB NOT NULL,
  priority INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Journeys & Steps
CREATE TABLE IF NOT EXISTS journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journey_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description JSONB NOT NULL,
  step_type TEXT NOT NULL DEFAULT 'ACTION',
  display_order INT NOT NULL DEFAULT 1,
  official_url TEXT,
  completion_rule JSONB,
  UNIQUE (journey_id, step_key)
);

CREATE TABLE IF NOT EXISTS user_journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES journey_steps(id) ON DELETE CASCADE,
  status journey_progress_status NOT NULL DEFAULT 'PENDING',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, step_id)
);

-- 6. Sources, Deadlines, Reviews & Audit
CREATE TABLE IF NOT EXISTS service_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  publisher TEXT NOT NULL,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  review_notes TEXT
);

CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  source_id UUID REFERENCES service_sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'UPCOMING'
);

CREATE TABLE IF NOT EXISTS content_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  decision review_decision NOT NULL,
  notes TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes per DATABASE_SCHEMA.md Section 19
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_phone_idx ON users(phone);
CREATE INDEX IF NOT EXISTS service_records_slug_idx ON service_records(slug);
CREATE INDEX IF NOT EXISTS service_records_status_idx ON service_records(status);
CREATE INDEX IF NOT EXISTS service_records_state_code_idx ON service_records(state_code);
CREATE INDEX IF NOT EXISTS service_sources_service_id_idx ON service_sources(service_id);
CREATE INDEX IF NOT EXISTS service_sources_last_verified_at_idx ON service_sources(last_verified_at);
CREATE INDEX IF NOT EXISTS deadlines_closes_at_idx ON deadlines(closes_at);
CREATE INDEX IF NOT EXISTS eligibility_questions_service_id_idx ON eligibility_questions(service_id);
CREATE INDEX IF NOT EXISTS eligibility_rules_service_id_idx ON eligibility_rules(service_id);
CREATE INDEX IF NOT EXISTS service_documents_service_id_idx ON service_documents(service_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

-- Trigram search indexes
CREATE INDEX IF NOT EXISTS service_records_title_trgm_idx ON service_records USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS service_records_desc_trgm_idx ON service_records USING GIN (short_description gin_trgm_ops);
