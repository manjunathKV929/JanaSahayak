-- Migration: 0006_advanced_features.sql
-- Description: Phase 13 Advanced Features: Locations, Service Location mapping, and Verified Deadlines

-- 1. Official Service Locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  center_type TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  taluk TEXT,
  state_code VARCHAR(2) NOT NULL DEFAULT 'KA',
  pincode VARCHAR(10),
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  contact_phone TEXT,
  operating_hours TEXT,
  verified_source_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Service to Location Mapping
CREATE TABLE IF NOT EXISTS service_locations (
  service_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  assistance_type TEXT NOT NULL DEFAULT 'IN_PERSON_ASSISTANCE',
  PRIMARY KEY (service_id, location_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_locations_district ON locations(district);
CREATE INDEX IF NOT EXISTS idx_locations_center_type ON locations(center_type);
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state_code);
CREATE INDEX IF NOT EXISTS idx_locations_pincode ON locations(pincode);
CREATE INDEX IF NOT EXISTS idx_deadlines_status ON deadlines(status);
CREATE INDEX IF NOT EXISTS idx_deadlines_closes_at ON deadlines(closes_at);

-- 4. Seed Official Karnataka Citizen Assistance Locations
INSERT INTO locations (
  id,
  name,
  center_type,
  address,
  district,
  taluk,
  state_code,
  pincode,
  latitude,
  longitude,
  contact_phone,
  operating_hours,
  verified_source_url,
  is_active
)
VALUES
(
  'loc00000-0000-0000-0000-000000000001',
  'Bangalore One — Koramangala Civic Centre',
  'B1_K1_CENTRE',
  '80 Feet Road, 4th Block, Koramangala, Bengaluru',
  'Bengaluru Urban',
  'Bengaluru South',
  'KA',
  '560034',
  12.934400,
  77.625600,
  '080-22967111',
  'Mon–Sat: 08:00 AM – 07:00 PM; Sun: 09:00 AM – 01:00 PM',
  'https://karnataka.gov.in/bangaloreone',
  true
),
(
  'loc00000-0000-0000-0000-000000000002',
  'Karnataka One — Hubballi Urban Center',
  'B1_K1_CENTRE',
  'Corporation Complex, Neeligin Road, Hubballi',
  'Dharwad',
  'Hubballi Urban',
  'KA',
  '580020',
  15.364700,
  75.124000,
  '0836-2256789',
  'Mon–Sat: 09:00 AM – 06:00 PM',
  'https://karnatakaone.gov.in',
  true
),
(
  'loc00000-0000-0000-0000-000000000003',
  'Nadakacheri (Atalji Janasnehi Kendra) — Bengaluru South (Kengeri)',
  'NADAKACHERI',
  'Mysore Road, Near Kengeri Bus Terminal, Kengeri, Bengaluru',
  'Bengaluru Urban',
  'Bengaluru South',
  'KA',
  '560060',
  12.910000,
  77.484000,
  '080-28485555',
  'Mon–Sat: 10:00 AM – 05:30 PM (2nd & 4th Sat Holiday)',
  'https://nadakacheri.karnataka.gov.in',
  true
),
(
  'loc00000-0000-0000-0000-000000000004',
  'Nadakacheri — Mysuru Rural Center',
  'NADAKACHERI',
  'Taluk Office Premises, Nazarbad, Mysuru',
  'Mysuru',
  'Mysuru Rural',
  'KA',
  '570010',
  12.305100,
  76.655200,
  '0821-2423333',
  'Mon–Sat: 10:00 AM – 05:30 PM',
  'https://nadakacheri.karnataka.gov.in',
  true
),
(
  'loc00000-0000-0000-0000-000000000005',
  'Taluk Office (Tahasildar Desk) — Bengaluru North (Yelahanka)',
  'TALUK_OFFICE',
  'Mini Vidhana Soudha, Yelahanka Old Town, Bengaluru',
  'Bengaluru Urban',
  'Yelahanka',
  'KA',
  '560064',
  13.100700,
  77.596300,
  '080-28562222',
  'Mon–Fri: 10:00 AM – 05:30 PM',
  'https://bengaluruurban.nic.in',
  true
),
(
  'loc00000-0000-0000-0000-000000000006',
  'Grama One — Mandya Rural Citizen Desk',
  'SEVA_KENDRA',
  'Gram Panchayat Office, Keragodu Hobli, Mandya',
  'Mandya',
  'Mandya',
  'KA',
  '571446',
  12.523000,
  76.898000,
  '08232-224400',
  'Mon–Sat: 09:30 AM – 06:00 PM',
  'https://gramaone.karnataka.gov.in',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Service-Location Relationships
INSERT INTO service_locations (service_id, location_id, assistance_type)
VALUES
(
  'e0000000-0000-0000-0000-000000000001', -- Post-Matric Scholarship
  'loc00000-0000-0000-0000-000000000001', -- Bangalore One Koramangala
  'BIOMETRIC_EKYC'
),
(
  'e0000000-0000-0000-0000-000000000001', -- Post-Matric Scholarship
  'loc00000-0000-0000-0000-000000000002', -- Karnataka One Hubballi
  'BIOMETRIC_EKYC'
),
(
  'e0000000-0000-0000-0000-000000000001', -- Post-Matric Scholarship
  'loc00000-0000-0000-0000-000000000003', -- Nadakacheri Kengeri
  'DOCUMENT_SUBMISSION'
),
(
  'e0000000-0000-0000-0000-000000000002', -- Senior Citizen Card
  'loc00000-0000-0000-0000-000000000001', -- Bangalore One Koramangala
  'APPLICATION_FILING'
),
(
  'e0000000-0000-0000-0000-000000000002', -- Senior Citizen Card
  'loc00000-0000-0000-0000-000000000004', -- Nadakacheri Mysuru
  'APPLICATION_FILING'
),
(
  'e0000000-0000-0000-0000-000000000002', -- Senior Citizen Card
  'loc00000-0000-0000-0000-000000000005', -- Taluk Office Yelahanka
  'IN_PERSON_ASSISTANCE'
),
(
  'e0000000-0000-0000-0000-000000000002', -- Senior Citizen Card
  'loc00000-0000-0000-0000-000000000006', -- Grama One Mandya
  'APPLICATION_FILING'
)
ON CONFLICT (service_id, location_id) DO NOTHING;

-- 6. Additional Verified Deadlines
INSERT INTO deadlines (id, service_id, name, opens_at, closes_at, source_id, status)
VALUES
(
  'dl000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000002', -- Senior Citizen Card
  'Annual Healthcare Entitlement Verification Cycle',
  '2026-10-01 00:00:00+00',
  '2026-12-15 23:59:59+00',
  'f0000000-0000-0000-0000-000000000002',
  'OPEN'
),
(
  'dl000000-0000-0000-0000-000000000003',
  'e0000000-0000-0000-0000-000000000001', -- Post-Matric Scholarship
  'Late Fee Concession Appeal Window',
  '2027-01-05 00:00:00+00',
  '2027-01-25 23:59:59+00',
  'f0000000-0000-0000-0000-000000000001',
  'UPCOMING'
)
ON CONFLICT (id) DO NOTHING;
