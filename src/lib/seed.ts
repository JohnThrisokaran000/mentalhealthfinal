import { db } from "./db";
import { hashPassword } from "./auth";
import { RESOURCE_CATEGORIES } from "./constants";
import type { WellbeingLevel } from "./types";

// Development-only seed data. All accounts are clearly marked DEV-only.
// Never use real personal data.

const DEV_PASSWORD = "Sentinel@2025";

interface SeedUser {
  name: string; email: string; role: string; unit?: string; rank?: string; serviceNumber: string;
  onboardingComplete: boolean; firstLogin: boolean;
}

const SEED_USERS: SeedUser[] = [
  { name: "Admin Officer", email: "admin@sentinel.dev", role: "ADMIN", unit: "Command", rank: "Major", serviceNumber: "AF-0001", onboardingComplete: true, firstLogin: false },
  { name: "Dr. Amara Singh", email: "pro@sentinel.dev", role: "MENTAL_HEALTH_PROFESSIONAL", unit: "Medical Corps", rank: "Captain", serviceNumber: "AF-0010", onboardingComplete: true, firstLogin: false },
  { name: "Sgt. Liam O'Connor", email: "supervisor@sentinel.dev", role: "SUPERVISOR", unit: "1st Battalion", rank: "Sergeant", serviceNumber: "AF-0020", onboardingComplete: true, firstLogin: false },
  { name: "Cpl. Maya Rao", email: "user@sentinel.dev", role: "USER", unit: "1st Battalion", rank: "Corporal", serviceNumber: "AF-0100", onboardingComplete: true, firstLogin: false },
  { name: "Pte. Daniel Kim", email: "daniel@sentinel.dev", role: "USER", unit: "2nd Battalion", rank: "Private", serviceNumber: "AF-0101", onboardingComplete: true, firstLogin: false },
  { name: "Pte. Sara Lopez", email: "sara@sentinel.dev", role: "USER", unit: "3rd Battalion", rank: "Private", serviceNumber: "AF-0102", onboardingComplete: false, firstLogin: true },
  { name: "LCpl. Tom Becker", email: "tom@sentinel.dev", role: "USER", unit: "1st Battalion", rank: "Lance Corporal", serviceNumber: "AF-0103", onboardingComplete: true, firstLogin: false },
  { name: "Pte. Aisha Khan", email: "aisha@sentinel.dev", role: "USER", unit: "Logistics", rank: "Private", serviceNumber: "AF-0104", onboardingComplete: true, firstLogin: false },
];

