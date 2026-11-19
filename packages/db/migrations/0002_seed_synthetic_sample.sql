-- Migration: 0002_seed_synthetic_sample
-- Synthetic sample data for development and testing only (Rule 2).
-- All records are clearly prefixed with 'synthetic-' or marked '[Synthetic Sample]'.

-- 1. Standard RBAC Roles
INSERT INTO roles (id, name, description)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'PUBLIC_USER', 'Standard citizen reading public guidance'),
  ('a0000000-0000-0000-0000-000000000002', 'CONTENT_EDITOR', 'Authors and updates public service guidance drafts'),
  ('a0000000-0000-0000-0000-000000000003', 'CONTENT_REVIEWER', 'Verifies and approves public service records against official sources'),
  ('a0000000-0000-0000-0000-000000000004', 'ADMIN', 'Operational administrative management'),
  ('a0000000-0000-0000-0000-000000000005', 'SECURITY_ADMIN', 'Security and audit log supervision')
ON CONFLICT (name) DO NOTHING;

-- 2. Synthetic Reviewer / Admin Actor
INSERT INTO users (id, email, phone, status)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'synthetic.reviewer@janasahayak.local', NULL, 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 3. Document Issuers
INSERT INTO document_issuers (id, name, issuer_type, portal_url)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Nadakacheri (Revenue Department, Karnataka)', 'STATE_DEPARTMENT', 'https://nadakacheri.karnataka.gov.in'),
  ('c0000000-0000-0000-0000-000000000002', 'Karnataka School Examination and Assessment Board', 'ACADEMIC_BOARD', 'https://kseab.karnataka.gov.in')
ON CONFLICT (id) DO NOTHING;

-- 4. Documents
INSERT INTO documents (id, name, description, document_type, issuer_id)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'Income Certificate (Form F / RD)',
    'Official revenue certificate proving annual gross family income.',
    'CERTIFICATE',
    'c0000000-0000-0000-0000-000000000001'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'Caste Certificate',
    'Official revenue certificate validating SC/ST/OBC category reservation.',
    'CERTIFICATE',
    'c0000000-0000-0000-0000-000000000001'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'Previous Year Marks Card / Transcript',
    'Educational transcript showing passing grade in qualifying examination.',
    'ACADEMIC_RECORD',
    'c0000000-0000-0000-0000-000000000002'
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'Proof of Age & Address',
    'Standard document (Voter ID, School Leaving Certificate, or Passport) verifying age and residence.',
    'IDENTITY_PROOF',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Service 1: [Synthetic Sample] Post-Matric Scholarship
INSERT INTO service_records (
  id,
  slug,
  service_type,
  title,
  short_description,
  department_name,
  state_code,
  status,
  current_version_id
)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'synthetic-post-matric-scholarship',
  'SCHOLARSHIP',
  '[Synthetic Sample] Post-Matric Scholarship Scheme (Karnataka)',
  'Financial assistance for eligible post-secondary students pursuing recognized courses in Karnataka.',
  'Department of Social Welfare',
  'KA',
  'PUBLISHED',
  NULL
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_versions (
  id,
  service_id,
  version_number,
  content,
  language,
  effective_from,
  effective_to,
  created_by,
  approved_by
)
VALUES (
  'e0000000-0000-0000-0001-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  1,
  '{
    "overview": "Provides tuition and maintenance allowances to eligible post-matric students.",
    "benefitAmount": "Up to ₹25,000 per academic year depending on course tier",
    "applicationChannel": "Online via Seva Sindhu / State Scholarship Portal (SSP)"
  }'::jsonb,
  'en',
  '2026-06-01',
  '2027-05-31',
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (service_id, version_number) DO NOTHING;

UPDATE service_records
SET current_version_id = 'e0000000-0000-0000-0001-000000000001'
WHERE id = 'e0000000-0000-0000-0000-000000000001';

INSERT INTO service_sources (
  id,
  service_id,
  source_url,
  source_type,
  publisher,
  retrieved_at,
  last_verified_at,
  verification_status,
  review_notes
)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'https://sevasindhu.karnataka.gov.in',
  'OFFICIAL_PORTAL',
  'Department of Social Welfare, Government of Karnataka',
  NOW(),
  NOW(),
  'VERIFIED',
  'Verified guidelines against official portal notification.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_documents (id, service_id, document_id, is_required, conditions, display_order)
