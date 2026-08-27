import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai/provider";
import { triggerRiskFromContent } from "@/lib/risk-engine";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { jsonError, apiRoute } from "@/lib/api-shared";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/assessments/current — active questions for the onboarding/assessment flow.
async function _GET() {
  const { user } = await requireAuth();
  const questions = await db.assessmentQuestion.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  await logAudit({ actorId: user.id, action: "assessment_questions_viewed", targetType: "AssessmentQuestion" });
  return Response.json({
    questions: questions.map((q) => ({
      id: q.id, code: q.code, questionText: q.questionText,
      questionType: q.questionType,
      options: JSON.parse(q.options),
      category: q.category, order: q.order,
    })),
  });
}

const submitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    questionCode: z.string(),
    value: z.string(),
  })).min(1),
});

// POST /api/assessments — submit assessment. Scoring is ALWAYS server-side.
async function _POST(req: NextRequest) {
  const { user } = await requireAuth();
  if (user.role !== "USER") return jsonError("Only CRPF personnel can complete assessments.", 403, "USER_ONLY");
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON", 400); }
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  // Look up scoring for each answer from the DB (never trust client scores).
  const questionIds = parsed.data.answers.map((a) => a.questionId);
  const questions = await db.assessmentQuestion.findMany({ where: { id: { in: questionIds } } });
  const qMap = new Map(questions.map((q) => [q.id, q]));

  const scored = parsed.data.answers.map((a) => {
    const q = qMap.get(a.questionId);
    let score = 0;
    if (q) {
      const options = JSON.parse(q.options) as { value: string; score: number }[];
      const opt = options.find((o) => o.value === a.value);
      score = opt?.score ?? 0;
    }
    return { code: a.questionCode, value: a.value, score, questionId: a.questionId };
  });

  const session = await db.assessmentSession.create({
    data: { userId: user.id, completedAt: new Date() },
  });
  await db.assessmentAnswer.createMany({
    data: scored.map((s) => ({
      sessionId: session.id, questionId: s.questionId,
      questionCode: s.code, value: s.value, score: s.score,
    })),
  });

  const result = await getAIProvider().analyzeAssessment(scored);
  const ar = await db.assessmentResult.create({
    data: {
      sessionId: session.id, userId: user.id,
      totalScore: result.totalScore, normalizedScore: result.normalizedScore,
      wellbeingLevel: result.level, signalsJson: JSON.stringify(result.signals),
    },
  });

  // mark onboarding complete
  await db.user.update({ where: { id: user.id }, data: { onboardingComplete: true, firstLogin: false } });

  // feed risk engine
  if (["ELEVATED", "HIGH", "CRITICAL"].includes(result.level)) {
    await triggerRiskFromContent({
      userId: user.id, source: "assessment", level: result.level,
      confidence: result.normalizedScore / 100, signals: result.signals,
      reason: `Initial assessment result: ${result.level}`,
    });
  }

  await logAudit({
    actorId: user.id, action: AUDIT_ACTIONS.ASSESSMENT_SUBMITTED,
    targetType: "AssessmentResult", targetId: ar.id,
    metadata: { level: result.level, normalized: result.normalizedScore },
  });

  // NOTE: the raw score is intentionally NOT returned to the user.
  return Response.json({ ok: true, message: "Your check-in has been recorded." });
}

export const GET = apiRoute(_GET);
export const POST = apiRoute(_POST);