const ASSESSMENT_QUESTIONS = [
  {
    code: "Q1_SLEEP",
    questionText: "Over the past two weeks, how often have you had trouble falling or staying asleep?",
    questionType: "single_choice",
    options: [
      { value: "0", label: "Not at all", score: 0 },
      { value: "1", label: "A few nights", score: 1 },
      { value: "2", label: "Several nights", score: 2 },
      { value: "3", label: "Most nights", score: 3 },
      { value: "4", label: "Nearly every night", score: 4 },
    ],
    category: "Sleep",
    order: 0,
  },
  {
    code: "Q2_MOOD",
    questionText: "How would you describe your overall mood in the last two weeks?",
    questionType: "single_choice",
    options: [
      { value: "0", label: "Generally positive", score: 0 },
      { value: "1", label: "Mostly okay", score: 1 },
      { value: "2", label: "Mixed / flat", score: 2 },
      { value: "3", label: "Low more often than not", score: 3 },
      { value: "4", label: "Persistently low", score: 4 },
    ],
    category: "Mood",
    order: 1,
  },
  {
    code: "Q3_STRESS",
    questionText: "How overwhelmed by work or duties have you felt recently?",
    questionType: "single_choice",
    options: [
      { value: "0", label: "Not at all", score: 0 },
      { value: "1", label: "Occasionally", score: 1 },
      { value: "2", label: "Often", score: 2 },
      { value: "3", label: "Most of the time", score: 3 },
      { value: "4", label: "Constantly", score: 4 },
    ],
    category: "Stress",
    order: 2,
  },
  {
    code: "Q4_CONNECT",
    questionText: "How connected have you felt to the people around you (unit, family, friends)?",
    questionType: "single_choice",
    options: [
      { value: "0", label: "Very connected", score: 0 },
      { value: "1", label: "Mostly connected", score: 1 },
      { value: "2", label: "Somewhat distant", score: 2 },
      { value: "3", label: "Often isolated", score: 3 },
      { value: "4", label: "Very isolated", score: 4 },
    ],
    category: "Social",
    order: 3,
  },
  {
    code: "Q5_FOCUS",
    questionText: "How has your ability to concentrate been over the past two weeks?",
    questionType: "single_choice",
    options: [
      { value: "0", label: "Sharp", score: 0 },
      { value: "1", label: "A little off", score: 1 },
      { value: "2", label: "Noticeably reduced", score: 2 },
      { value: "3", label: "Often foggy", score: 3 },
      { value: "4", label: "Severely impaired", score: 4 },
    ],
    category: "Cognition",
    order: 4,
  },
  {
    code: "Q6_ENERGY",
    questionText: "How would you describe your energy levels day to day?",
    questionType: "single_choice",
    options: [
      { value: "0", label: "Energetic", score: 0 },
      { value: "1", label: "Steady", score: 1 },
      { value: "2", label: "Tiring easily", score: 2 },
      { value: "3", label: "Often drained", score: 3 },
      { value: "4", label: "Exhausted", score: 4 },
    ],
    category: "Energy",
    order: 5,
  },
  {
    code: "Q7_SUPPORT",
    questionText: "If you needed support right now, how confident are you that you could reach out for it?",
    questionType: "single_choice",
    options: [
      { value: "0", label: "Very confident", score: 0 },
      { value: "1", label: "Fairly confident", score: 1 },
      { value: "2", label: "Unsure", score: 2 },
      { value: "3", label: "Reluctant", score: 3 },
      { value: "4", label: "I would not reach out", score: 4 },
    ],
    category: "Support",
    order: 6,
  },
];

const RESOURCES = [
  { title: "Box Breathing for Operational Stress", summary: "A 4-4-4-4 breathing pattern used to steady yourself under pressure.", category: "Breathing Exercises", body: "Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat for 2–3 minutes. This activates your parasympathetic system and lowers acute stress responses.", source: "Field stress toolkit", durationMin: 5, tags: ["acute", "quick"] },
  { title: "Understanding Burnout in Uniformed Service", summary: "Recognize the early signs of burnout before they affect performance and wellbeing.", category: "Burnout", body: "Burnout often builds gradually: chronic fatigue, cynicism, and reduced sense of accomplishment. Early indicators include dreading duties, emotional numbness, and sleep disruption that doesn't resolve with rest. Acknowledging it is the first step — it is not weakness.", source: "Wellbeing brief", durationMin: 8, tags: ["chronic"] },
  { title: "Sleep After High-Tempo Operations", summary: "Practical steps to restore sleep after demanding deployments.", category: "Sleep", body: "After high-tempo periods, your sleep cycle may need recalibration. Keep a fixed wake time, limit caffeine after midday, reduce screen light in the last hour, and accept that recovery takes several nights.", source: "Medical Corps guidance", durationMin: 6, tags: ["recovery"] },
  { title: "Staying Connected During Family Separation", summary: "Maintaining bonds when duty keeps you apart from family.", category: "Family Separation", body: "Schedule regular, predictable contact where possible — predictability matters more than duration. Share small daily moments, not just big updates. Be honest with loved ones about how you're doing, and listen to how they are too.", source: "Family support", durationMin: 7, tags: ["relationships"] },
  { title: "Grounding Techniques for Acute Anxiety", summary: "Five-sense grounding to interrupt spirals of anxiety.", category: "Relaxation", body: "Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste. This anchors you in the present and interrupts acute anxiety loops.", source: "Field toolkit", durationMin: 4, tags: ["anxiety", "quick"] },
  { title: "When to Seek Professional Support", summary: "How to recognize the threshold for reaching out to a clinician.", category: "Professional Support", body: "Consider professional support if low mood, anxiety, or sleep disruption persist for more than a couple of weeks, if they affect your duties or relationships, or if you have thoughts of harming yourself. Reaching out is a sign of strength and good judgment — not failure.", source: "Wellbeing brief", durationMin: 5, tags: ["escalation"] },
  { title: "Managing Operational Stress", summary: "Practical resilience practices for high-stress operational environments.", category: "Operational Stress", body: "Brief, repeated recovery breaks beat rare long ones. Hydrate, move, decompress with peers, and debrief after intense events. Watch out for each other — noticing changes in a colleague is part of operational readiness.", source: "Command guidance", durationMin: 9, tags: ["peer"] },
  { title: "Rebuilding After a Difficult Day", summary: "A short reflective practice to close out hard days.", category: "Stress", body: "Name one thing that was hard, one thing you handled well, and one thing you'll do for yourself this evening. This small ritual helps your nervous system register the day as closed.", source: "Wellbeing brief", durationMin: 5, tags: ["reflection"] },
];

