import { db } from "./db";
import { scoreToLevel } from "./constants";
import type { WellbeingLevel } from "./types";
import { getAIProvider } from "./ai/provider";
import { AUDIT_ACTIONS, logAudit } from "./audit";

// ---------------------------------------------------------------------------
// Risk engine — deterministic rules layer that COMBINES signals from multiple
// sources. The LLM never sets final risk; it only supplies signals that feed
// this rules layer.
//
// Sources combined (configurable weights):
//   - latest assessment normalized score
//   - recent journal signals (AI analysis + deterministic keywords)
//   - recent voice entry signals
//   - AI conversation risk flags
//   - open support requests
//
// Output: an internal operational indicator (NORMAL..CRITICAL). This is NEVER
// shown to the end user; only authorized roles with VIEW_RISK_INDICATOR see it.
// ---------------------------------------------------------------------------

export interface RiskInput {
  assessmentScore?: number;   // 0..100 normalized
  recentJournalLevels: WellbeingLevel[];
  recentVoiceLevels: WellbeingLevel[];
  aiConversationRiskCount: number;
  openSupportRequests: number;
}

const LEVEL_TO_NUM: Record<WellbeingLevel, number> = {
  NORMAL: 8, LOW: 22, MODERATE: 50, ELEVATED: 70, HIGH: 85, CRITICAL: 95,
};

export function computeRiskLevel(input: RiskInput): { score: number; level: WellbeingLevel; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (input.assessmentScore != null) {
    score += input.assessmentScore * 0.35;
    if (input.assessmentScore >= 60) reasons.push("Initial assessment above threshold");
  }

  // strongest recent journal level
  const journalLevels = input.recentJournalLevels.map((l) => LEVEL_TO_NUM[l] ?? 8);
  if (journalLevels.length) {
    const maxJ = Math.max(...journalLevels);
    score += maxJ * 0.3;
    if (maxJ >= 70) reasons.push("Recent journal signals elevated");
  }

  const voiceLevels = input.recentVoiceLevels.map((l) => LEVEL_TO_NUM[l] ?? 8);
  if (voiceLevels.length) {
    const maxV = Math.max(...voiceLevels);
    score += maxV * 0.15;
    if (maxV >= 70) reasons.push("Recent voice journal signals elevated");
  }

  score += Math.min(20, input.aiConversationRiskCount * 12) * 0.1;

  if (input.openSupportRequests > 0) {
    score += Math.min(15, input.openSupportRequests * 8) * 0.1;
    reasons.push(`${input.openSupportRequests} open support request(s)`);
  }

  score = Math.min(100, Math.round(score));
  const level = scoreToLevel(score);
  return { score, level, reasons };
}

// Persist a risk event + auto-create an alert when crossing thresholds.
export async function recordRiskEvent(opts: {
  userId: string;
  level: WellbeingLevel;
  source: string;
  confidence: number;
  signals?: string[];
  reason?: string;
  autoAlert?: boolean;
}): Promise<void> {
  const event = await db.riskEvent.create({
    data: {
      userId: opts.userId,
      level: opts.level,
      source: opts.source,
      confidence: opts.confidence,
      signalsJson: JSON.stringify(opts.signals ?? []),
      reason: opts.reason ?? null,
    },
  });

  await logAudit({
    actorId: opts.userId,
    action: AUDIT_ACTIONS.RISK_EVENT_CREATED,
    targetType: "RiskEvent",
    targetId: event.id,
    metadata: { level: opts.level, source: opts.source, score: opts.confidence },
  });

  // Threshold-based alerting (NOT a diagnosis). The platform alerts
  // authorized professionals so they can offer human support.
  const shouldAlert =
    opts.autoAlert !== false &&
    (opts.level === "ELEVATED" || opts.level === "HIGH" || opts.level === "CRITICAL");

  if (shouldAlert) {
    const severity =
      opts.level === "CRITICAL" ? "CRITICAL" :
      opts.level === "HIGH" ? "HIGH" :
      opts.level === "ELEVATED" ? "MODERATE" : "LOW";

    // Avoid duplicate open alerts for the same user within 24h
    const since = new Date(Date.now() - 86400000);
    const existing = await db.alert.findFirst({
      where: { userId: opts.userId, status: { in: ["OPEN", "ACKNOWLEDGED", "IN_REVIEW"] }, createdAt: { gte: since } },
    });
    if (!existing) {
      const alert = await db.alert.create({
        data: {
          userId: opts.userId,
          severity,
          reason: opts.reason || `Wellbeing indicators reached ${opts.level} via ${opts.source}`,
          source: opts.source,
          status: "OPEN",
        },
      });
      await logAudit({
        actorId: opts.userId,
        action: AUDIT_ACTIONS.ALERT_CREATED,
        targetType: "Alert",
        targetId: alert.id,
        metadata: { severity, level: opts.level, source: opts.source },
      });
    }
  }
}

// Convenience: recompute + persist the current risk for a user from all sources.
export async function recomputeUserRisk(userId: string): Promise<{ score: number; level: WellbeingLevel; reasons: string[] }> {
  const [latestResult, journals, voices, aiRisk, support] = await Promise.all([
    db.assessmentResult.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    db.dailyJournal.findMany({ where: { userId, status: "SUBMITTED" }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.voiceEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.aIMessage.count({ where: { riskFlag: true, conversation: { userId } } }),
    db.supportRequest.count({ where: { userId, status: "OPEN" } }),
  ]);

  const input: RiskInput = {
    assessmentScore: latestResult?.normalizedScore,
    recentJournalLevels: journals.map((j) => j.wellbeingLevel as WellbeingLevel).filter(Boolean) as WellbeingLevel[],
    recentVoiceLevels: voices.map((v) => v.wellbeingLevel as WellbeingLevel).filter(Boolean) as WellbeingLevel[],
    aiConversationRiskCount: aiRisk,
    openSupportRequests: support,
  };
  const result = computeRiskLevel(input);
  await recordRiskEvent({
    userId,
    level: result.level,
    source: "rules_engine",
    confidence: result.score / 100,
    signals: result.reasons,
    reason: result.reasons.join("; ") || undefined,
    autoAlert: false, // periodic recompute shouldn't spam alerts; explicit actions do
  });
  return result;
}

// Helper to recompute from a journal/voice/ai trigger that should alert.
export async function triggerRiskFromContent(opts: {
  userId: string;
  source: "assessment" | "journal" | "voice" | "ai_chat";
  level: WellbeingLevel;
  confidence: number;
  signals?: string[];
  reason?: string;
}): Promise<void> {
  await recordRiskEvent({
    userId: opts.userId,
    level: opts.level,
    source: opts.source,
    confidence: opts.confidence,
    signals: opts.signals,
    reason: opts.reason,
    autoAlert: true,
  });
}

export { getAIProvider };
