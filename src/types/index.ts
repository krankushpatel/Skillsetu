/**
 * SkillSetu - Core TypeScript Type Definitions
 * Step 1, Step 2 & Step 3: Project Foundation, Models & Student Module
 */

export type UserRole = 'STUDENT' | 'INDUSTRY' | 'INSTITUTION';
export type SkillCategory = 'TECHNICAL' | 'DOMAIN' | 'ANALYTICAL' | 'SOFT_SKILL';
export type OpportunityType = 'INTERNSHIP' | 'PROJECT' | 'FULL_TIME';
export type WorkMode = 'REMOTE' | 'HYBRID' | 'ON_SITE';

export interface SystemHealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  environment: string;
  database: {
    connected: boolean;
    database_name: string;
    configured_uri: string;
    engine?: string;
    status_message: string;
    collection_counts?: Record<string, number>;
  };
  step: string;
}

export interface ApiErrorResponse {
  error: string;
  detail?: string;
  path?: string;
}

// Standardized Skill
export interface Skill {
  _id: string;
  name: string;
  category: SkillCategory;
  description: string;
  industryDemandScore: number;
  createdAt: string;
}

// Student Assessed Skill Item
export interface EnrichedStudentSkill {
  skillId: string;
  skillName: string;
  category: SkillCategory;
  description?: string;
  industryDemandScore?: number;
  proficiency: number;
  assessed: boolean;
  lastAssessed?: string;
}

export interface StudentSkillScoreItem {
  skillId: string;
  proficiency: number;
  assessed: boolean;
  lastAssessed?: string;
}

export interface StudentProject {
  title: string;
  domain?: string;
  role?: string;
  status?: string;
  description?: string;
}

export interface StudentInternship {
  organization: string;
  role: string;
  duration: string;
}

