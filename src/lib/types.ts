// Shared domain types for Sentinel Wellbeing Platform.
// Backend Prisma models use String for enums (SQLite); these unions mirror them
// in the application layer and are validated at every API boundary.

export type Role =
  | "USER"
  | "SUPERVISOR"
  | "MENTAL_HEALTH_PROFESSIONAL"
  | "ADMIN"
  | "SUPER_ADMIN";

export type UserStatus = "ACTIVE" | "LOCKED" | "SUSPENDED" | "PENDING_VERIFICATION";

export type WellbeingLevel =
  | "NORMAL"
  | "LOW"
  | "MODERATE"
  | "ELEVATED"
  | "HIGH"
  | "CRITICAL";

export type AlertSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "IN_REVIEW" | "RESOLVED";
export type SupportStatus = "OPEN" | "ASSIGNED" | "RESOLVED";
export type Mood = "great" | "good" | "okay" | "low" | "rough";

export type Permission =
  | "VIEW_USER_PROFILE"
  | "VIEW_ASSESSMENT"
  | "VIEW_JOURNAL"
  | "VIEW_AI_CONVERSATION"
  | "VIEW_RISK_INDICATOR"
  | "MANAGE_ALERTS"
  | "MANAGE_USERS"
  | "VIEW_ANALYTICS"
  | "VIEW_AUDIT_LOGS"
  | "MANAGE_SYSTEM";

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  serviceNumber: string | null;
  unit: string | null;
  rank: string | null;
  role: Role;
  status: UserStatus;
  firstLogin: boolean;
  onboardingComplete: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AssessmentOption {
  value: string;
  label: string;
  score: number;
}

export interface AssessmentQuestionDTO {
  id: string;
  code: string;
  questionText: string;
  questionType: "single_choice" | "scale" | "text";
  options: AssessmentOption[];
  category: string | null;
  order: number;
}

export interface JournalDTO {
  id: string;
  userId: string;
  mood: Mood | null;
  content: string;
  status: "DRAFT" | "SUBMITTED";
  wellbeingLevel: WellbeingLevel | null;
  analysis: JournalAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalAnalysis {
  wellbeing_signal: WellbeingLevel;
  confidence: number;
  signals: string[];
  requires_human_review: boolean;
  summary?: string;
}

export interface VoiceEntryDTO {
  id: string;
  transcript: string;
  editedTranscript: string | null;
  durationSec: number;
  wellbeingLevel: WellbeingLevel | null;
  analysis: JournalAnalysis | null;
  createdAt: string;
}

export interface AIMessageDTO {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  riskFlag: boolean;
  createdAt: string;
}

export interface AIConversationDTO {
  id: string;
  title: string | null;
  messages: AIMessageDTO[];
  createdAt: string;
}

export interface AlertDTO {
  id: string;
  userId: string;
  userName: string;
  userUnit: string | null;
  severity: AlertSeverity;
  status: AlertStatus;
  reason: string;
  source: string;
  assignedTo: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface PersonnelRowDTO {
  id: string;
  name: string | null;
  serviceNumber: string | null;
  unit: string | null;
  role: Role;
  status: UserStatus;
  wellbeingLevel: WellbeingLevel | null;
  lastCheckIn: string | null;
  lastActivity: string | null;
}

export interface SupportRequestDTO {
  id: string;
  type: string;
  message: string;
  status: SupportStatus;
  assignedTo: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AuditLogDTO {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ResourceDTO {
  id: string;
  title: string;
  summary: string;
  category: string;
  body: string;
  source: string | null;
  durationMin: number | null;
  tags: string[];
}

export interface EmergencyContactDTO {
  id: string;
  label: string;
  description: string;
  contact: string;
  availableHours: string | null;
}

export interface ConsentDTO {
  purpose: string;
  version: string;
  status: "GRANTED" | "WITHDRAWN";
  grantedAt: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}
