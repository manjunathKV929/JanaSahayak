-- Migration 0004: Journey Engine, User Journeys, and Enriched Synthetic Step Templates
-- Satisfies Phase 8 requirements: journey templates, progress tracking, next step, official action links, completion rules

-- 1. User Journeys table to track active personalized citizen journeys
CREATE TABLE IF NOT EXISTS user_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_journeys_user_service ON user_journeys(user_id, service_id);

-- 2. Seed default anonymous citizen user for local-first sessions
INSERT INTO users (id, status)
VALUES ('b0000000-0000-0000-0000-000000000099', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 3. Delete existing basic steps for synthetic post-matric scholarship to replace with 5 comprehensive journey steps
DELETE FROM journey_steps WHERE journey_id = 'j0000000-0000-0000-0000-000000000001';

INSERT INTO journey_steps (id, journey_id, step_key, title, description, step_type, display_order, official_url, completion_rule)
VALUES
  (
    's0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'check_eligibility',
    'Check Eligibility & Scheme Guidelines',
    '{
      "en": "Verify that your annual family income is under ₹2.50 Lakh and you are enrolled in an eligible post-matric course in Karnataka.",
      "kn": "ನಿಮ್ಮ ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ ₹2.50 ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆಯಿದೆ ಮತ್ತು ನೀವು ಕರ್ನಾಟಕದಲ್ಲಿ ಅರ್ಹ ಮೆಟ್ರಿಕ್ ನಂತರದ ಕೋರ್ಸ್‌ನಲ್ಲಿ ದಾಖಲಾಗಿದ್ದೀರಿ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ."
    }'::jsonb,
    'ELIGIBILITY_CHECK',
    1,
    NULL,
    '{"type": "ELIGIBILITY_EVALUATION"}'::jsonb
  ),
  (
    's0000000-0000-0000-0000-000000000002',
    'j0000000-0000-0000-0000-000000000001',
    'prepare_documents',
    'Prepare Required Certificates & RD Numbers',
    '{
      "en": "Obtain your 15-digit RD Income Certificate and Caste Certificate from Nadakacheri or Atalji Janasnehi Kendra.",
      "kn": "ನಾಡಕಚೇರಿಯಿಂದ ನಿಮ್ಮ 15-ಅಂಕಿಯ RD ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಜಾತಿ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಪಡೆದುಕೊಳ್ಳಿ."
    }'::jsonb,
    'DOCUMENT_CHECK',
    2,
    'https://nadakacheri.karnataka.gov.in',
    '{"type": "DOCUMENT_CHECKLIST"}'::jsonb
  ),
  (
    's0000000-0000-0000-0000-000000000003',
    'j0000000-0000-0000-0000-000000000001',
    'create_ssp_account',
    'Create Student Account on State Scholarship Portal (SSP)',
    '{
      "en": "Register your student profile on the official SSP portal using your Aadhaar and college enrollment number.",
      "kn": "ನಿಮ್ಮ ಆಧಾರ್ ಮತ್ತು ಕಾಲೇಜು ನೋಂದಣಿ ಸಂಖ್ಯೆಯನ್ನು ಬಳಸಿಕೊಂಡು ಅಧಿಕೃತ SSP ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನಿಮ್ಮ ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್ ಅನ್ನು ನೋಂದಾಯಿಸಿ."
    }'::jsonb,
    'PREREQUISITE',
    3,
    'https://ssp.postmatric.karnataka.gov.in',
    '{"type": "MANUAL_CONFIRMATION"}'::jsonb
  ),
  (
    's0000000-0000-0000-0000-000000000004',
    'j0000000-0000-0000-0000-000000000001',
    'submit_ssp_application',
    'Submit Online Scholarship Application',
    '{
      "en": "Log in to SSP, enter your RD certificate numbers, select your institution/hostel, and submit your scholarship e-application.",
      "kn": "SSP ಗೆ ಲಾಗಿನ್ ಮಾಡಿ, RD ಪ್ರಮಾಣಪತ್ರ ಸಂಖ್ಯೆಗಳನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಯನ್ನು ಸಲ್ಲಿಸಿ."
    }'::jsonb,
    'OFFICIAL_ACTION',
    4,
    'https://ssp.postmatric.karnataka.gov.in',
    '{"type": "APPLICATION_REFERENCE", "required": false}'::jsonb
  ),
  (
    's0000000-0000-0000-0000-000000000005',
    'j0000000-0000-0000-0000-000000000001',
    'track_scholarship_status',
    'Track College Verification & Disbursal Status',
    '{
      "en": "Track the application through college verification, taluk officer approval, and DBT bank account crediting.",
      "kn": "ಕಾಲೇಜು ಪರಿಶೀಲನೆ, ತಾಲೂಕು ಅಧಿಕಾರಿ ಅನುಮೋದನೆ ಮತ್ತು ಡಿಬಿಟಿ ಖಾತೆಗೆ ಜಮೆಯಾಗುವ ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ."
    }'::jsonb,
    'TRACKING',
    5,
    'https://ssp.postmatric.karnataka.gov.in',
    '{"type": "MANUAL_CONFIRMATION"}'::jsonb
  );

