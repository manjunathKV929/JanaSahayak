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

export interface DocumentRecord {
  id: string;
  name: string;
  description: string;
  documentType: string;
  issuerId: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface UserJourneyProgressRecord {
  id: string;
  userId: string;
  journeyId: string;
  stepId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
