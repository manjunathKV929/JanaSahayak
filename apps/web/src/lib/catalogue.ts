import type {
  CatalogueCategory,
  PublicServiceDetail,
  PublicServiceSummary,
} from '@janasahayak/types';

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

export async function fetchPublishedServiceBySlug(
  slug: string,
): Promise<PublicServiceDetail | null> {
  const match = SYNTHETIC_SAMPLE_SERVICES.find((s) => s.service.slug === slug);
  return match ?? null;
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
