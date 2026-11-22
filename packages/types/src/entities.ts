import type { ContentStatus, Role, SupportedLanguage, VerificationStatus } from './domain.js';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserRecord {
  id: string;
  email: string | null;
  phone: string | null;
  passwordHash: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface ProfileRecord {
  id: string;
  userId: string;
  preferredLanguage: SupportedLanguage;
  stateCode: string | null;
  districtCode: string | null;
  accessibilityPreferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RoleRecord {
  id: string;
  name: Role;
  description: string;
}

export interface UserRoleRecord {
  userId: string;
  roleId: string;
  assignedAt: string;
}

export interface ServiceRecord {
  id: string;
  slug: string;
  serviceType: string;
  title: string;
  shortDescription: string;
  departmentName: string;
  stateCode: string | null;
  status: ContentStatus;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceVersionRecord {
  id: string;
  serviceId: string;
  versionNumber: number;
  content: Record<string, unknown>;
  language: SupportedLanguage;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdBy: string;
  approvedBy: string | null;
  createdAt: string;
}

export interface DocumentIssuerRecord {
  id: string;
  name: string;
  issuerType: string;
  portalUrl: string | null;
  createdAt: string;
}

export interface DocumentIssuingStep {
  stepNumber: number;
  title: string;
  description: Record<string, string>;
  officialUrl?: string | null | undefined;
}

export interface DocumentPrerequisite {
  name: string;
  description: Record<string, string>;
}

export interface DocumentIssuingAuthority {
  name: string;
  department: string;
  portalUrl: string | null;
  physicalOffices: string;
  helpline: string | null;
}

export interface DocumentIssuingGuide {
  purpose: Record<string, string>;
  prerequisites: DocumentPrerequisite[];
  issuingAuthority: DocumentIssuingAuthority;
  processingTimeDays: number;
  fees: Record<string, string>;
  validityPeriod: Record<string, string>;
  steps: DocumentIssuingStep[];
  alternativeDocuments?: string[] | undefined;
}

export interface DocumentRecord {
  id: string;
  name: string;
  description: string;
  documentType: string;
  issuerId: string | null;
  issuingGuide?: DocumentIssuingGuide | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentGuideDetail extends DocumentRecord {
  document: DocumentRecord;
  issuer: DocumentIssuerRecord | null;
  guide: DocumentIssuingGuide;
}

export interface ServiceDocumentRecord {
  id: string;
  serviceId: string;
  documentId: string;
  isRequired: boolean;
  conditions: Record<string, unknown> | null;
  displayOrder: number;
}

export interface EligibilityQuestionRecord {
  id: string;
  serviceId: string;
  key: string;
  questionText: Record<string, string>;
  answerType: 'text' | 'number' | 'boolean' | 'single_choice' | 'multi_choice';
  required: boolean;
  displayOrder: number;
}

export interface EligibilityOptionRecord {
  id: string;
  questionId: string;
  key: string;
  label: Record<string, string>;
  displayOrder: number;
}

export type RuleOperator = '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not_in' | 'contains';

export interface FieldCondition {
  field: string;
  operator: RuleOperator;
  value: string | number | boolean | string[] | number[];
}

export interface RuleGroup {
  all?: (FieldCondition | RuleGroup)[];
  any?: (FieldCondition | RuleGroup)[];
  none?: (FieldCondition | RuleGroup)[];
}

export type DeterministicRuleExpression = RuleGroup | FieldCondition;

export interface EligibilityRuleRecord {
  id: string;
  serviceId: string;
  name: string;
  ruleExpression: DeterministicRuleExpression;
  explanation: Record<string, string>;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export type EligibilityStatus = 'POTENTIALLY_ELIGIBLE' | 'UNLIKELY_ELIGIBLE' | 'INCOMPLETE_INFO';

export interface RuleEvaluationDetail {
  ruleId: string;
  ruleName: string;
  status: 'PASSED' | 'FAILED' | 'MISSING_DATA';
  explanation: string;
  reason?: string | undefined;
  missingFields: string[];
}

export interface EligibilityEvaluationResult {
  result: EligibilityStatus;
  matchedRules: RuleEvaluationDetail[];
  unmatchedRules: RuleEvaluationDetail[];
  missingFields: string[];
  explanations: string[];
  disclaimer: string;
}

export interface JourneyRecord {
  id: string;
  serviceId: string;
  title: string;
  description: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyStepRecord {
  id: string;
  journeyId: string;
  stepKey: string;
  title: string;
  description: Record<string, string>;
  stepType: string;
  displayOrder: number;
  officialUrl: string | null;
  completionRule: Record<string, unknown> | null;
}

export type JourneyProgressStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type StepExecutionStatus = 'COMPLETED' | 'IN_PROGRESS' | 'NEXT' | 'UPCOMING' | 'BLOCKED';
export type StepCompletionRuleType =
  'MANUAL_CONFIRMATION' | 'DOCUMENT_CHECKLIST' | 'ELIGIBILITY_EVALUATION' | 'APPLICATION_REFERENCE';

export interface StepCompletionRule {
  type: StepCompletionRuleType;
  requiredFields?: string[];
  description?: string;
  allowSelfDeclaration?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UserJourneyProgressRecord {
  id: string;
  userId: string;
  journeyId: string;
  stepId: string;
  status: JourneyProgressStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserJourneyRecord {
  id: string;
  userId: string;
  journeyId: string;
  serviceId: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyStepWithProgress extends JourneyStepRecord {
  status: StepExecutionStatus;
  completedAt: string | null;
  isNextStep: boolean;
  canComplete: boolean;
}

export interface JourneyProgressSummary {
  totalSteps: number;
  completedSteps: number;
  currentStepIndex: number;
  percentage: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  nextStep: JourneyStepWithProgress | null;
}

export interface UserJourneyDetail {
  id: string;
  serviceId: string;
  serviceSlug: string;
  serviceTitle: string;
  journeyTemplateId: string;
  title: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: JourneyProgressSummary;
  steps: JourneyStepWithProgress[];
  nextStep: JourneyStepWithProgress | null;
}

export interface ServiceSourceRecord {
  id: string;
  serviceId: string;
  sourceUrl: string;
  sourceType: string;
  publisher: string;
  retrievedAt: string;
  lastVerifiedAt: string;
  verificationStatus: VerificationStatus;
  reviewNotes: string | null;
}

export interface DeadlineRecord {
  id: string;
  serviceId: string;
  name: string;
  opensAt: string | null;
  closesAt: string | null;
  sourceId: string | null;
  status: string;
}

export interface ContentReviewRecord {
  id: string;
  serviceId: string;
  reviewerId: string | null;
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  notes: string | null;
  reviewedAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PublicServiceSummary {
  id: string;
  slug: string;
  serviceType: string;
  title: string;
  shortDescription: string;
  departmentName: string;
  stateCode: string | null;
  verification: {
    status: VerificationStatus;
    lastVerifiedAt: string;
  };
}

export interface PublicServiceSource {
  id: string;
  serviceId: string;
  sourceUrl: string;
  sourceType: string;
  publisher: string;
  verificationStatus: VerificationStatus;
  lastVerifiedAt: string;
  retrievedAt: string;
}

export interface PublicServiceDetail {
  service: ServiceRecord;
  version: ServiceVersionRecord | null;
  sources: PublicServiceSource[];
  documents: DocumentRecord[];
  rules: EligibilityRuleRecord[];
  journey: (JourneyRecord & { steps: JourneyStepRecord[] }) | null;
  deadlines: DeadlineRecord[];
}

export interface CatalogueCategory {
  category: string;
  count: number;
}