VALUES
  ('d0000000-0000-0001-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', true, NULL, 1),
  ('d0000000-0000-0001-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', true, '{"categoryExempt": ["GENERAL"]}'::jsonb, 2),
  ('d0000000-0000-0001-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', true, NULL, 3)
ON CONFLICT (service_id, document_id) DO NOTHING;

INSERT INTO eligibility_questions (id, service_id, key, question_text, answer_type, required, display_order)
VALUES
  (
    'q0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'stateDomicile',
    '{"en": "Are you a permanent resident / domiciled in Karnataka?", "hi": "क्या आप कर्नाटक के स्थायी निवासी हैं?", "kn": "ನೀವು ಕರ್ನಾಟಕದ ಖಾಯಂ ನಿವಾಸಿಯೇ?"}'::jsonb,
    'boolean',
    true,
    1
  ),
  (
    'q0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000001',
    'annualIncome',
    '{"en": "What is your total annual family income in rupees?", "hi": "आपकी कुल वार्षिक पारिवारिक आय कितनी है?", "kn": "ನಿಮ್ಮ ಒಟ್ಟು ವಾರ್ಷಿಕ ಕುಟುಂಬದ ಆದಾಯ ಎಷ್ಟು?"}'::jsonb,
    'number',
    true,
    2
  )
ON CONFLICT (service_id, key) DO NOTHING;

INSERT INTO eligibility_rules (id, service_id, name, rule_expression, explanation, priority)
VALUES (
  'r0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'Karnataka Domicile and Income Ceiling Rule',
  '{
    "all": [
      {"field": "stateDomicile", "operator": "==", "value": true},
      {"field": "annualIncome", "operator": "<=", "value": 250000}
    ]
  }'::jsonb,
  '{
    "en": "Applicant must reside in Karnataka and have an annual family income of ₹2,50,000 or less.",
    "hi": "आवेदक कर्नाटक का निवासी होना चाहिए और वार्षिक पारिवारिक आय ₹2,50,000 या उससे कम होनी चाहिए।",
    "kn": "ಅರ್ಜಿದಾರರು ಕರ್ನಾಟಕದಲ್ಲಿ ವಾಸಿಸುತ್ತಿರಬೇಕು ಮತ್ತು ವಾರ್ಷಿಕ ಕುಟುಂಬದ ಆದಾಯ ₹2,50,000 ಅಥವಾ ಅದಕ್ಕಿಂತ ಕಡಿಮೆ ಇರಬೇಕು."
  }'::jsonb,
  1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO journeys (id, service_id, title, description, version)
