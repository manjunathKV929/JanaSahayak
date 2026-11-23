import type { LifeEventKey, LifeEventRecord } from '@janasahayak/types';

export const CURATED_LIFE_EVENTS: LifeEventRecord[] = [
  {
    id: 'le000000-0000-0000-0000-000000000001',
    key: 'EDUCATION_HIGHER',
    order: 1,
    icon: 'AcademicCapIcon',
    title: {
      en: 'Higher Education & Student Support',
      kn: 'ಉನ್ನತ ಶಿಕ್ಷಣ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿ ಬೆಂಬಲ',
      hi: 'उच्च शिक्षा और छात्र सहायता',
    },
    description: {
      en: 'Comprehensive support bundle for students pursuing post-matric, degree, or professional studies.',
      kn: 'ಮೆಟ್ರಿಕ್ ನಂತರದ, ಪದವಿ ಅಥವಾ ವೃತ್ತಿಪರ ವ್ಯಾಸಂಗ ಮಾಡುವ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಸಮಗ್ರ ಬೆಂಬಲ ಯೋಜನೆಗಳು.',
      hi: 'मैट्रिक के बाद, डिग्री या व्यावसायिक पढ़ाई करने वाले छात्रों के लिए व्यापक सहायता योजनाएं।',
    },
    serviceBundles: [
      {
        serviceId: 'e0000000-0000-0000-0000-000000000001',
        slug: 'post-matric-scholarship',
        title: 'Post-Matric Scholarship (SSP Karnataka)',
        category: 'SCHOLARSHIP',
        importance: 'CRITICAL',
        typicalTimeline: 'Apply before 31 December each academic year',
        requiredDocuments: [
          'Aadhaar Card',
          'Income & Caste Certificate (RD Number)',
          'College Admission Receipt & Fee Details',
          'Marks Card of Qualifying Examination',
        ],
      },
      {
        serviceId: 'e0000000-0000-0000-0000-000000000004',
        slug: 'karnataka-student-bus-pass',
        title: 'KSRTC / BMTC Student Concessional Bus Pass',
        category: 'CONCESSION',
        importance: 'RECOMMENDED',
        typicalTimeline: 'Within 30 days of college commencement',
        requiredDocuments: ['College Fee Receipt', 'Student ID Card', 'Passport Photo'],
      },
    ],
  },
  {
    id: 'le000000-0000-0000-0000-000000000002',
    key: 'CHILDBIRTH_MATERNITY',
    order: 2,
    icon: 'HeartIcon',
    title: {
      en: 'Maternity Support & Child Healthcare',
      kn: 'ಹೆರಿಗೆ ನೆರವು ಮತ್ತು ಮಕ್ಕಳ ಆರೋಗ್ಯ ರಕ್ಷಣೆ',
      hi: 'मातृत्व सहायता और बाल स्वास्थ्य देखभाल',
    },
    description: {
      en: 'Essential nutritional, financial, and healthcare assistance for pregnant mothers and newborns.',
      kn: 'ಗರ್ಭಿಣಿಯರು ಮತ್ತು ನವಜಾತ ಶಿಶುಗಳಿಗೆ ಅಗತ್ಯ ಪೌಷ್ಟಿಕ, ಆರ್ಥಿಕ ಮತ್ತು ಆರೋಗ್ಯ ನೆರವು.',
      hi: 'गर्भवती माताओं और नवजात शिशुओं के लिए आवश्यक पोषण, वित्तीय और स्वास्थ्य सहायता।',
    },
    serviceBundles: [
      {
        serviceId: 'e0000000-0000-0000-0000-000000000005',
        slug: 'mathru-poorna-yojana',
        title: 'Mathru Poorna Nutritional Assistance',
        category: 'HEALTHCARE',
        importance: 'CRITICAL',
        typicalTimeline: 'Register at nearest Anganwadi during 1st trimester',
        requiredDocuments: ['Mother & Child Protection (MCP) Card', 'Aadhaar Card'],
      },
      {
        serviceId: 'e0000000-0000-0000-0000-000000000006',
        slug: 'birth-certificate-registration',
        title: 'Birth Certificate Registration (e-JanMa)',
        category: 'CERTIFICATE',
        importance: 'CRITICAL',
        typicalTimeline: 'Within 21 days of birth',
        requiredDocuments: ['Hospital Discharge Summary / Form 1', 'Parents Identification'],
      },
    ],
  },
  {
    id: 'le000000-0000-0000-0000-000000000003',
    key: 'EMPLOYMENT_LIVELIHOOD',
    order: 3,
    icon: 'BriefcaseIcon',
    title: {
      en: 'Youth Employment & Livelihood Support',
      kn: 'ಯುವ ಉದ್ಯೋಗ ಮತ್ತು ಜೀವನೋಪಾಯ ಬೆಂಬಲ',
      hi: 'युवा रोजगार और आजीविका सहायता',
    },
    description: {
      en: 'Financial stipends, subsidized loans, and vocational training for unemployed graduates and artisans.',
      kn: 'ನಿರುದ್ಯೋಗಿ ಪದವೀಧರರು ಮತ್ತು ಕುಶಲಕರ್ಮಿಗಳಿಗೆ ಆರ್ಥಿಕ ಭತ್ಯೆ, ರಿಯಾಯಿತಿ ಸಾಲಗಳು ಮತ್ತು ತರಬೇತಿ.',
      hi: 'बेरोजगार स्नातकों और कारीगरों के लिए वित्तीय भत्ता, रियायती ऋण और व्यावसायिक प्रशिक्षण।',
    },
    serviceBundles: [
      {
        serviceId: 'e0000000-0000-0000-0000-000000000007',
        slug: 'yuva-nidhi-scheme',
        title: 'Yuva Nidhi Unemployment Allowance',
        category: 'LIVELIHOOD',
        importance: 'CRITICAL',
        typicalTimeline: 'Apply 180 days post graduation completion',
        requiredDocuments: [
          'Degree / Diploma Certificate',
          'Karnataka Domicile Proof',
          'Aadhaar-Seeded Bank Account',
        ],
      },
    ],
  },
  {
    id: 'le000000-0000-0000-0000-000000000004',
    key: 'SENIOR_RETIREMENT',
    order: 4,
    icon: 'ShieldCheckIcon',
    title: {
      en: 'Senior Citizen Welfare & Pension Security',
      kn: 'ಹಿರಿಯ ನಾಗರಿಕರ ಕಲ್ಯಾಣ ಮತ್ತು ಪಿಂಚಣಿ ಭದ್ರತೆ',
      hi: 'वरिष्ठ नागरिक कल्याण और पेंशन सुरक्षा',
    },
    description: {
      en: 'Identity verification, social security pensions, and health insurance for citizens aged 60+.',
      kn: '60 ವರ್ಷ ದಾಟಿದ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಗುರುತಿನ ಚೀಟಿ, ಸಾಮಾಜಿಕ ಭದ್ರತಾ ಪಿಂಚಣಿ ಮತ್ತು ಆರೋಗ್ಯ ರಕ್ಷಣೆ.',
      hi: '60 वर्ष से अधिक आयु के नागरिकों के लिए पहचान पत्र, सामाजिक सुरक्षा पेंशन और स्वास्थ्य सुरक्षा।',
    },
    serviceBundles: [
      {
        serviceId: 'e0000000-0000-0000-0000-000000000002',
        slug: 'synthetic-senior-citizen-card',
        title: 'Senior Citizen Identity Card (Karnataka)',
        category: 'CERTIFICATE',
        importance: 'RECOMMENDED',
        typicalTimeline: 'Anytime upon reaching age 60',
        requiredDocuments: [
          'Age Proof (Voter ID / School Certificate)',
          'Residence Proof',
          'Photos',
        ],
      },
      {
        serviceId: 'e0000000-0000-0000-0000-000000000008',
        slug: 'sandhya-suraksha-pension',
        title: 'Sandhya Suraksha Pension Yojana',
        category: 'PENSION',
        importance: 'CRITICAL',
        typicalTimeline: 'Requires annual life certificate (Jeevan Pramaan) renewal in November',
        requiredDocuments: [
          'Income Certificate (< ₹32,000/yr)',
          'Age Proof (65+ years)',
          'Bank Passbook',
        ],
      },
    ],
  },
  {
    id: 'le000000-0000-0000-0000-000000000005',
    key: 'BEREAVEMENT_SURVIVOR',
    order: 5,
    icon: 'DocumentTextIcon',
    title: {
      en: 'Survivor Benefits & Family Continuity',
      kn: 'ಕುಟುಂಬ ರಕ್ಷಣೆ ಮತ್ತು ಬದುಕುಳಿದವರ ಸೌಲಭ್ಯಗಳು',
      hi: 'उत्तरजीवी लाभ और पारिवारिक निरंतरता',
    },
    description: {
      en: 'Step-by-step guidance for legal heir certificates, survivor benefits, and emergency relief after a family loss.',
      kn: 'ಕುಟುಂಬದಲ್ಲಿ ಸಾವಿನ ನಂತರ ಕಾನೂನುಬದ್ಧ ವಾರಸುದಾರರ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಬದುಕುಳಿದವರ ಪರಿಹಾರ ಮಾರ್ಗದರ್ಶಿ.',
      hi: 'परिवार में क्षति के बाद कानूनी उत्तराधिकारी प्रमाण पत्र, उत्तरजीवी लाभ और आपातकालीन राहत।',
    },
    serviceBundles: [
      {
        serviceId: 'e0000000-0000-0000-0000-000000000009',
        slug: 'surviving-family-member-certificate',
        title: 'Surviving Family Member Certificate (Family Tree)',
        category: 'CERTIFICATE',
        importance: 'CRITICAL',
        typicalTimeline: 'Within 30–60 days of death event',
        requiredDocuments: ['Death Certificate', 'Ration Card', 'Self-Declaration Affidavit'],
      },
    ],
  },
];

export function listLifeEvents(): LifeEventRecord[] {
  return CURATED_LIFE_EVENTS.sort((a, b) => a.order - b.order);
}

export function getLifeEventByKey(key: LifeEventKey): LifeEventRecord | null {
  return CURATED_LIFE_EVENTS.find((e) => e.key === key) ?? null;
}
