import type {
  FamilyMemberProfile,
  FamilyMemberScanResult,
  FamilyScanItemResult,
  FamilyScanResponse,
} from '@janasahayak/types';

export function scanFamilyEligibility(members: FamilyMemberProfile[]): FamilyScanResponse {
  const results: FamilyMemberScanResult[] = [];
  let totalEligibleFound = 0;

  for (const member of members) {
    const eligibleServices: FamilyScanItemResult[] = [];

    // 1. Post-Matric Scholarship (SSP) Check
    const isStudentAge = member.age >= 15 && member.age <= 30;
    const isStudentRole =
      /student/i.test(member.occupation) ||
      /puc|degree|diploma|college|post[- ]graduate/i.test(member.educationLevel);
    const hasIncomeCondition =
      member.annualIncome === null ||
      member.annualIncome === undefined ||
      member.annualIncome <= 250_000;

    if (isStudentAge && (isStudentRole || member.relationship === 'CHILD') && hasIncomeCondition) {
      eligibleServices.push({
        serviceId: 'e0000000-0000-0000-0000-000000000001',
        slug: 'post-matric-scholarship',
        title: 'Post-Matric Scholarship (SSP Karnataka)',
        category: 'SCHOLARSHIP',
        departmentName: 'Social Welfare Department',
        reason:
          'Eligible based on student age, education level, and annual family income within ₹2,50,000 threshold.',
        confidence: 'POTENTIALLY_ELIGIBLE',
      });
    }

    // 2. Senior Citizen Card Check
    if (member.age >= 60) {
      eligibleServices.push({
        serviceId: 'e0000000-0000-0000-0000-000000000002',
        slug: 'synthetic-senior-citizen-card',
        title: 'Senior Citizen Identity Card (Karnataka)',
        category: 'CERTIFICATE',
        departmentName: 'Directorate for Empowerment of Senior Citizens',
        reason: 'Qualifies directly based on age milestone of 60 years or above.',
        confidence: 'POTENTIALLY_ELIGIBLE',
      });
    }

    // 3. Sandhya Suraksha Pension Scheme
    if (member.age >= 65) {
      const qualifiesIncome =
        member.annualIncome === null ||
        member.annualIncome === undefined ||
        member.annualIncome <= 32_000;

      if (qualifiesIncome) {
        eligibleServices.push({
          serviceId: 'e0000000-0000-0000-0000-000000000008',
          slug: 'sandhya-suraksha-pension',
          title: 'Sandhya Suraksha Pension Yojana',
          category: 'PENSION',
          departmentName: 'Revenue Department',
          reason:
            'Senior citizen aged 65+ with verified annual income meeting standard welfare pension criteria.',
          confidence: 'POTENTIALLY_ELIGIBLE',
        });
      }
    }

    // 4. Women Head of Family Assistance (Gruha Lakshmi)
    const isAdultWoman = member.gender === 'FEMALE' && member.age >= 18;
    const isHeadOrSpouse =
      member.relationship === 'SELF' ||
      member.relationship === 'SPOUSE' ||
      member.relationship === 'PARENT';
    if (isAdultWoman && isHeadOrSpouse) {
      eligibleServices.push({
        serviceId: 'e0000000-0000-0000-0000-000000000003',
        slug: 'gruha-lakshmi-scheme',
        title: 'Gruha Lakshmi Financial Assistance',
        category: 'FINANCIAL_ASSISTANCE',
        departmentName: 'Department of Women & Child Development',
        reason:
          'Potential woman head of household eligible for monthly civic empowerment assistance.',
        confidence: 'CHECK_REQUIRED',
      });
    }

    // 5. Yuva Nidhi Unemployment Allowance
    const isYouthAge = member.age >= 21 && member.age <= 29;
    const isLookingForWork =
      /unemployed|graduate|diploma|fresher|seeking/i.test(member.occupation) ||
      /degree|diploma/i.test(member.educationLevel);
    if (isYouthAge && isLookingForWork) {
      eligibleServices.push({
        serviceId: 'e0000000-0000-0000-0000-000000000007',
        slug: 'yuva-nidhi-scheme',
        title: 'Yuva Nidhi Unemployment Allowance',
        category: 'LIVELIHOOD',
        departmentName: 'Department of Skill Development & Livelihood',
        reason:
          'Young graduate / diploma holder eligible for monthly livelihood stipend during employment transition.',
        confidence: 'POTENTIALLY_ELIGIBLE',
      });
    }

    totalEligibleFound += eligibleServices.length;

    results.push({
      memberId: member.id ?? `mem-${results.length + 1}`,
      memberName: member.name,
      relationship: member.relationship,
      eligibleServices,
    });
  }

  return {
    results,
    scannedCount: members.length,
    totalEligibleFound,
    privacyDisclaimer:
      'Zero-knowledge scan: No identity cards, phone numbers, or personal profile data are ever saved or transmitted to third parties.',
  };
}
