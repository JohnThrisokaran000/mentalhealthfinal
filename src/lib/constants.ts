import type { Permission, Role, WellbeingLevel, AlertSeverity } from "./types";

// ---------------------------------------------------------------------------
// RBAC — explicit permission map per role. Enforced on EVERY sensitive backend
// endpoint (see lib/auth.ts requirePermission()). Frontend hiding is cosmetic only.
// ---------------------------------------------------------------------------

export const PERMISSIONS: Record<Role, Permission[]> = {
  USER: [],
  SUPERVISOR: ["VIEW_USER_PROFILE", "VIEW_RISK_INDICATOR", "MANAGE_ALERTS"],
  MENTAL_HEALTH_PROFESSIONAL: [
    "VIEW_USER_PROFILE",
    "VIEW_ASSESSMENT",
    "VIEW_JOURNAL",
    "VIEW_AI_CONVERSATION",
    "VIEW_RISK_INDICATOR",
    "MANAGE_ALERTS",
  ],
  ADMIN: [
    "VIEW_USER_PROFILE",
    "VIEW_RISK_INDICATOR",
    "MANAGE_ALERTS",
    "MANAGE_USERS",
    "VIEW_ANALYTICS",
    "VIEW_AUDIT_LOGS",
    "MANAGE_SYSTEM",
  ],
  SUPER_ADMIN: [
    "VIEW_USER_PROFILE",
    "VIEW_ASSESSMENT",
    "VIEW_JOURNAL",
    "VIEW_AI_CONVERSATION",
    "VIEW_RISK_INDICATOR",
    "MANAGE_ALERTS",
    "MANAGE_USERS",
    "VIEW_ANALYTICS",
    "VIEW_AUDIT_LOGS",
    "MANAGE_SYSTEM",
  ],
};

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Personnel",
  SUPERVISOR: "Supervisor",
  MENTAL_HEALTH_PROFESSIONAL: "Mental Health Professional",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Super Administrator",
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  VIEW_USER_PROFILE: "View personnel profile",
  VIEW_ASSESSMENT: "View assessment history & results",
  VIEW_JOURNAL: "View journal entries (sensitive)",
  VIEW_AI_CONVERSATION: "View AI conversations (sensitive)",
  VIEW_RISK_INDICATOR: "View wellbeing indicators",
  MANAGE_ALERTS: "Manage alerts",
  MANAGE_USERS: "Manage user accounts",
  VIEW_ANALYTICS: "View analytics",
  VIEW_AUDIT_LOGS: "View audit logs",
  MANAGE_SYSTEM: "Manage system settings",
};

export const SENSITIVE_PERMISSIONS: Permission[] = [
  "VIEW_JOURNAL",
  "VIEW_AI_CONVERSATION",
  "VIEW_ASSESSMENT",
];

export function hasPermission(role: Role, perm: Permission): boolean {
  return PERMISSIONS[role]?.includes(perm) ?? false;
}

// ---------------------------------------------------------------------------
// Wellbeing levels — operational indicators, NOT diagnoses.
// Colors chosen so HIGH/CRITICAL are never color-only (paired with icon+label).
// ---------------------------------------------------------------------------

export interface LevelMeta {
  label: string;
  short: string;
  color: string;      // text color class
  bg: string;         // background tint class
  dot: string;         // solid color hex for charts
  ring: string;       // ring/border class
}

export const LEVEL_META: Record<WellbeingLevel, LevelMeta> = {
  NORMAL:   { label: "Normal",    short: "N", color: "text-emerald-700",  bg: "bg-emerald-50",  dot: "#059669", ring: "ring-emerald-200" },
  LOW:      { label: "Low",        short: "L", color: "text-teal-700",    bg: "bg-teal-50",    dot: "#0d9488", ring: "ring-teal-200" },
  MODERATE: { label: "Moderate",  short: "M", color: "text-amber-700",    bg: "bg-amber-50",   dot: "#d97706", ring: "ring-amber-200" },
  ELEVATED: { label: "Elevated",  short: "E", color: "text-orange-700",    bg: "bg-orange-50",  dot: "#ea580c", ring: "ring-orange-200" },
  HIGH:     { label: "High",      short: "H", color: "text-red-700",      bg: "bg-red-50",     dot: "#dc2626", ring: "ring-red-200" },
  CRITICAL: { label: "Critical",  short: "C", color: "text-rose-800",     bg: "bg-rose-50",    dot: "#9f1239", ring: "ring-rose-300" },
};

export const SEVERITY_META: Record<AlertSeverity, LevelMeta> = LEVEL_META as unknown as Record<AlertSeverity, LevelMeta>;

// Deterministic mapping 0..100 -> operational level (risk_engine.ts mirrors this).
export function scoreToLevel(score: number): WellbeingLevel {
  if (score < 20) return "NORMAL";
  if (score < 40) return "LOW";
  if (score < 60) return "MODERATE";
  if (score < 75) return "ELEVATED";
  if (score < 90) return "HIGH";
  return "CRITICAL";
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavItem {
  key: string;     // view key (matches store.view)
  label: string;
  icon?: string;   // lucide icon name
}

export const PUBLIC_NAV: NavItem[] = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
  { key: "how-it-works", label: "How It Works" },
  { key: "resources", label: "Resources" },
  { key: "support", label: "Support" },
];