VALUES (
  'j0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'Post-Matric Scholarship Preparation & Application Journey',
  'Step-by-step guidance to ensure readiness before submitting on the official portal.',
  1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO journey_steps (id, journey_id, step_key, title, description, step_type, display_order, official_url)
VALUES
  (
    's0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'check_income_certificate',
    'Check Income Certificate Validity',
    '{"en": "Confirm your Income Certificate RD number is valid and was issued within the last 12 months."}'::jsonb,
    'DOCUMENT_CHECK',
    1,
    'https://nadakacheri.karnataka.gov.in'
  ),
  (
    's0000000-0000-0000-0000-000000000002',
    'j0000000-0000-0000-0000-000000000001',
    'apply_on_ssp',
    'Submit Online Application on State Scholarship Portal',
    '{"en": "Login to the official State Scholarship Portal and enter your Nadakacheri certificate numbers."}'::jsonb,
    'OFFICIAL_ACTION',
    2,
    'https://ssp.postmatric.karnataka.gov.in'
  )
ON CONFLICT (journey_id, step_key) DO NOTHING;

INSERT INTO deadlines (id, service_id, name, opens_at, closes_at, source_id, status)
VALUES (
  'dl000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'Academic Year 2026-27 Application Deadline',
  '2026-08-01 00:00:00+00',
  '2026-12-31 23:59:59+00',
  'f0000000-0000-0000-0000-000000000001',
  'OPEN'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO content_reviews (id, service_id, reviewer_id, decision, notes)
VALUES (
  'cr000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'APPROVED',
  'Synthetic service verified for Phase 3 database seed testing.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, metadata)
VALUES (
  'al000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'PUBLISH_SERVICE',
  'service_records',
  'e0000000-0000-0000-0000-000000000001',
  '{"note": "Initial synthetic seed record published for development"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 6. Service 2: [Synthetic Sample] Senior Citizen Identity Card
INSERT INTO service_records (
  id,
  slug,
  service_type,
  title,
  short_description,
  department_name,
  state_code,
  status,
  current_version_id
)
VALUES (
  'e0000000-0000-0000-0000-000000000002',
  'synthetic-senior-citizen-card',
  'CERTIFICATE',
  '[Synthetic Sample] Senior Citizen Identity Card (Karnataka)',
  'Official identification card for senior citizens residing in Karnataka providing priority service access.',
  'Directorate for Empowerment of Senior Citizens',
  'KA',
  'PUBLISHED',
  NULL
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_versions (
  id,
  service_id,
  version_number,
  content,
  language,
  effective_from,
  created_by,
  approved_by
)
VALUES (
  'e0000000-0000-0000-0001-000000000002',
  'e0000000-0000-0000-0000-000000000002',
  1,
  '{"overview": "Recognizes citizens aged 60 and above for travel and healthcare facilitation in Karnataka."}'::jsonb,
  'en',
  '2026-01-01',
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (service_id, version_number) DO NOTHING;

UPDATE service_records
SET current_version_id = 'e0000000-0000-0000-0001-000000000002'
WHERE id = 'e0000000-0000-0000-0000-000000000002';

INSERT INTO service_sources (
  id,
  service_id,
  source_url,
  source_type,
  publisher,
  retrieved_at,
  last_verified_at,
  verification_status,
  review_notes
)
VALUES (
  'f0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000002',
  'https://sevasindhu.karnataka.gov.in',
  'OFFICIAL_PORTAL',
  'Directorate for Empowerment of Senior Citizens, Karnataka',
  NOW(),
  NOW(),
  'VERIFIED',
  'Verified guidelines against official Karnataka government circular.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_documents (id, service_id, document_id, is_required, conditions, display_order)
VALUES
  ('d0000000-0000-0002-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', true, NULL, 1)
ON CONFLICT (service_id, document_id) DO NOTHING;

INSERT INTO eligibility_questions (id, service_id, key, question_text, answer_type, required, display_order)
VALUES
  (
    'q0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000002',
    'age',
    '{"en": "What is your current age in completed years?", "hi": "आपकी वर्तमान आयु कितने वर्ष है?", "kn": "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವಯಸ್ಸು ಎಷ್ಟು?"}'::jsonb,
    'number',
    true,
    1
  )
ON CONFLICT (service_id, key) DO NOTHING;

INSERT INTO eligibility_rules (id, service_id, name, rule_expression, explanation, priority)
VALUES (
  'r0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000002',
  'Senior Citizen Minimum Age Rule',
  '{
    "all": [
      {"field": "age", "operator": ">=", "value": 60}
    ]
  }'::jsonb,
  '{
    "en": "Applicant must be 60 years of age or older.",
    "hi": "आवेदक की आयु 60 वर्ष या उससे अधिक होनी चाहिए।",
    "kn": "ಅರ್ಜಿದಾರರಿಗೆ 60 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು ವಯಸ್ಸಾಗಿರಬೇಕು."
  }'::jsonb,
  1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO journeys (id, service_id, title, description, version)
VALUES (
  'j0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000002',
  'Senior Citizen Identity Card Application Journey',
  'Simple 2-step process to apply online or via Seva Sindhu facilitation center.',
  1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO journey_steps (id, journey_id, step_key, title, description, step_type, display_order, official_url)
VALUES
  (
    's0000000-0000-0000-0000-000000000003',
    'j0000000-0000-0000-0000-000000000002',
    'prepare_age_proof',
    'Prepare Age and Address Proof',
    '{"en": "Keep a clear photocopy of your Voter ID or School Leaving certificate ready."}'::jsonb,
    'DOCUMENT_CHECK',
    1,
    NULL
  ),
  (
    's0000000-0000-0000-0000-000000000004',
    'j0000000-0000-0000-0000-000000000002',
    'submit_seva_sindhu',
    'Submit Application on Seva Sindhu',
    '{"en": "Apply through Seva Sindhu online or visit a Grama One / Bangalore One center."}'::jsonb,
    'OFFICIAL_ACTION',
    2,
    'https://sevasindhu.karnataka.gov.in'
  )
ON CONFLICT (journey_id, step_key) DO NOTHING;

INSERT INTO content_reviews (id, service_id, reviewer_id, decision, notes)
VALUES (
  'cr000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'APPROVED',
  'Senior citizen sample verified.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, metadata)
VALUES (
  'al000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'PUBLISH_SERVICE',
  'service_records',
  'e0000000-0000-0000-0000-000000000002',
  '{"note": "Initial synthetic senior citizen service record published"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