const EMERGENCY_CONTACTS = [
  { label: "Unit Wellbeing Officer", description: "Confidential first point of contact within your unit.", contact: "Available via your unit's internal directory", availableHours: "Duty hours", order: 0 },
  { label: "Mental Health Liaison", description: "Speak with a mental health professional.", contact: "Available via your unit's internal directory", availableHours: "Duty hours", order: 1 },
  { label: "Chaplaincy / Spiritual Support", description: "Confidential, non-denominational support.", contact: "Available via your unit's internal directory", availableHours: "On call", order: 2 },
  { label: "Local Emergency Services", description: "If you or someone else is in immediate danger.", contact: "Use your local emergency number", availableHours: "24/7", order: 3 },
];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

const LEVELS: WellbeingLevel[] = ["NORMAL", "LOW", "MODERATE", "ELEVATED", "HIGH", "CRITICAL"];

export async function runSeed(force = false): Promise<{ created: number; skipped: boolean }> {
  const existing = await db.user.count();
  if (existing > 0 && !force) return { created: 0, skipped: true };

  if (force) {
    // Wipe dev data (order matters for FK constraints)
    await db.auditLog.deleteMany();
    await db.notification.deleteMany();
    await db.consentRecord.deleteMany();
    await db.supportRequest.deleteMany();
    await db.alert.deleteMany();
    await db.riskEvent.deleteMany();
    await db.aIMessage.deleteMany();
    await db.aIConversation.deleteMany();
    await db.voiceEntry.deleteMany();
    await db.dailyJournal.deleteMany();
    await db.assessmentResult.deleteMany();
    await db.assessmentAnswer.deleteMany();
    await db.assessmentSession.deleteMany();
    await db.assessmentQuestion.deleteMany();
    await db.session.deleteMany();
    await db.user.deleteMany();
    await db.resource.deleteMany();
    await db.emergencyContact.deleteMany();
  }

  // Users
  const users = [];
  for (const s of SEED_USERS) {
    const u = await db.user.create({
      data: {
        email: s.email,
        name: s.name,
        role: s.role,
        unit: s.unit ?? null,
        rank: s.rank ?? null,
        serviceNumber: s.serviceNumber,
        passwordHash: hashPassword(DEV_PASSWORD),
        firstLogin: s.firstLogin,
        onboardingComplete: s.onboardingComplete,
        emailVerified: true,
        status: "ACTIVE",
        lastLoginAt: new Date(Date.now() - Math.random() * 86400000 * 3),
      },
    });
    users.push(u);
  }

  // Assessment questions
  for (const q of ASSESSMENT_QUESTIONS) {
    await db.assessmentQuestion.create({
      data: {
        code: q.code,
        questionText: q.questionText,
        questionType: q.questionType,
        options: JSON.stringify(q.options),
        scoringMeta: JSON.stringify({ weight: 1 }),
        category: q.category,
        order: q.order,
        active: true,
        version: 1,
      },
    });
  }

  // Resources
  for (const r of RESOURCES) {
    await db.resource.create({
      data: { ...r, tags: JSON.stringify(r.tags), active: true, order: 0 },
    });
  }
  // Emergency contacts
  for (const e of EMERGENCY_CONTACTS) {
    await db.emergencyContact.create({ data: { ...e, active: true } });
  }

  // Sample assessment sessions + results for a few users (skip the un-onboarded one)
  const onboardedUsers = users.filter((u) => u.onboardingComplete && u.role === "USER");
  for (let i = 0; i < onboardedUsers.length; i++) {
    const u = onboardedUsers[i];
    const totalScore = (i * 7) % 28;
    const normalized = Math.round((totalScore / 28) * 100);
    const level = LEVELS[Math.min(LEVELS.length - 1, i)] || "NORMAL";
    const session = await db.assessmentSession.create({
      data: { userId: u.id, completedAt: new Date(Date.now() - 86400000 * (i + 2)) },
    });
    await db.assessmentResult.create({
      data: {
        sessionId: session.id,
        userId: u.id,
        totalScore,
        normalizedScore: normalized,
        wellbeingLevel: level,
        signalsJson: "[]",
      },
    });
  }

  // Sample journals for a few users
  const journalSamples = [
    { mood: "low", content: "Rough night. Couldn't sleep, kept replaying the patrol. Felt disconnected from the lads today even though nothing actually happened.", level: "ELEVATED" as WellbeingLevel },
    { mood: "okay", content: "Decent day. PT went well. Caught up with family on the phone, that helped.", level: "NORMAL" as WellbeingLevel },
    { mood: "rough", content: "Feeling overwhelmed. Too much going on, can't focus. Honestly just exhausted all the time lately.", level: "HIGH" as WellbeingLevel },
    { mood: "good", content: "Quiet day. Read a bit, went for a run. Feeling more like myself.", level: "LOW" as WellbeingLevel },
  ];
  for (let i = 0; i < onboardedUsers.length; i++) {
    const u = onboardedUsers[i];
    const sample = pick(journalSamples, i);
    await db.dailyJournal.create({
      data: {
        userId: u.id,
        mood: sample.mood,
        content: sample.content,
        status: "SUBMITTED",
        wellbeingLevel: sample.level,
        analysisJson: JSON.stringify({
          wellbeing_signal: sample.level,
          confidence: 0.7,
          signals: sample.level === "NORMAL" ? [] : ["stress", "sleep"],
          requires_human_review: sample.level === "HIGH" || sample.level === "CRITICAL",
          summary: "Sample analysis for development.",
        }),
        createdAt: new Date(Date.now() - 86400000 * (i + 1)),
      },
    });
  }

  // Sample alerts
  const pro = users.find((u) => u.role === "MENTAL_HEALTH_PROFESSIONAL")!;
  for (let i = 0; i < onboardedUsers.length; i++) {
    const u = onboardedUsers[i];
    if (i % 3 === 0) {
      await db.alert.create({
        data: {
          userId: u.id,
          severity: pick(["LOW", "MODERATE", "HIGH", "CRITICAL"], i),
          reason: `Wellbeing indicators reached threshold via journal analysis (dev seed).`,
          source: "risk_engine",
          status: i % 2 === 0 ? "OPEN" : "ACKNOWLEDGED",
          assignedToId: i % 2 === 0 ? null : pro.id,
        },
      });
    }
  }

  // Sample support requests
  await db.supportRequest.create({
    data: {
      userId: onboardedUsers[0].id,
      type: "general",
      message: "I'd like to speak with someone about sleep.",
      status: "OPEN",
    },
  });

  // Audit: bootstrap
  await db.auditLog.create({
    data: {
      actorId: null,
      action: "system_seed",
      targetType: "System",
      targetId: null,
      metadataJson: JSON.stringify({ users: users.length, note: "Development seed data" }),
    },
  });

  return { created: users.length, skipped: false };
}
