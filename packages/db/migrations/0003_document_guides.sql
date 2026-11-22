-- 0003_document_guides.sql
-- Add issuing_guide JSONB to documents and populate synthetic sample guides

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS issuing_guide JSONB DEFAULT '{}'::jsonb;

-- Update Document 1: Income Certificate (Form F / RD)
UPDATE documents
SET issuing_guide = '{
  "purpose": {
    "en": "Official revenue certificate proving gross annual household income for government schemes and scholarships in Karnataka.",
    "kn": "ಕರ್ನಾಟಕದಲ್ಲಿ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನಗಳಿಗೆ ಒಟ್ಟು ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯವನ್ನು ಸಾಬೀತುಪಡಿಸುವ ಅಧಿಕೃತ ಕಂದಾಯ ಪ್ರಮಾಣಪತ್ರ."
  },
  "prerequisites": [
    {
      "name": "Ration Card (BPL or APL)",
      "description": { "en": "Used to verify household family members and address." }
    },
    {
      "name": "Aadhaar Card of Applicant / Parent",
      "description": { "en": "Used for identity and biometric/OTP authentication." }
    },
    {
      "name": "Income Proof / Self-Declaration",
      "description": { "en": "Salary slip, Form 16, agricultural land record (RTC), or signed self-declaration." }
    }
  ],
  "issuingAuthority": {
    "name": "Nadakacheri (Atalji Janasnehi Kendra)",
    "department": "Revenue Department, Government of Karnataka",
    "portalUrl": "https://nadakacheri.karnataka.gov.in",
    "physicalOffices": "Nadakacheri Centres, Bangalore One, Karnataka One, Grama One counters",
    "helpline": "080-22370281"
  },
  "processingTimeDays": 14,
  "fees": {
    "en": "₹25 user service fee at assisted citizen counters; ₹0 on official portal for direct online application.",
    "kn": "ಸಹಾಯ ಕೇಂದ್ರಗಳಲ್ಲಿ ₹೨೫ ಶುಲ್ಕ; ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಸ್ವಯಂ ಅರ್ಜಿ ಉಚಿತ."
  },
  "validityPeriod": {
    "en": "Valid for 5 years from date of issue in Karnataka.",
    "kn": "ಕರ್ನಾಟಕದಲ್ಲಿ ನೀಡಲಾದ ದಿನಾಂಕದಿಂದ ೫ ವರ್ಷಗಳವರೆಗೆ ಮಾನ್ಯವಾಗಿರುತ್ತದೆ."
  },
  "steps": [
    {
      "stepNumber": 1,
      "title": "Prepare Required Information",
      "description": {
        "en": "Ensure you have your 12-digit Aadhaar number, Ration card number, and mobile number linked to Aadhaar ready.",
        "kn": "ಆಧಾರ್ ಸಂಖ್ಯೆ, ಪಡಿತರ ಚೀಟಿ ಸಂಖ್ಯೆ ಮತ್ತು ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ಸಿದ್ಧವಾಗಿಡಿ."
      }
    },
    {
      "stepNumber": 2,
      "title": "Submit Application Online or at Citizen Centre",
      "description": {
        "en": "Visit the official Nadakacheri portal (Online Application -> Income Certificate) or submit via any Grama One / Bangalore One center.",
        "kn": "ಅಧಿಕೃತ ನಾಡಕಚೇರಿ ಪೋರ್ಟಲ್‌ಗೆ ಭೇಟಿ ನೀಡಿ ಅಥವಾ ಗ್ರಾಮ ಒನ್ / ಬೆಂಗಳೂರು ಒನ್ ಕೇಂದ್ರದ ಮೂಲಕ ಸಲ್ಲಿಸಿ."
      },
      "officialUrl": "https://nadakacheri.karnataka.gov.in"
    },
    {
      "stepNumber": 3,
      "title": "Field Verification & Digital Issuance",
      "description": {
        "en": "The Revenue Inspector / Village Administrative Officer conducts verification within 14 days.",
        "kn": "ಕಂದಾಯ ನಿರೀಕ್ಷಕರು ೧೪ ದಿನಗಳ ಒಳಗೆ ಪರಿಶೀಲನೆ ನಡೆಸಿ ಅನುಮೋದಿಸುತ್ತಾರೆ."
      }
    },
    {
      "stepNumber": 4,
      "title": "Download Certificate with RD Number",
      "description": {
        "en": "Download your digitally signed Form F certificate using your RD application acknowledgment number.",
        "kn": "ನಿಮ್ಮ ಆರ್‌ಡಿ ಸಂಖ್ಯೆಯನ್ನು ಬಳಸಿ ಡಿಜಿಟಲ್ ಸಹಿ ಮಾಡಿದ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ."
      },
      "officialUrl": "https://nadakacheri.karnataka.gov.in"
    }
  ],
  "alternativeDocuments": ["Income statement from Gazetted Officer (where explicitly permitted)"]
}'::jsonb
WHERE id = 'd0000000-0000-0000-0000-000000000001';

