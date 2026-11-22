import type {
  AIAssistResult,
  CatalogueCategory,
  DocumentGuideDetail,
  PublicServiceDetail,
  PublicServiceSummary,
  SearchInterpretationResult,
  SupportedLanguage,
  UserJourneyDetail,
} from '@janasahayak/types';
import { RAGService } from '@janasahayak/ai';

export const SYNTHETIC_SAMPLE_SERVICES: PublicServiceDetail[] = [
  {
    service: {
      id: '11111111-1111-1111-1111-111111111111',
      slug: 'synthetic-post-matric-scholarship',
      serviceType: 'SCHEME',
      title: '[Synthetic Sample] Post-Matric Scholarship Scheme (Karnataka)',
      shortDescription:
        'Financial assistance for eligible post-matriculation students pursuing recognized higher education in Karnataka.',
      departmentName: 'Social Welfare Department',
      stateCode: 'KA',
      status: 'PUBLISHED',
      currentVersionId: '33333333-3333-3333-3333-333333333333',
      createdAt: '2026-11-10T00:00:00.000Z',
      updatedAt: '2026-11-17T00:00:00.000Z',
    },
    version: {
      id: '33333333-3333-3333-3333-333333333333',
      serviceId: '11111111-1111-1111-1111-111111111111',
      versionNumber: 1,
      content: {
        overview:
          'Provides financial assistance including course fee reimbursement and monthly maintenance allowances to students admitted into post-secondary courses.',
        benefits:
          '100% tuition and laboratory fee reimbursement directly deposited to accredited college bank accounts, plus monthly living allowance.',
        authorityContact: 'State Scholarship Portal Helpline: 080-35254757',
      },
      language: 'en',
      effectiveFrom: '2026-04-01',
      effectiveTo: null,
      createdBy: '44444444-4444-4444-4444-444444444444',
      approvedBy: '55555555-5555-5555-5555-555555555555',
      createdAt: '2026-11-15T00:00:00.000Z',
    },
    sources: [
      {
        id: '66666666-6666-6666-6666-666666666666',
        serviceId: '11111111-1111-1111-1111-111111111111',
        sourceUrl: 'https://ssp.postmatric.karnataka.gov.in',
        sourceType: 'OFFICIAL_PORTAL',
        publisher: 'Center for e-Governance, Government of Karnataka',
        verificationStatus: 'VERIFIED',
        lastVerifiedAt: '2026-11-17T00:00:00.000Z',
        retrievedAt: '2026-11-17T00:00:00.000Z',
      },
    ],
    documents: [
      {
        id: 'doc-income',
        name: 'Income Certificate (RD Number)',
        description: 'Valid income certificate issued by the Revenue Department (Nadakacheri).',
        documentType: 'CERTIFICATE',
        issuerId: 'iss-nadakacheri',
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
      {
        id: 'doc-caste',
        name: 'Caste / Category Certificate',
        description: 'Official community certificate issued by Revenue Department.',
        documentType: 'CERTIFICATE',
        issuerId: 'iss-nadakacheri',
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
      {
        id: 'doc-marks',
        name: 'Previous Year Academic Marks Card',
        description: 'Marks card e-attested by college nodal officer.',
        documentType: 'ACADEMIC_RECORD',
        issuerId: null,
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
      {
        id: 'doc-bank',
        name: 'Aadhaar-Seeded Bank Account Passbook',
        description: 'Active savings account with NPCI Aadhaar seeding verification.',
        documentType: 'FINANCIAL_RECORD',
        issuerId: null,
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
    ],
    rules: [
      {
        id: 'rule-domicile',
        serviceId: '11111111-1111-1111-1111-111111111111',
        name: 'Karnataka Domicile',
        ruleExpression: { field: 'state', operator: '==', value: 'KA' },
        explanation: {
          en: 'Candidate must be a resident of Karnataka.',
          kn: 'ಅಭ್ಯರ್ಥಿಯು ಕರ್ನಾಟಕದ ನಿವಾಸಿಯಾಗಿರಬೇಕು.',
        },
        priority: 1,
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
      {
        id: 'rule-income',
        serviceId: '11111111-1111-1111-1111-111111111111',
        name: 'Annual Family Income Limit',
        ruleExpression: { field: 'annualIncome', operator: '<=', value: 250000 },
        explanation: {
          en: 'Total family income from all sources must not exceed ₹2,50,000 per annum.',
          kn: 'ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ ರೂ. ೨,೫೦,೦೦೦ ಮೀರಬಾರದು.',
        },
        priority: 2,
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
    ],
    journey: {
      id: 'journey-ssp',
      serviceId: '11111111-1111-1111-1111-111111111111',
      title: 'Post-Matric Scholarship Journey',
      description:
        '3 guided steps to complete your scholarship application on the official portal.',
      version: 1,
      createdAt: '2026-11-10T00:00:00.000Z',
      updatedAt: '2026-11-10T00:00:00.000Z',
      steps: [
        {
          id: 'step-1',
          journeyId: 'journey-ssp',
          stepKey: 'e-attestation',
          title: 'Complete Document e-Attestation',
          description: {
            en: 'Upload your 10th/PUC marks card and certificates on the e-Attestation portal so your college nodal officer can digitally attest them.',
          },
          stepType: 'DOCUMENT_CHECK',
          displayOrder: 1,
          officialUrl: 'https://eattestation.karnataka.gov.in',
          completionRule: null,
        },
        {
          id: 'step-2',
          journeyId: 'journey-ssp',
          stepKey: 'ssp-account-create',
          title: 'Register or Log in on State Scholarship Portal',
          description: {
            en: 'Create a student login account using your Aadhaar number and registered mobile number on the SSP portal.',
          },
          stepType: 'ACCOUNT_CREATION',
          displayOrder: 2,
          officialUrl: 'https://ssp.postmatric.karnataka.gov.in',
          completionRule: null,
        },
        {
          id: 'step-3',
          journeyId: 'journey-ssp',
          stepKey: 'submit-application',
          title: 'Fill Application & Submit to College',
          description: {
            en: 'Enter your RD certificate numbers, link college admission details, and submit online. Print acknowledgment for your college records.',
          },
          stepType: 'OFFICIAL_SUBMIT',
          displayOrder: 3,
          officialUrl: 'https://ssp.postmatric.karnataka.gov.in',
          completionRule: null,
        },
      ],
    },
    deadlines: [
      {
        id: 'dl-ssp-2026',
        serviceId: '11111111-1111-1111-1111-111111111111',
        name: 'Academic Year 2026-27 Application Window',
        opensAt: '2026-06-01T00:00:00.000Z',
        closesAt: '2026-11-30T23:59:59.000Z',
        sourceId: '66666666-6666-6666-6666-666666666666',
        status: 'UPCOMING_DEADLINE',
      },
    ],
  },
  {
    service: {
      id: '22222222-2222-2222-2222-222222222222',
      slug: 'synthetic-senior-citizen-card',
      serviceType: 'CERTIFICATE',
      title: '[Synthetic Sample] Senior Citizen Identity Card (Karnataka)',
      shortDescription:
        'Official identity certificate and card for citizens aged 60 and above residing in Karnataka, facilitating public transport and healthcare benefits.',
      departmentName: 'Directorate for the Empowerment of Differently Abled and Senior Citizens',
      stateCode: 'KA',
      status: 'PUBLISHED',
      currentVersionId: '77777777-7777-7777-7777-777777777777',
      createdAt: '2026-11-10T00:00:00.000Z',
      updatedAt: '2026-11-17T00:00:00.000Z',
    },
    version: {
      id: '77777777-7777-7777-7777-777777777777',
      serviceId: '22222222-2222-2222-2222-222222222222',
      versionNumber: 1,
      content: {
        overview:
          'Enables senior citizens to easily establish age and address for government concessions, reserved seating, KSRTC bus concessions, and medical priority.',
        benefits:
          'Official government photo ID proving senior citizen status across state government departments and local bodies.',
        authorityContact: 'Elderline National Helpline: 14567',
      },
      language: 'en',
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      createdBy: '44444444-4444-4444-4444-444444444444',
      approvedBy: '55555555-5555-5555-5555-555555555555',
      createdAt: '2026-11-15T00:00:00.000Z',
    },
    sources: [
      {
        id: '88888888-8888-8888-8888-888888888888',
        serviceId: '22222222-2222-2222-2222-222222222222',
        sourceUrl: 'https://nadakacheri.karnataka.gov.in',
        sourceType: 'OFFICIAL_PORTAL',
        publisher: 'Directorate of Electronic Delivery of Citizen Services (EDCS)',
        verificationStatus: 'VERIFIED',
        lastVerifiedAt: '2026-11-17T00:00:00.000Z',
        retrievedAt: '2026-11-17T00:00:00.000Z',
      },
    ],
    documents: [
      {
        id: 'doc-age',
        name: 'Age Proof (Birth Certificate / Voter ID / Passport)',
        description: 'Document showing age of 60 years or above.',
        documentType: 'IDENTITY_RECORD',
        issuerId: null,
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
      {
        id: 'doc-residence',
        name: 'Residence Proof of Karnataka',
        description: 'Electricity bill, water bill, or ration card confirming Karnataka address.',
        documentType: 'ADDRESS_RECORD',
        issuerId: null,
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
      {
        id: 'doc-photo',
        name: 'Two Passport Sized Photographs',
        description: 'Recent colour photographs with clear facial view.',
        documentType: 'PHOTOGRAPH',
        issuerId: null,
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
    ],
    rules: [
      {
        id: 'rule-age-60',
        serviceId: '22222222-2222-2222-2222-222222222222',
        name: 'Minimum Age 60 Years',
        ruleExpression: { field: 'age', operator: '>=', value: 60 },
        explanation: {
          en: 'Citizen must be at least 60 years of age on date of application.',
          kn: 'ಅರ್ಜಿದಾರರು ಕನಿಷ್ಠ ೬೦ ವರ್ಷ ವಯಸ್ಸಿನವರಾಗಿರಬೇಕು.',
        },
        priority: 1,
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
    ],
    journey: {
      id: 'journey-senior',
      serviceId: '22222222-2222-2222-2222-222222222222',
      title: 'Senior Citizen Card Journey',
      description: 'Step-by-step guidance to apply on Nadakacheri portal or Seva Sindhu Kendra.',
      version: 1,
      createdAt: '2026-11-10T00:00:00.000Z',
      updatedAt: '2026-11-10T00:00:00.000Z',
      steps: [
        {
          id: 'step-sc-1',
          journeyId: 'journey-senior',
          stepKey: 'gather-proofs',
          title: 'Prepare Age Proof & Blood Group Report',
          description: {
            en: 'Collect your age proof (Voter ID or school certificate) and optional doctor blood group certificate.',
          },
          stepType: 'DOCUMENT_CHECK',
          displayOrder: 1,
          officialUrl: null,
          completionRule: null,
        },
        {
          id: 'step-sc-2',
          journeyId: 'journey-senior',
          stepKey: 'nadakacheri-apply',
          title: 'Apply Online via Nadakacheri or Bangalore One',
          description: {
            en: 'Submit online at nadakacheri.karnataka.gov.in under Senior Citizen Card or visit the nearest Bangalore One / Grama One center.',
          },
          stepType: 'OFFICIAL_SUBMIT',
          displayOrder: 2,
          officialUrl: 'https://nadakacheri.karnataka.gov.in',
          completionRule: null,
        },
        {
          id: 'step-sc-3',
          journeyId: 'journey-senior',
          stepKey: 'collect-card',
          title: 'Collect Issued Card',
          description: {
            en: 'Upon revenue verification (usually 7 to 15 days), download the digitally signed certificate or collect laminated card from center.',
          },
          stepType: 'STATUS_TRACK',
          displayOrder: 3,
          officialUrl: 'https://nadakacheri.karnataka.gov.in',
          completionRule: null,
        },
      ],
    },
    deadlines: [],
  },
];

export async function fetchPublishedServices(
  options: {
    q?: string | undefined;
    category?: string | undefined;
    state?: string | undefined;
  } = {},
): Promise<PublicServiceSummary[]> {
  let list = SYNTHETIC_SAMPLE_SERVICES.map((s) => ({
    id: s.service.id,
    slug: s.service.slug,
    serviceType: s.service.serviceType,
    title: s.service.title,
    shortDescription: s.service.shortDescription,
    departmentName: s.service.departmentName,
    stateCode: s.service.stateCode,
    verification: {
      status: s.sources[0]?.verificationStatus ?? 'UNVERIFIED',
      lastVerifiedAt: s.sources[0]?.lastVerifiedAt ?? s.service.updatedAt,
    },
  }));

  if (options.q && options.q.trim().length > 0) {
    const term = options.q.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.shortDescription.toLowerCase().includes(term) ||
        s.departmentName.toLowerCase().includes(term),
    );
  }

  if (options.category && options.category.trim().length > 0) {
    const cat = options.category.toUpperCase().trim();
    list = list.filter((s) => s.serviceType.toUpperCase() === cat);
  }

  if (options.state && options.state.trim().length > 0) {
    const st = options.state.toUpperCase().trim();
    list = list.filter((s) => s.stateCode === st || s.stateCode === null);
  }

  return list;
}

export const SYNTHETIC_LOCALIZED_VERSIONS: Record<
  string,
  Record<string, Record<string, unknown>>
> = {
  'synthetic-post-matric-scholarship': {
    kn: {
      title: '[ಮಾದರಿ] ಮೆಟ್ರಿಕ್-ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಯೋಜನೆ (ಕರ್ನಾಟಕ)',
      department: 'ಸಮಾಜ ಕಲ್ಯಾಣ ಇಲಾಖೆ',
      overview:
        'ಕರ್ನಾಟಕದಲ್ಲಿ ಮಾನ್ಯತೆ ಪಡೆದ ಕೋರ್ಸ್‌ಗಳಲ್ಲಿ ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿರುವ ಅರ್ಹ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಶೈಕ್ಷಣಿಕ ಶುಲ್ಕ ಮತ್ತು ನಿರ್ವಹಣಾ ಭತ್ಯೆಗಾಗಿ ಆರ್ಥಿಕ ನೆರವು.',
      benefits:
        'ಕೋರ್ಸ್ ಶುಲ್ಕ ಮರುಪಾವತಿ ಮತ್ತು ಮಾಸಿಕ ನಿರ್ವಹಣಾ ಭತ್ಯೆಯನ್ನು ನೇರ ನಗದು ವರ್ಗಾವಣೆ (DBT) ಮೂಲಕ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮಾ ಮಾಡಲಾಗುತ್ತದೆ.',
      eligibilitySummary:
        'ಕರ್ನಾಟಕದ ಖಾಯಂ ನಿವಾಸಿಯಾಗಿರಬೇಕು. ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ ₹2,50,000 ಕ್ಕಿಂತ ಕಡಿಮೆ ಇರಬೇಕು. ಹಿಂದಿನ ಪರೀಕ್ಷೆಯಲ್ಲಿ ಕನಿಷ್ಠ 50% ಅಂಕಗಳನ್ನು ಪಡೆದಿರಬೇಕು.',
      applicationProcess:
        '1. ರಾಜ್ಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ (SSP) ನಲ್ಲಿ ಖಾತೆ ತೆರೆಯಿರಿ. 2. ಆದಾಯ ಮತ್ತು ಜಾತಿ ಪ್ರಮಾಣಪತ್ರಗಳ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ. 3. ಕಾಲೇಜು ಪ್ರವೇಶ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.',
    },
    hi: {
      title: '[सिंथेटिक नमूना] पोस्ट-मैट्रिक छात्रवृत्ति योजना (कर्नाटक)',
      department: 'समाज कल्याण विभाग',
      overview:
        'कर्नाटक में मान्यता प्राप्त पाठ्यक्रमों में उच्च शिक्षा प्राप्त कर रहे पात्र छात्रों के लिए वित्तीय सहायता।',
      benefits:
        'शिक्षण शुल्क प्रतिपूर्ति और मासिक रखरखाव भत्ता सीधे बैंक खाते में प्रत्यक्ष लाभ अंतरण (DBT) के माध्यम से।',
      eligibilitySummary:
        'कर्नाटक का स्थायी निवासी होना अनिवार्य है। वार्षिक पारिवारिक आय ₹2,50,000 से कम होनी चाहिए। पिछली परीक्षा में न्यूनतम 50% अंक अनिवार्य हैं।',
      applicationProcess:
        '1. राज्य छात्रवृत्ति पोर्टल (SSP) पर पंजीकरण करें। 2. आय एवं जाति प्रमाण पत्र संख्या सत्यापित करें। 3. कॉलेज प्रवेश विवरण दर्ज कर ऑनलाइन आवेदन जमा करें।',
    },
  },
  'synthetic-senior-citizen-card': {
    kn: {
      title: '[ಮಾದರಿ] ಹಿರಿಯ ನಾಗರಿಕರ ಗುರುತಿನ ಚೀಟಿ (ಕರ್ನಾಟಕ)',
      department: 'ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಅಭಿವೃದ್ಧಿ ಹಾಗೂ ಹಿರಿಯ ನಾಗರಿಕರ ಸಬಲೀಕರಣ ಇಲಾಖೆ',
      overview:
        'ಕರ್ನಾಟಕದಲ್ಲಿ ವಾಸಿಸುವ 60 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ವಯಸ್ಸಿನ ನಾಗರಿಕರಿಗೆ ಅಧಿಕೃತ ಗುರುತಿನ ಚೀಟಿ ಮತ್ತು ಸೌಲಭ್ಯಗಳು.',
      benefits:
        'ಕೆಎಸ್‌ಆರ್‌ಟಿಸಿ ಬಸ್ ಪ್ರಯಾಣದಲ್ಲಿ ರಿಯಾಯಿತಿ, ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ಆದ್ಯತೆಯ ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಸಾಮಾಜಿಕ ಭದ್ರತಾ ಯೋಜನೆಗಳು.',
      eligibilitySummary:
        'ಅರ್ಜಿದಾರರ ವಯಸ್ಸು 60 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಾಗಿರಬೇಕು ಮತ್ತು ಕರ್ನಾಟಕದ ಖಾಯಂ ನಿವಾಸಿಯಾಗಿರಬೇಕು.',
      applicationProcess:
        '1. ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್ ಅಥವಾ ಗ್ರಾಮ ಒನ್ ಕೇಂದ್ರದಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ. 2. ವಯಸ್ಸಿನ ಪುರಾವೆ ಮತ್ತು ವಿಳಾಸದ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. 3. ಪರಿಶೀಲನೆಯ ನಂತರ ಡಿಜಿಟಲ್ ಕಾರ್ಡ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.',
    },
    hi: {
      title: '[सिंथेटिक नमूना] वरिष्ठ नागरिक पहचान पत्र (कर्नाटक)',
      department: 'महिला एवं बाल विकास तथा वरिष्ठ नागरिक अधिकारिता विभाग',
      overview:
        'कर्नाटक में रहने वाले 60 वर्ष या उससे अधिक आयु के वरिष्ठ नागरिकों के लिए आधिकारिक पहचान पत्र एवं सुविधाएं।',
      benefits:
        'केएसआरटीसी बसों में रियायती यात्रा, सरकारी अस्पतालों में प्राथमिकता उपचार और सामाजिक सुरक्षा योजनाएं।',
      eligibilitySummary:
        'आवेदक की आयु 60 वर्ष या उससे अधिक होनी चाहिए और कर्नाटक का स्थायी निवासी होना चाहिए।',
      applicationProcess:
        '1. सेवा सिंधु पोर्टल या ग्राम वन केंद्र पर आवेदन करें। 2. आयु और पते का प्रमाण अपलोड करें। 3. सत्यापन के बाद डिजिटल कार्ड डाउनलोड करें।',
    },
  },
};

export async function fetchPublishedServiceBySlug(
  slug: string,
  language?: string,
): Promise<PublicServiceDetail | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';

  try {
    const url = language
      ? `${apiBase}/services/${encodeURIComponent(slug)}?language=${encodeURIComponent(language)}`
      : `${apiBase}/services/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch {
    // API not reachable, fall back to synthetic mock
  }

  const match = SYNTHETIC_SAMPLE_SERVICES.find((s) => s.service.slug === slug);
  if (!match) return null;

  if (language && language !== 'en') {
    const localized = SYNTHETIC_LOCALIZED_VERSIONS[slug]?.[language];
    if (localized) {
      return {
        ...match,
        version: {
          ...match.version!,
          language: language as import('@janasahayak/types').SupportedLanguage,
          content: localized,
        },
      };
    }
  }

  return match;
}

export async function fetchCategories(): Promise<CatalogueCategory[]> {
  const counts: Record<string, number> = {};
  for (const item of SYNTHETIC_SAMPLE_SERVICES) {
    counts[item.service.serviceType] = (counts[item.service.serviceType] ?? 0) + 1;
  }
  return Object.entries(counts).map(([category, count]) => ({ category, count }));
}

export const SYNTHETIC_ELIGIBILITY_QUESTIONS: Record<
  string,
  Array<{
    id: string;
    key: string;
    questionText: Record<string, string>;
    answerType: 'text' | 'number' | 'boolean' | 'single_choice' | 'multi_choice';
    required: boolean;
    options?: Array<{
      id: string;
      key: string;
      label: Record<string, string>;
    }>;
  }>
> = {
  'synthetic-post-matric-scholarship': [
    {
      id: 'q-ssp-domicile',
      key: 'state',
      questionText: {
        en: 'Are you a permanent resident of Karnataka?',
        kn: 'ನೀವು ಕರ್ನಾಟಕದ ಖಾಯಂ ನಿವಾಸಿಯೇ?',
      },
      answerType: 'single_choice',
      required: true,
      options: [
        {
          id: 'opt-ka',
          key: 'KA',
          label: {
            en: 'Yes, resident of Karnataka',
            kn: 'ಹೌದು, ಕರ್ನಾಟಕದ ನಿವಾಸಿ',
          },
        },
        {
          id: 'opt-other',
          key: 'OTHER',
          label: {
            en: 'No, other state',
            kn: 'ಇಲ್ಲ, ಬೇರೆ ರಾಜ್ಯ',
          },
        },
      ],
    },
    {
      id: 'q-ssp-income',
      key: 'annualIncome',
      questionText: {
        en: 'What is your annual family income from all sources in Rupees (₹)?',
        kn: 'ನಿಮ್ಮ ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ ಎಷ್ಟು (ರೂ.)?',
      },
      answerType: 'number',
      required: true,
    },
  ],
  'synthetic-senior-citizen-card': [
    {
      id: 'q-senior-age',
      key: 'age',
      questionText: {
        en: 'What is your current age in completed years?',
        kn: 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವಯಸ್ಸು ಎಷ್ಟು?',
      },
      answerType: 'number',
      required: true,
    },
  ],
};

export async function fetchEligibilityQuestions(slugOrId: string) {
  const questions = SYNTHETIC_ELIGIBILITY_QUESTIONS[slugOrId];
  return questions ?? [];
}

export const SYNTHETIC_DOCUMENT_GUIDES: Record<string, DocumentGuideDetail> = {
  'doc-income': {
    id: 'doc-income',
    name: 'Income Certificate (Form F / RD)',
    description: 'Official revenue certificate proving gross annual household income.',
    documentType: 'CERTIFICATE',
    issuerId: 'iss-nadakacheri',
    createdAt: '2026-11-10T00:00:00.000Z',
    updatedAt: '2026-11-10T00:00:00.000Z',
    issuer: {
      id: 'iss-nadakacheri',
      name: 'Nadakacheri (Revenue Department, Karnataka)',
      issuerType: 'STATE_DEPARTMENT',
      portalUrl: 'https://nadakacheri.karnataka.gov.in',
      createdAt: '2026-11-10T00:00:00.000Z',
    },
    guide: {
      purpose: {
        en: 'Proves family gross annual income to verify eligibility for scholarships and fee concessions in Karnataka.',
        kn: 'ಕರ್ನಾಟಕದಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿವೇತನ ಮತ್ತು ಶುಲ್ಕ ರಿಯಾಯಿತಿಗಳಿಗೆ ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯವನ್ನು ಸಾಬೀತುಪಡಿಸಲು ಅಗತ್ಯವಿದೆ.',
      },
      prerequisites: [
        {
          name: 'Ration Card (BPL/APL)',
          description: { en: 'For family verification and address confirmation.' },
        },
        { name: 'Aadhaar Card', description: { en: 'For biometric / OTP authentication.' } },
        {
          name: 'Self-declaration of income',
          description: { en: 'Salary slip, Form 16, or signed declaration.' },
        },
      ],
      issuingAuthority: {
        name: 'Nadakacheri (Atalji Janasnehi Kendra)',
        department: 'Revenue Department, Government of Karnataka',
        portalUrl: 'https://nadakacheri.karnataka.gov.in',
        physicalOffices: 'Nadakacheri, Bangalore One, Karnataka One, Grama One centres',
        helpline: '080-22370281',
      },
      processingTimeDays: 14,
      fees: {
        en: '₹25 user charge at citizen service counters; ₹0 on official portal self-service.',
        kn: 'ಸಹಾಯ ಕೇಂದ್ರಗಳಲ್ಲಿ ₹೨೫ ಶುಲ್ಕ; ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಉಚಿತ.',
      },
      validityPeriod: {
        en: 'Valid for 5 years from date of issue in Karnataka.',
        kn: 'ನೀಡಿದ ದಿನಾಂಕದಿಂದ ೫ ವರ್ಷಗಳವರೆಗೆ ಮಾನ್ಯವಾಗಿರುತ್ತದೆ.',
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Prepare Aadhaar and Ration Card',
          description: {
            en: 'Keep your 12-digit Aadhaar number and active Ration Card number ready.',
          },
        },
        {
          stepNumber: 2,
          title: 'Submit Application Online or at Citizen Centre',
          description: {
            en: 'Apply online on Nadakacheri portal or visit nearest Grama One / Bangalore One counter.',
          },
          officialUrl: 'https://nadakacheri.karnataka.gov.in',
        },
        {
          stepNumber: 3,
          title: 'Track and Download with RD Number',
          description: {
            en: 'Once verified by Revenue Inspector, download your digitally signed certificate.',
          },
          officialUrl: 'https://nadakacheri.karnataka.gov.in',
        },
      ],
      alternativeDocuments: [
        'Income statement issued by Gazetted Officer (where specifically permitted)',
      ],
    },
    document: {
      id: 'doc-income',
      name: 'Income Certificate (Form F / RD)',
      description: 'Official revenue certificate proving gross annual household income.',
      documentType: 'CERTIFICATE',
      issuerId: 'iss-nadakacheri',
      createdAt: '2026-11-10T00:00:00.000Z',
      updatedAt: '2026-11-10T00:00:00.000Z',
    },
  },
  'doc-caste': {
    id: 'doc-caste',
    name: 'Caste / Category Certificate',
    description: 'Official revenue certificate validating SC/ST/OBC category reservation.',
    documentType: 'CERTIFICATE',
    issuerId: 'iss-nadakacheri',
    createdAt: '2026-11-10T00:00:00.000Z',
    updatedAt: '2026-11-10T00:00:00.000Z',
    issuer: {
      id: 'iss-nadakacheri',
      name: 'Nadakacheri (Revenue Department, Karnataka)',
      issuerType: 'STATE_DEPARTMENT',
      portalUrl: 'https://nadakacheri.karnataka.gov.in',
      createdAt: '2026-11-10T00:00:00.000Z',
    },
    guide: {
      purpose: {
        en: 'Validates caste and category reservation status for admissions and government benefits.',
        kn: 'ಶಿಕ್ಷಣ ಮತ್ತು ಸರ್ಕಾರದ ಸವಲತ್ತುಗಳಿಗಾಗಿ ಜಾತಿ ಮತ್ತು ವರ್ಗ ಮೀಸಲಾತಿಯನ್ನು ದೃಢೀಕರಿಸುತ್ತದೆ.',
      },
      prerequisites: [
        { name: 'Aadhaar Card', description: { en: 'Applicant identification proof.' } },
        {
          name: 'School Leaving Certificate / TC',
          description: { en: 'Shows caste recorded in school records.' },
        },
      ],
      issuingAuthority: {
        name: 'Tahsildar / Nadakacheri',
        department: 'Revenue Department, Government of Karnataka',
        portalUrl: 'https://nadakacheri.karnataka.gov.in',
        physicalOffices: 'Taluk Office, Nadakacheri, Grama One',
        helpline: '080-22370281',
      },
      processingTimeDays: 21,
      fees: {
        en: '₹25 user charge at citizen service counters.',
        kn: 'ನಾಗರಿಕ ಸೇವಾ ಕೇಂದ್ರಗಳಲ್ಲಿ ₹೨೫ ಶುಲ್ಕ.',
      },
      validityPeriod: {
        en: 'SC/ST permanent; Category 1/2A/2B/3A/3B valid for 5 years.',
        kn: 'ಎಸ್‌ಸಿ/ಎಸ್‌ಟಿ ಶಾಶ್ವತ; ಇತರ ಪ್ರವರ್ಗಗಳು ೫ ವರ್ಷಗಳು.',
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Collect Family Caste Records',
          description: { en: 'Locate TC or family revenue records showing community affiliation.' },
        },
        {
          stepNumber: 2,
          title: 'Apply at Nadakacheri or Grama One',
          description: { en: 'Submit application on Nadakacheri portal or Grama One.' },
          officialUrl: 'https://nadakacheri.karnataka.gov.in',
        },
        {
          stepNumber: 3,
          title: 'Receive RD Number and Download',
          description: { en: 'Download your digital certificate once approved by Tahsildar.' },
        },
      ],
    },
    document: {
      id: 'doc-caste',
      name: 'Caste / Category Certificate',
      description: 'Official revenue certificate validating SC/ST/OBC category reservation.',
      documentType: 'CERTIFICATE',
      issuerId: 'iss-nadakacheri',
      createdAt: '2026-11-10T00:00:00.000Z',
      updatedAt: '2026-11-10T00:00:00.000Z',
    },
  },
  'doc-age': {
    id: 'doc-age',
    name: 'Age Proof (Birth Certificate / Voter ID / Passport)',
    description: 'Document verifying age of 60 years or above.',
    documentType: 'IDENTITY_RECORD',
    issuerId: null,
    createdAt: '2026-11-10T00:00:00.000Z',
    updatedAt: '2026-11-10T00:00:00.000Z',
    issuer: null,
    guide: {
      purpose: {
        en: 'Confirms completion of 60 years of age for senior citizen card and concessions.',
        kn: 'ಹಿರಿಯ ನಾಗರಿಕರ ಗುರುತಿನ ಚೀಟಿಗಾಗಿ ೬೦ ವರ್ಷ ವಯಸ್ಸು ಪೂರ್ಣಗೊಂಡಿರುವುದನ್ನು ದೃಢೀಕರಿಸುತ್ತದೆ.',
      },
      prerequisites: [
        {
          name: 'Existing Photo ID',
          description: { en: 'Voter ID, Passport, PAN Card, or Birth Certificate.' },
        },
        {
          name: 'Address Proof',
          description: { en: 'Ration card, Electricity bill, or Water bill.' },
        },
      ],
      issuingAuthority: {
        name: 'Election Commission of India / UIDAI',
        department: 'Statutory Issuing Authorities',
        portalUrl: 'https://voters.eci.gov.in',
        physicalOffices: 'Taluk Office, Citizen Service Counters',
        helpline: '1950',
      },
      processingTimeDays: 10,
      fees: {
        en: 'Statutory charges or free as per issuing department.',
        kn: 'ನಿಗದಿತ ಕನಿಷ್ಠ ಶುಲ್ಕ ಅಥವಾ ಉಚಿತ.',
      },
      validityPeriod: {
        en: 'Permanent official identity record.',
        kn: 'ಶಾಶ್ವತ ಅಧಿಕೃತ ಗುರುತಿನ ದಾಖಲೆ.',
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Select Valid Photo ID',
          description: {
            en: 'Choose an existing recognized government ID that shows your full date of birth.',
          },
        },
        {
          stepNumber: 2,
          title: 'Check Address Accuracy',
          description: {
            en: 'Ensure your current address matches before applying for state benefits.',
          },
        },
      ],
    },
    document: {
      id: 'doc-age',
      name: 'Age Proof (Birth Certificate / Voter ID / Passport)',
      description: 'Document verifying age of 60 years or above.',
      documentType: 'IDENTITY_RECORD',
      issuerId: null,
      createdAt: '2026-11-10T00:00:00.000Z',
      updatedAt: '2026-11-10T00:00:00.000Z',
    },
  },
};

export async function fetchDocumentById(idOrSlug: string): Promise<DocumentGuideDetail | null> {
  const guide = SYNTHETIC_DOCUMENT_GUIDES[idOrSlug];
  if (guide) return guide;

  // Match by id or substring match
  for (const item of Object.values(SYNTHETIC_DOCUMENT_GUIDES)) {
    if (
      item.id === idOrSlug ||
      item.name.toLowerCase().includes(idOrSlug.toLowerCase()) ||
      idOrSlug.toLowerCase().includes(item.id.toLowerCase())
    ) {
      return item;
    }
  }

  return null;
}

export async function fetchJourneyForService(
  serviceSlugOrId: string,
): Promise<UserJourneyDetail | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';

  // Try API first
  try {
    const res = await fetch(`${apiBase}/services/${encodeURIComponent(serviceSlugOrId)}/journeys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch {
    // API unavailable, fall through to synthetic mock
  }

  // Fallback to synthetic sample services
  const svc = SYNTHETIC_SAMPLE_SERVICES.find(
    (s) => s.service.slug === serviceSlugOrId || s.service.id === serviceSlugOrId,
  );
  if (!svc || !svc.journey) return null;

  const stepsWithProgress = svc.journey.steps.map((step, idx) => ({
    ...step,
    status: (idx === 0 ? 'IN_PROGRESS' : 'UPCOMING') as
      'COMPLETED' | 'IN_PROGRESS' | 'NEXT' | 'UPCOMING' | 'BLOCKED',
    completedAt: null,
    isNextStep: idx === 0,
    canComplete: idx === 0,
  }));

  const nextStep = stepsWithProgress[0] ?? null;

  return {
    id: `local-user-journey-${svc.service.slug}`,
    serviceId: svc.service.id,
    serviceSlug: svc.service.slug,
    serviceTitle: svc.service.title,
    journeyTemplateId: svc.journey.id,
    title: svc.journey.title,
    description: svc.journey.description,
    status: 'IN_PROGRESS',
    progress: {
      totalSteps: stepsWithProgress.length,
      completedSteps: 0,
      currentStepIndex: 0,
      percentage: 0,
      status: 'IN_PROGRESS',
      nextStep,
    },
    steps: stepsWithProgress,
    nextStep,
  };
}

export async function completeJourneyStep(
  journeyId: string,
  stepId: string,
  options?: {
    confirmation?: boolean;
    referenceNumber?: string;
    notes?: string;
  },
): Promise<UserJourneyDetail | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';

  try {
    const res = await fetch(
      `${apiBase}/journeys/${encodeURIComponent(journeyId)}/steps/${encodeURIComponent(stepId)}/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options ?? {}),
      },
    );
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    } else {
      const errJson = await res.json().catch(() => null);
      if (errJson?.error?.message) {
        throw new Error(errJson.error.message);
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message) {
      throw err;
    }
  }

  return null;
}

const clientSideRagService = new RAGService();

export async function interpretSearchQuery(
  query: string,
  language: SupportedLanguage = 'en',
): Promise<SearchInterpretationResult> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';

  try {
    const res = await fetch(`${apiBase}/search/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch {
    // API unavailable, fall through to client-side RAG service
  }

  return clientSideRagService.interpretSearch(query, language, SYNTHETIC_SAMPLE_SERVICES);
}

export async function askAIAssistant(
  message: string,
  options: {
    language?: SupportedLanguage;
    serviceSlug?: string;
    serviceId?: string;
  } = {},
): Promise<AIAssistResult> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
  const language = options.language ?? 'en';

  try {
    const res = await fetch(`${apiBase}/ai/assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        language,
        context: {
          serviceId: options.serviceId,
          serviceSlug: options.serviceSlug,
        },
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch {
    // API unavailable, fall through to client-side RAG service
  }

  let serviceDetail: PublicServiceDetail | null = null;
  if (options.serviceSlug || options.serviceId) {
    serviceDetail =
      SYNTHETIC_SAMPLE_SERVICES.find(
        (s) => s.service.slug === options.serviceSlug || s.service.id === options.serviceId,
      ) ?? null;
  }

  return clientSideRagService.assist({
    message,
    language,
    service: serviceDetail,
  });
}