export const APP_NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { key: "daily-log", label: "Daily Journal", icon: "BookHeart" },
  { key: "voice-journal", label: "Voice Journal", icon: "Mic" },
  { key: "ai-companion", label: "AI Companion", icon: "MessageCircleHeart" },
  { key: "history", label: "History", icon: "History" },
  { key: "resources", label: "Resources", icon: "BookOpen" },
  { key: "support", label: "Support", icon: "LifeBuoy" },
  { key: "profile", label: "Profile", icon: "UserRound" },
];

export const ADMIN_NAV: NavItem[] = [
  { key: "admin", label: "Dashboard", icon: "LayoutDashboard" },
  { key: "admin-personnel", label: "Personnel", icon: "Users" },
  { key: "admin-risk", label: "Risk Monitoring", icon: "ShieldAlert" },
  { key: "admin-alerts", label: "Alerts", icon: "BellRing" },
  { key: "admin-analytics", label: "Analytics", icon: "BarChart3" },
  { key: "admin-audit", label: "Audit Logs", icon: "ScrollText" },
  { key: "admin-settings", label: "System Settings", icon: "Settings" },
];

// ---------------------------------------------------------------------------
// Resources catalog (configurable — also seeded into DB, this is the fallback).
// ---------------------------------------------------------------------------

export interface ResourceSeed {
  title: string;
  summary: string;
  category: string;
  body: string;
  source: string | null;
  durationMin: number | null;
  tags: string[];
}

export const RESOURCE_CATEGORIES = [
  "Stress", "Burnout", "Sleep", "Relationships", "Family Separation",
  "Operational Stress", "Relaxation", "Breathing Exercises",
  "Mental Wellbeing", "Professional Support",
];

export const MOODS: { value: import("./types").Mood; label: string; emoji: string }[] = [
  { value: "great", label: "Great", emoji: "😌" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "okay", label: "Okay", emoji: "😐" },
  { value: "low", label: "Low", emoji: "😔" },
  { value: "rough", label: "Rough", emoji: "😣" },
];

// Standard audit action names — kept in the client-safe constants file so admin
// UI components can import them without pulling in the server-only audit logger.
export const AUDIT_ACTIONS = {
  LOGIN: "login",
  LOGOUT: "logout",
  FAILED_LOGIN: "failed_login",
  PASSWORD_RESET_REQUEST: "password_reset_request",
  PASSWORD_RESET: "password_reset",
  ASSESSMENT_SUBMITTED: "assessment_submitted",
  ASSESSMENT_ACCESS: "assessment_access",
  JOURNAL_ACCESS: "journal_access",
  JOURNAL_ACCESS_OWN: "journal_access_own",
  CONVERSATION_ACCESS: "conversation_access",
  VOICE_TRANSCRIBE: "voice_transcribe",
  AI_CHAT: "ai_chat",
  AI_SAFETY_TRIGGERED: "ai_safety_triggered",
  RISK_EVENT_CREATED: "risk_event_created",
  ALERT_CREATED: "alert_created",
  ALERT_UPDATED: "alert_updated",
  USER_PROFILE_ACCESS: "user_profile_access",
  SENSITIVE_ACCESS: "sensitive_access",
  ADMIN_VIEW_PERSONNEL: "admin_view_personnel",
  PERMISSION_CHANGE: "permission_change",
  CONSENT_GRANTED: "consent_granted",
} as const;

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  failed_login: "Failed login",
  password_reset_request: "Password reset request",
  password_reset: "Password reset",
  assessment_submitted: "Assessment submitted",
  assessment_access: "Assessment access (sensitive)",
  assessment_questions_viewed: "Assessment questions viewed",
  assessment_history_viewed_own: "Own assessment history viewed",
  journal_access_own: "Own journal accessed",
  journal_access: "Journal access (sensitive)",
  journal_draft_saved: "Journal draft saved",
  journal_submitted: "Journal submitted",
  journal_updated: "Journal updated",
  journal_deleted: "Journal deleted",
  conversation_access: "Conversation access (sensitive)",
  voice_transcribe: "Voice transcribed",
  ai_chat: "AI chat message",
  ai_safety_triggered: "AI safety layer triggered",
  risk_event_created: "Risk event created",
  alert_created: "Alert created",
  alert_updated: "Alert updated",
  user_profile_access: "User profile accessed",
  sensitive_access: "Sensitive content accessed",
  admin_view_personnel: "Admin viewed personnel list",
  permission_change: "Permission changed",
  consent_granted: "Consent granted",
  consent_withdrawn: "Consent withdrawn",
  dashboard_viewed_own: "Own dashboard viewed",
  support_request_created: "Support request created",
  unauthorized_access_attempt: "Unauthorized access attempt",
  system_seed: "System seed",
};

export const APP_NAME = "Sentinel";
export const APP_TAGLINE = "Wellbeing, early support, and confidential check-ins for armed forces personnel.";
export const CONSENT_VERSION = "1.0.0";