-- 4. Delete existing basic steps for Senior Citizen Card and replace with structured journey
DELETE FROM journey_steps WHERE journey_id = 'j0000000-0000-0000-0000-000000000002';

INSERT INTO journey_steps (id, journey_id, step_key, title, description, step_type, display_order, official_url, completion_rule)
VALUES
  (
    's0000000-0000-0000-0000-000000000006',
    'j0000000-0000-0000-0000-000000000002',
    'verify_age_and_residence',
    'Verify Age and Address Proof Documents',
    '{
      "en": "Keep valid government age proof (Aadhaar, Voter ID, or Passport) confirming age 60+ and Karnataka domicile ready.",
      "kn": "60+ ವಯಸ್ಸು ಮತ್ತು ಕರ್ನಾಟಕ ವಾಸಸ್ಥಳವನ್ನು ದೃಢೀಕರಿಸುವ ಮಾನ್ಯ ವಯಸ್ಸಿನ ಪುರಾವೆ ದಾಖಲೆಯನ್ನು ಸಿದ್ಧವಾಗಿಡಿ."
    }'::jsonb,
    'DOCUMENT_CHECK',
    1,
    NULL,
    '{"type": "DOCUMENT_CHECKLIST"}'::jsonb
  ),
  (
    's0000000-0000-0000-0000-000000000007',
    'j0000000-0000-0000-0000-000000000002',
    'submit_seva_sindhu',
    'Submit Application on Seva Sindhu / Grama One',
    '{
      "en": "Apply online via Seva Sindhu portal or visit your nearest Grama One / Bangalore One civic center.",
      "kn": "ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್ ಮೂಲಕ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಅಥವಾ ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ / ಬೆಂಗಳೂರು ಒನ್ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ."
    }'::jsonb,
    'OFFICIAL_ACTION',
    2,
    'https://sevasindhu.karnataka.gov.in',
    '{"type": "MANUAL_CONFIRMATION"}'::jsonb
  ),
  (
    's0000000-0000-0000-0000-000000000008',
    'j0000000-0000-0000-0000-000000000002',
    'track_and_collect_card',
    'Track Status and Download Digital Senior Citizen Card',
    '{
      "en": "Track application status using your acknowledgment number and download the verified digital card.",
      "kn": "ನಿಮ್ಮ ಸ್ವೀಕೃತಿ ಸಂಖ್ಯೆಯನ್ನು ಬಳಸಿ ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ಪರಿಶೀಲಿಸಿದ ಡಿಜಿಟಲ್ ಕಾರ್ಡ್ ಅನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ."
    }'::jsonb,
    'TRACKING',
    3,
    'https://sevasindhu.karnataka.gov.in',
    '{"type": "MANUAL_CONFIRMATION"}'::jsonb
  );