export interface StudentFullProfile {
  id: string;
  userId?: string;
  name: string;
  email: string;
  avatar?: string;
  institutionId?: string;
  institutionName?: string;
  institutionLocation?: string;
  department: string;
  course: string;
  batch: string;
  cgpa: number;
  bio: string;
  skillQuotient: number;
  assessedSkills: EnrichedStudentSkill[];
  certifications: string[];
  projects: StudentProject[];
  internships: StudentInternship[];
  achievements: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentSummary {
  id: string;
  userId?: string;
  name: string;
  email: string;
  avatar?: string;
  institutionId?: string;
  department: string;
  course: string;
  batch: string;
  cgpa: number;
  bio: string;
  assessedSkills: EnrichedStudentSkill[];
  certifications: string[];
  projects: any[];
  internships: any[];
  achievements: string[];
}

export interface StudentSkillsResponse {
  studentId: string;
  studentName: string;
  skillQuotient: number;
  totalAssessed: number;
  assessedSkills: EnrichedStudentSkill[];
  strengths: EnrichedStudentSkill[];
  toImprove: EnrichedStudentSkill[];
}

export interface Industry {
  _id: string;
  userId: string;
  organizationName: string;
  industryType: string;
  description: string;
  location: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Institution {
  _id: string;
  name: string;
  type: string;
  location: string;
  departments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OpportunitySkillRequirement {
  skillId: string;
  skillName: string;
  category?: string;
  minProficiency: number;
  requiredProficiency?: number;
  weight: number;
  mandatory: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  industryId: string;
  organizationName: string;
  description: string;
  type: OpportunityType;
  location: string;
  workMode: WorkMode;
  stipend: string;
  duration: string;
  status: string;
  requiredSkills: OpportunitySkillRequirement[];
  createdAt: string;
}

export interface OpportunityDetail extends Opportunity {
  industryType?: string;
  organizationDescription?: string;
  organizationLocation?: string;
  organizationWebsite?: string;
}

export interface LearningResource {
  _id: string;
  skillId: string;
  skillName?: string;
  title: string;
  provider: string;
  description: string;
  duration: string;
  difficulty: string;
  url?: string;
  potentialSkillGain: number;
}

export interface SeedStatusResponse {
  status: string;
  database: any;
  collection_counts: Record<string, number>;
  is_seeded: boolean;
}

// -------------------------------------------------------------
// STEP 4: STANDARDIZED ASSESSMENT ENGINE TYPES
// -------------------------------------------------------------
export type PerformanceTier = 'Strong' | 'Developing' | 'Needs Improvement';

export interface AssessmentTargetSkill {
  id: string;
  name: string;
  category: SkillCategory;
  questionCount?: number;
}

export interface AssessmentSummary {
  id: string;
  title: string;
  description: string;
  targetSkillIds: string[];
  targetSkills: AssessmentTargetSkill[];
  durationMinutes: number;
  totalQuestions: number;
  difficulty: string;
  active: boolean;
  createdAt?: string;
}

export interface ClientAssessmentQuestion {
  id: string;
  order: number;
  question: string;
  options: string[];
  skillId: string;
  skillName: string;
  difficulty: string;
  skillWeight: number;
}

export interface AssessmentDetail {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: string;
  targetSkills: AssessmentTargetSkill[];
  questions: ClientAssessmentQuestion[];
}

export interface AssessmentAnswerSubmission {
  question_id: string;
  selected_option?: number;
  selected_answer?: string;
}

export interface SkillScoreResult {
  skillId: string;
  skillName: string;
  category: SkillCategory;
  score: number;
  performanceTier: PerformanceTier;
  correctCount: number;
  totalQuestions: number;
  earnedWeight: number;
  totalWeight: number;
}

export interface AssessmentSubmissionResult {
  attemptId: string;
  assessmentId: string;
  assessmentTitle: string;
  studentId: string;
  studentName: string;
  overallScore: number;
  performanceTier: PerformanceTier;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  answeredCount: number;
  unansweredCount: number;
  submittedAt: string;
  skillScores: SkillScoreResult[];
  scoringExplanation: string;
}

// -------------------------------------------------------------
// STEP 5: EXPLAINABLE SKILL MATCHING ENGINE TYPES
// -------------------------------------------------------------
export type MatchEligibility = 'ELIGIBLE' | 'CONDITIONAL';
export type SkillMatchStatus = 'MET' | 'GAP';
export type AssessmentStatus = 'ASSESSED' | 'NOT_ASSESSED';

export interface SkillMatchItem {
  skillId: string;
  skillName: string;
  category: string;
  studentScore: number;
  requiredScore: number;
  weight: number;
  ratio: number;
  contribution: number;
  gap: number;
  surplus: number;
  mandatory: boolean;
  mandatorySatisfied: boolean;
  status: SkillMatchStatus;
  statusLabel: string;
  assessmentStatus: AssessmentStatus;
}

export interface MatchSummary {
  requiredSkills: number;
  skillsMet: number;
  skillsWithGap: number;
  mandatorySkills: number;
  mandatoryRequirementsMet: number;
  totalWeight: number;
  earnedWeight: number;
}

export interface OpportunityMatchDetail {
  opportunityId: string;
  opportunityTitle: string;
  organizationName: string;
  studentId: string;
  studentName: string;
  matchScore: number;
  rawMatchScore: number;
  eligibility: MatchEligibility;
  eligibilityLabel: string;
  skills: SkillMatchItem[];
  summary: MatchSummary;
  explanation: string;
  whyNot100: string[];
}

export interface OpportunityMatchSummary {
  opportunityId: string;
  title: string;
  industryId: string;
  organizationName: string;
  type: OpportunityType;
  location: string;
  workMode: WorkMode;
  stipend: string;
  duration: string;
  status: string;
  matchScore: number;
  rawMatchScore: number;
  eligibility: MatchEligibility;
  eligibilityLabel: string;
  summary: MatchSummary;
  explanation: string;
  skills: SkillMatchItem[];
  whyNot100: string[];
}

// --------------------------------------------------------------------------
// Step 6: What-If Skill Improvement Simulation Types
// --------------------------------------------------------------------------

export interface SkillSimulationInput {
  skillId: string;
  proficiency: number;
}

export interface WhatIfSkillComparison {
  skillId: string;
  skillName: string;
  category: string;
  currentScore: number;
  simulatedScore: number;
  requiredScore: number;
  weight: number;
  mandatory: boolean;
  currentGap: number;
  projectedGap: number;
  currentStatus: SkillMatchStatus;
  projectedStatus: SkillMatchStatus;
  currentContribution: number;
  projectedContribution: number;
  isUpdated: boolean;
}

export interface WhatIfResponse {
  opportunityId: string;
  opportunityTitle: string;
  organizationName: string;
  studentId: string;
  studentName: string;
  currentMatchScore: number;
  projectedMatchScore: number;
  currentRawMatchScore: number;
  projectedRawMatchScore: number;
  improvement: number;
  rawImprovement: number;
  skills: WhatIfSkillComparison[];
  eligibility: {
    current: MatchEligibility;
    projected: MatchEligibility;
    currentLabel: string;
    projectedLabel: string;
  };
  summary: {
    currentSkillsMet: number;
    projectedSkillsMet: number;
    currentSkillsWithGap: number;
    projectedSkillsWithGap: number;
    currentMandatoryMet: number;
    projectedMandatoryMet: number;
    mandatorySkills: number;
    totalWeight: number;
    currentEarnedWeight: number;
    projectedEarnedWeight: number;
  };
  explanation: string;
}

// --------------------------------------------------------------------------
// Step 6: Learning Resource Recommendation Types
// --------------------------------------------------------------------------

export interface LearningRecommendation {
  resourceId: string;
  title: string;
  skillId: string;
  skillName: string;
  provider: string;
  description: string;
  duration: string;
  difficulty: string;
  url: string;
  potentialSkillGain: number;
  currentScore: number;
  requiredScore: number;
  gap: number;
  weight: number;
  mandatory: boolean;
  priority: number;
  reason: string;
}

export interface OpportunityRecommendationsResponse {
  opportunityId: string;
  opportunityTitle: string;
  studentId: string;
  studentName: string;
  hasGaps: boolean;
  skillGapCount: number;
  recommendations: LearningRecommendation[];
  skillsWithNoResources: string[];
  message: string;
}

// --------------------------------------------------------------------------
// Step 7: Industry Workspace Types
// --------------------------------------------------------------------------

export interface IndustryProfileStats {
  id: string;
  _id: string;
  userId?: string;
  organizationName: string;
  industryType: string;
  description: string;
  location: string;
  website?: string;
  contactPerson?: {
    name: string;
    email: string;
    avatar?: string;
  };
  activeOpportunities: number;
  totalOpportunities: number;
  totalCandidatesAssessed: number;
  totalEligibleCandidates: number;
  totalConditionalCandidates: number;
  averageMatchScore: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IndustryOpportunityCandidateStats {
  totalCandidatesAssessed: number;
  eligibleCandidates: number;
  conditionalCandidates: number;
  averageMatchScore: number;
  topMatchScore: number;
}

export interface EnrichedIndustryOpportunity {
  id: string;
  _id: string;
  title: string;
  industryId: string;
  organizationName: string;
  description: string;
  type: OpportunityType;
  location: string;
  workMode: WorkMode;
  stipend: string;
  duration: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt?: string;
  requiredSkillsCount: number;
  mandatorySkillsCount: number;
  totalWeight: number;
  requiredSkills: OpportunitySkillRequirement[];
  candidateStats: IndustryOpportunityCandidateStats;
  industryType?: string;
  organizationDescription?: string;
  organizationLocation?: string;
  organizationWebsite?: string;
}

export interface CandidateRankItem {
  rank: number;
  candidateId: string;
  studentId: string;
  name: string;
  course: string;
  department: string;
  institution: string;
  cgpa: number;
  matchScore: number;
  rawMatchScore: number;
  eligibility: MatchEligibility;
  eligibilityLabel: string;
  skillsMet: number;
  totalSkills: number;
  skillsWithGap: number;
  mandatorySkills: number;
  mandatoryRequirementsMet: number;
  mandatoryGaps: number;
  explanation: string;
  skills: SkillMatchItem[];
}

export interface OpportunityCandidatesResponse {
  status: string;
  opportunityId: string;
  opportunityTitle: string;
  organizationName: string;
  totalCandidates: number;
  eligibleCount: number;
  conditionalCount: number;
  averageMatchScore: number;
  topMatchScore: number;
  candidates: CandidateRankItem[];
}

export interface CandidateMatchDetailProfile {
  candidateId: string;
  studentId: string;
  name: string;
  course: string;
  department: string;
  batch: string;
  cgpa: number;
  institution: string;
  institutionShortName: string;
  bio: string;
}

export interface OpportunityCandidateMatchDetailResponse {
  status: string;
  opportunity: {
    id: string;
    title: string;
    organizationName: string;
    type: OpportunityType;
    location: string;
    workMode: WorkMode;
    status: string;
  };
  candidate: CandidateMatchDetailProfile;
  match: OpportunityMatchDetail;
}

export interface CandidateSkillSupplyItem {
  skillId: string;
  skillName: string;
  category: SkillCategory;
  industryDemandScore: number;
  averageProficiency: number;
  assessedCandidateCount: number;
  totalCandidates: number;
}

export interface SkillRequirementDraft {
  skillId: string;
  skillName?: string;
  category?: string;
  requiredProficiency: number;
  weight: number;
  mandatory: boolean;
}

export interface CreateOpportunityPayload {
  industryId: string;
  title: string;
  description: string;
  type: string;
  location: string;
  workMode: string;
  duration?: string;
  stipend?: string;
  requiredSkills: {
    skillId: string;
    requiredProficiency: number;
    weight: number;
    mandatory: boolean;
  }[];
}

// --------------------------------------------------------------------------
// Step 9: Institution Dashboard & Skill Intelligence Types
// --------------------------------------------------------------------------

export type ApplicationStatus = 'APPLIED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'WITHDRAWN';

export interface InstitutionKPIs {
  totalStudents: number;
  assessedStudentsCount: number;
  averageSkillQuotient: number;
  openOpportunities: number;
  totalApplications: number;
  shortlistedApplications: number;
  underReviewApplications: number;
  appliedApplications: number;
  rejectedApplications: number;
  withdrawnApplications: number;
  opportunityReadinessIndex: number;
  topSkillGapsCount: number;
}

export interface InstitutionSummary {
  id: string;
  name: string;
  type: string;
  location: string;
  departments: string[];
}

export interface SkillSupplyItem {
  skillId: string;
  skillName: string;
  category: string;
  description: string;
  assessedStudentCount: number;
  averageProficiency: number;
  strongCount: number;
  developingCount: number;
  needsImprovementCount: number;
  strongPercentage: number;
  developingPercentage: number;
  needsImprovementPercentage: number;
}

export interface SkillSupplyResponse {
  institutionId: string;
  institutionName: string;
  totalStudents: number;
  assessedStudentsCount: number;
  unassessedStudentsCount: number;
  overallCohortAverageProficiency: number;
  skills: SkillSupplyItem[];
}

export interface SkillDemandItem {
  skillId: string;
  skillName: string;
  category: string;
  description: string;
  taxonomyDemandScore: number;
  openOpportunityCount: number;
  requirementCount: number;
  averageRequiredProficiency: number;
  mandatoryCount: number;
  optionalCount: number;
  averageWeight: number;
  demandIntensityScore: number;
  demandRank?: number;
}

export interface SkillDemandResponse {
  totalOpenOpportunities: number;
  totalRequirements: number;
  institutionId?: string;
  institutionName?: string;
  skills: SkillDemandItem[];
}

export type SkillGapStatus = 'Skill Shortage' | 'Balanced' | 'Skill Surplus' | 'No Active Data';
export type GapUrgency = 'High' | 'Medium' | 'Low' | 'None';

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  category: string;
  studentAverageProficiency: number;
  industryRequiredAverage: number;
  studentCount: number;
  strongCount: number;
  developingCount: number;
  needsImprovementCount: number;
  opportunityCount: number;
  mandatoryCount: number;
  optionalCount: number;
  demandIntensityScore: number;
  gap: number;
  status: SkillGapStatus;
  urgency: GapUrgency;
  priorityScore: number;
  explanation: string;
  recommendation: string;
}

export interface SkillGapsResponse {
  institutionId: string;
  institutionName: string;
  totalSkillsAnalyzed: number;
  shortageCount: number;
  balancedCount: number;
  surplusCount: number;
  topSkillGaps: SkillGapItem[];
  allSkillGaps: SkillGapItem[];
}

export type ReadinessStatus = 'Ready' | 'Developing' | 'Needs Improvement' | 'Pending Assessment';

export interface StudentReadinessItem {
  studentId: string;
  userId?: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  course: string;
  batch: string;
  cgpa: number;
  overallSkillQuotient: number;
  assessedSkillsCount: number;
  strongCount: number;
  developingCount: number;
  needsImprovementCount: number;
  readinessStatus: ReadinessStatus;
  readinessTier: string;
  readinessExplanation: string;
}

export interface ReadinessDistributionTier {
  count: number;
  percentage: number;
  assessedPercentage: number;
}

export interface StudentReadinessResponse {
  institutionId: string;
  institutionName: string;
  totalStudents: number;
  assessedStudentsCount: number;
  pendingAssessmentCount: number;
  readyCount: number;
  developingCount: number;
  needsImprovementCount: number;
  opportunityReadinessIndex: number;
  distribution: {
    ready: ReadinessDistributionTier;
    developing: ReadinessDistributionTier;
    needsImprovement: ReadinessDistributionTier;
    pendingAssessment: ReadinessDistributionTier;
  };
  students: StudentReadinessItem[];
}

export interface InstitutionDashboardData {
  institution: InstitutionSummary;
  kpis: InstitutionKPIs;
  readinessSummary: {
    readyCount: number;
    developingCount: number;
    needsImprovementCount: number;
    pendingAssessmentCount: number;
    opportunityReadinessIndex: number;
    distribution: StudentReadinessResponse['distribution'];
  };
  gapSummary: {
    shortageCount: number;
    balancedCount: number;
    surplusCount: number;
    topSkillGaps: SkillGapItem[];
  };
  recentApplications: {
    applicationId: string;
    studentId: string;
    studentName: string;
    opportunityId: string;
    opportunityTitle: string;
    status: ApplicationStatus;
    matchScoreSnapshot: number;
    appliedAt: string;
  }[];
}

export interface InstitutionStudentDetailSkill {
  skillId: string;
  skillName: string;
  category: string;
  proficiency: number;
  proficiencyTier: 'Strong' | 'Developing' | 'Needs Improvement';
  lastAssessed: string;
}

export interface InstitutionStudentDetail {
  studentId: string;
  userId?: string;
  name: string;
  email: string;
  avatar?: string;
  institutionId: string;
  institutionName: string;
  department: string;
  course: string;
  batch: string;
  cgpa: number;
  bio?: string;
  overallSkillQuotient: number;
  readinessStatus: ReadinessStatus;
  strongCount: number;
  developingCount: number;
  needsImprovementCount: number;
  assessedSkills: InstitutionStudentDetailSkill[];
  certifications: string[];
  projects: any[];
  internships: any[];
  achievements: string[];
  applications: {
    applicationId: string;
    opportunityId: string;
    opportunityTitle: string;
    location: string;
    status: ApplicationStatus;
    matchScoreSnapshot: number;
    eligibilitySnapshot: string;
    appliedAt: string;
  }[];
}

export interface InstitutionApplicationsResponse {
  institutionId: string;
  institutionName: string;
  totalApplications: number;
  statusCounts: {
    APPLIED: number;
    UNDER_REVIEW: number;
    SHORTLISTED: number;
    REJECTED: number;
    WITHDRAWN: number;
  };
  applications: {
    applicationId: string;
    studentId: string;
    studentName: string;
    opportunityId: string;
    opportunityTitle: string;
    organizationName: string;
    status: ApplicationStatus;
    matchScoreSnapshot: number;
    eligibilitySnapshot: string;
    appliedAt: string;
    updatedAt: string;
  }[];
}

// --------------------------------------------------------------------------
// Step 8 & 10: Unified Application & Applicant Pipeline Types
// --------------------------------------------------------------------------

export interface ApplicationStatusHistoryItem {
  status: ApplicationStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface StudentApplicationItem {
  id: string;
  studentId: string;
  opportunityId: string;
  opportunityTitle: string;
  organizationName: string;
  type: string;
  location: string;
  workMode: string;
  stipend: string;
  duration: string;
  opportunityStatus: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  matchScoreSnapshot: number;
  eligibilitySnapshot: string;
  currentMatchScore: number;
  currentEligibility: string;
  scoreDelta: number;
  coverNote?: string;
  statusHistory: ApplicationStatusHistoryItem[];
  canWithdraw: boolean;
}

export interface StudentApplicationsSummary {
  applied: number;
  underReview: number;
  shortlisted: number;
  rejected: number;
  withdrawn: number;
}

export interface StudentApplicationsResponse {
  status: string;
  studentId: string;
  studentName: string;
  totalApplications: number;
  summary: StudentApplicationsSummary;
  data: StudentApplicationItem[];
}

export interface CheckApplicationStatusResponse {
  hasApplied: boolean;
  application?: {
    id: string;
    status: ApplicationStatus;
    appliedAt: string;
    matchScoreSnapshot: number;
    eligibilitySnapshot: string;
    coverNote?: string;
  };
}

export interface CreateApplicationPayload {
  studentId: string;
  opportunityId: string;
  coverNote?: string;
}

export interface OpportunityApplicantItem {
  applicationId: string;
  studentId: string;
  name: string;
  email: string;
  course: string;
  department: string;
  batch: string;
  cgpa: number;
  institution: string;
  institutionShortName: string;
  bio?: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  coverNote?: string;
  statusHistory: ApplicationStatusHistoryItem[];
  canAction: boolean;
  matchScoreSnapshot: number;
  eligibilitySnapshot: string;
  currentMatchScore: number;
  currentEligibility: string;
  scoreDelta: number;
  matchingSkillsCount: number;
  totalRequiredSkills: number;
}

export interface OpportunityApplicantsResponse {
  status: string;
  opportunity: {
    id: string;
    title: string;
    type: string;
    status: string;
    organizationName: string;
    industryId: string;
  };
  summary: {
    total: number;
    applied: number;
    underReview: number;
    shortlisted: number;
    rejected: number;
    withdrawn: number;
  };
  applicants: OpportunityApplicantItem[];
}

export interface UpdateApplicationStatusPayload {
  status: 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED';
  recruiterNote?: string;
  industryId?: string;
}