-- Update Document 2: Caste Certificate
UPDATE documents
SET issuing_guide = '{
  "purpose": {
    "en": "Official revenue certificate validating SC/ST/OBC category reservation for academic admissions and welfare assistance.",
    "kn": "ಶೈಕ್ಷಣಿಕ ಪ್ರವೇಶ ಮತ್ತು ಕಲ್ಯಾಣ ನೆರವಿಗಾಗಿ ಎಸ್‌ಸಿ/ಎಸ್‌ಟಿ/ಒಬಿಸಿ ವರ್ಗ ಮೀಸಲಾತಿಯನ್ನು ದೃಢೀಕರಿಸುವ ಅಧಿಕೃತ ಪ್ರಮಾಣಪತ್ರ."
  },
  "prerequisites": [
    {
      "name": "Aadhaar Card",
      "description": { "en": "Proof of identity." }
    },
    {
      "name": "Ration Card or Voter ID",
      "description": { "en": "Proof of residence in Karnataka." }
    },
    {
      "name": "School Transfer Certificate (TC)",
      "description": { "en": "TC or cumulative record confirming applicant/parent caste." }
    }
  ],
  "issuingAuthority": {
    "name": "Tahsildar / Nadakacheri",
    "department": "Revenue Department, Government of Karnataka",
    "portalUrl": "https://nadakacheri.karnataka.gov.in",
    "physicalOffices": "Taluk Office, Nadakacheri, Grama One",
    "helpline": "080-22370281"
  },
  "processingTimeDays": 21,
  "fees": {
    "en": "₹25 user fee at citizen service centres.",
    "kn": "ನಾಗರಿಕ ಸೇವಾ ಕೇಂದ್ರಗಳಲ್ಲಿ ₹೨೫ ಶುಲ್ಕ."
  },
  "validityPeriod": {
    "en": "SC/ST certificates are permanent. Category 1/2A/2B/3A/3B certificates are valid for 5 years.",
    "kn": "ಎಸ್‌ಸಿ/ಎಸ್‌ಟಿ ಪ್ರಮಾಣಪತ್ರಗಳು ಶಾಶ್ವತ. ಪ್ರವರ್ಗ ೧/೨ಎ/೨ಬಿ/೩ಎ/೩ಬಿ ಪ್ರಮಾಣಪತ್ರಗಳು ೫ ವರ್ಷಗಳವರೆಗೆ ಮಾನ್ಯ."
  },
  "steps": [
    {
      "stepNumber": 1,
      "title": "Gather Family Proof of Caste",
      "description": {
        "en": "Locate school transfer certificates, father/sibling caste certificate, or revenue records.",
        "kn": "ಶಾಲಾ ವರ್ಗಾವಣೆ ಪ್ರಮಾಣಪತ್ರ ಅಥವಾ ಕುಟುಂಬದ ಇತರ ಸದಸ್ಯರ ಜಾತಿ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಹುಡುಕಿ."
      }
    },
    {
      "stepNumber": 2,
      "title": "Apply at Nadakacheri or Grama One",
      "description": {
        "en": "Submit application online on Nadakacheri portal or visit your nearest Grama One counter.",
        "kn": "ನಾಡಕಚೇರಿ ಪೋರ್ಟಲ್ ಅಥವಾ ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ ಕೌಂಟರ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ."
      },
      "officialUrl": "https://nadakacheri.karnataka.gov.in"
    },
    {
      "stepNumber": 3,
      "title": "Receive RD Number & Download Certificate",
      "description": {
        "en": "Once approved by the Tahsildar, download the digitally signed certificate using your RD number.",
        "kn": "ತಹಶೀಲ್ದಾರ್ ಅನುಮೋದಿಸಿದ ನಂತರ ನಿಮ್ಮ ಆರ್‌ಡಿ ಸಂಖ್ಯೆ ಬಳಸಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ."
      }
    }
  ]
}'::jsonb
WHERE id = 'd0000000-0000-0000-0000-000000000002';

-- Update Document 3: Previous Year Marks Card
UPDATE documents
SET issuing_guide = '{
  "purpose": {
    "en": "Confirms completion and passing grades in the qualifying prior academic year.",
    "kn": "ಹಿಂದಿನ ಶೈಕ್ಷಣಿಕ ವರ್ಷದಲ್ಲಿ ತೇರ್ಗಡೆ ಹೊಂದಿರುವುದನ್ನು ದೃಢೀಕರಿಸುತ್ತದೆ."
  },
  "prerequisites": [
    {
      "name": "Examination Registration / Roll Number",
      "description": { "en": "Unique board registration number." }
    },
    {
      "name": "Institution Student ID",
      "description": { "en": "Proof of student enrolment." }
    }
  ],
  "issuingAuthority": {
    "name": "KSEAB / University Examination Division",
    "department": "Department of School Education / Collegiate Education",
    "portalUrl": "https://kseab.karnataka.gov.in",
    "physicalOffices": "School / College Principal Office",
    "helpline": "080-23349434"
  },
  "processingTimeDays": 7,
  "fees": {
    "en": "Issued free by institution upon course completion; nominal fee for duplicate copies.",
    "kn": "ಕೋರ್ಸ್ ಪೂರ್ಣಗೊಂಡ ನಂತರ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಯಿಂದ ಉಚಿತ; ನಕಲು ಪ್ರತಿಯನ್ನು ಪಡೆಯಲು ನಿಗದಿತ ಶುಲ್ಕ."
  },
  "validityPeriod": {
    "en": "Permanent official academic record.",
    "kn": "ಶಾಶ್ವತ ಅಧಿಕೃತ ಶೈಕ್ಷಣಿಕ ದಾಖಲೆ."
  },
  "steps": [
    {
      "stepNumber": 1,
      "title": "Collect Marks Card from Institution",
      "description": {
        "en": "Collect signed original marks card or provisional statement from your college nodal desk.",
        "kn": "ನಿಮ್ಮ ಕಾಲೇಜು ಅಥವಾ ಶಾಲೆಯಿಂದ ಮೂಲ ಅಂಕಪಟ್ಟಿ ಅಥವಾ ತಾತ್ಕಾಲಿಕ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಪಡೆಯಿರಿ."
      }
    },
    {
      "stepNumber": 2,
      "title": "Complete e-Attestation for Scholarship",
      "description": {
        "en": "Upload marks card onto the SSP e-Attestation portal for digital verification by your college nodal officer.",
        "kn": "ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕಾಗಿ ಕಾಲೇಜು ನೋಡಲ್ ಅಧಿಕಾರಿಯಿಂದ ಇ-ದೃಢೀಕರಣ ಮಾಡಿಸಿ."
      },
      "officialUrl": "https://ssp.postmatric.karnataka.gov.in"
    }
  ]
}'::jsonb
WHERE id = 'd0000000-0000-0000-0000-000000000003';

-- Update Document 4: Proof of Age & Address
UPDATE documents
SET issuing_guide = '{
  "purpose": {
    "en": "Confirms age (60 years or above) and domicile residence in Karnataka.",
    "kn": "ವಯಸ್ಸು (೬೦ ವರ್ಷ ಅಥವಾ ಮೇಲ್ಪಟ್ಟು) ಮತ್ತು ಕರ್ನಾಟಕದಲ್ಲಿ ವಾಸವಾಗಿರುವುದನ್ನು ದೃಢೀಕರಿಸುತ್ತದೆ."
  },
  "prerequisites": [
    {
      "name": "Existing Photo Identity Document",
      "description": { "en": "Voter ID card, Passport, PAN Card, or Birth Certificate." }
    },
    {
      "name": "Proof of Address",
      "description": { "en": "Electricity bill, water bill, or Ration card with current Karnataka address." }
    }
  ],
  "issuingAuthority": {
    "name": "Election Commission of India / UIDAI / Revenue Department",
    "department": "Various Authoritative Issuing Departments",
    "portalUrl": "https://voters.eci.gov.in",
    "physicalOffices": "Taluk Office, Post Office, Citizen Service Centres",
    "helpline": "1950"
  },
  "processingTimeDays": 10,
  "fees": {
    "en": "Statutory nominal charges or free depending on document channel.",
    "kn": "ದಾಖಲೆಯ ಪ್ರಕಾರ ನಿಗದಿತ ಕನಿಷ್ಠ ಶುಲ್ಕ ಅಥವಾ ಉಚಿತ."
  },
  "validityPeriod": {
    "en": "Permanent identification record.",
    "kn": "ಶಾಶ್ವತ ಗುರುತಿನ ದಾಖಲೆ."
  },
  "steps": [
    {
      "stepNumber": 1,
      "title": "Identify Accepted Document",
      "description": {
        "en": "Choose any recognized proof showing your date of birth (e.g. Voter ID, School Transfer Certificate, Passport).",
        "kn": "ನಿಮ್ಮ ಜನ್ಮ ದಿನಾಂಕವನ್ನು ಹೊಂದಿರುವ ಯಾವುದೇ ಮಾನ್ಯತೆ ಪಡೆದ ದಾಖಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ."
      }
    },
    {
      "stepNumber": 2,
      "title": "Update Address if Relocated",
      "description": {
        "en": "If your address changed, update it online on the Voters portal or Aadhaar portal before applying.",
        "kn": "ನಿಮ್ಮ ವಿಳಾಸ ಬದಲಾಗಿದ್ದರೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮುನ್ನ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ನವೀಕರಿಸಿ."
      },
      "officialUrl": "https://voters.eci.gov.in"
    }
  ]
}'::jsonb
WHERE id = 'd0000000-0000-0000-0000-000000000004';
