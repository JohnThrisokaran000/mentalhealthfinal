"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  ScrollText,
  FileCheck2,
  HeartPulse,
  BookHeart,
  MessageCircleHeart,
  Mic,
  LifeBuoy,
  DatabaseZap,
  ArrowRight,
  Phone,
  ListChecks,
  UserRound,
  ClipboardCheck,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const trustBadges = [
  { icon: Lock, label: "Encrypted" },
  { icon: ShieldCheck, label: "RBAC" },
  { icon: ScrollText, label: "Audit-logged" },
  { icon: FileCheck2, label: "Consent-tracked" },
];

const features = [
  {
    icon: HeartPulse,
    title: "Daily Check-ins",
    description: "A 60-second wellbeing pulse that tracks patterns over time without disrupting your day.",
  },
  {
    icon: BookHeart,
    title: "Daily Journal",
    description: "A private space to reflect, with optional AI-assisted summaries of how your week has felt.",
  },
  {
    icon: MessageCircleHeart,
    title: "AI Companion",
    description: "A grounded, non-diagnostic AI companion for low-intensity support between check-ins.",
  },
  {
    icon: Mic,
    title: "Voice Journaling",
    description: "Speak your thoughts when writing feels like too much. Auto-transcribed, always private.",
  },
  {
    icon: LifeBuoy,
    title: "Professional Support",
    description: "Discreet requests for support that route to your unit wellbeing officer or clinician.",
  },
  {
    icon: DatabaseZap,
    title: "Secure Data Handling",
    description: "Field-level encryption, role-based access, and audit logs on every sensitive action.",
  },
];

const howItWorksPreview = [
  {
    icon: UserRound,
    title: "Register & verify",
    description: "Create your account with your service identity and consent to the platform's use.",
  },
  {
    icon: ClipboardCheck,
    title: "Complete first assessment",
    description: "A short, validated baseline that calibrates the platform to you — not a diagnosis.",
  },
  {
    icon: ListChecks,
    title: "Daily check-ins & journaling",
    description: "Build a private picture of your wellbeing over time, with AI-assisted summaries.",
  },
];

export default function LandingView() {
  const navigate = useApp((s) => s.navigate);

  return (
    <div className="bg-background">
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden">
        <div className="hero-grid absolute inset-0 h-full w-full" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-5 border-primary/30 bg-primary/5 text-primary">
              <ShieldCheck className="h-3 w-3" />
              {APP_NAME} Wellbeing Platform
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your wellbeing matters.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {APP_TAGLINE} Private daily check-ins, journaling, an AI-assisted
              companion for in-between moments, and discreet human support when
              you need it.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate("register")} className="w-full sm:w-auto">
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("how-it-works")}
                className="w-full sm:w-auto"
              >
                How It Works
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {trustBadges.map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5">
                  <t.icon className="h-3.5 w-3.5 text-primary" />
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- FEATURES GRID */}
      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              What you get
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              One platform, six ways to look after yourself
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Discreet, private, and built for the realities of service life —
              not a consumer wellness app.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- NEED IMMEDIATE HELP */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:p-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-200 sm:text-2xl">
                  Need immediate help?
                </h2>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-amber-800/90 dark:text-amber-100/80">
                If you are in crisis or in immediate danger, please contact your
                local emergency services. Sentinel is not an emergency service —
                but we can help you reach the right people within your unit and
                chain of care.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => navigate("support")}
                  className="bg-amber-700 text-white hover:bg-amber-800"
                >
                  <LifeBuoy className="mr-1.5 h-4 w-4" />
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("support", { focus: "emergency" })}
                  className="border-amber-300 bg-background text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/40"
                >
                  <Phone className="mr-1.5 h-4 w-4" />
                  Emergency Assistance
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-background/70 p-5 dark:border-amber-900/50 dark:bg-background/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                If you are in immediate danger
              </p>
              <p className="mt-2 text-sm text-amber-900 dark:text-amber-100">
                Use your local emergency number or go to the nearest emergency
                department. If you are with someone who is at immediate risk,
                do not leave them alone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- HOW IT WORKS PREVIEW */}
      <section className="border-y border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                How it works
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                A simple, private rhythm — not another thing to manage
              </h2>
            </div>
            <Button variant="outline" onClick={() => navigate("how-it-works")}>
              See full process <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {howItWorksPreview.map((step, i) => (
              <li key={step.title}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {i + 1}
                      </span>
                      <step.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------------- PRIVACY/TRUST */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Privacy & trust
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Least privilege, explicit consent, full audit trail
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Sentinel is built for environments where trust is non-negotiable.
              Your wellbeing data is encrypted at rest with field-level
              protection, access is granted only on a need-to-know basis, and
              every sensitive action is written to an immutable audit log. You
              decide what you consent to — and you can withdraw it.
            </p>
            <div className="mt-6">
              <Button variant="link" onClick={() => navigate("privacy")} className="px-0">
                Read the full privacy policy <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Lock, title: "Encrypted at rest", body: "Field-level protection for sensitive content." },
              { icon: ShieldCheck, title: "Role-based access", body: "Only authorised roles see what they need to." },
              { icon: ScrollText, title: "Audit logging", body: "Every sensitive action is recorded." },
              { icon: FileCheck2, title: "Consent-tracked", body: "Granular consent with version history." },
            ].map((p) => (
              <Card key={p.title} className="gap-3 py-4">
                <CardContent className="flex flex-col gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <p.icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold text-foreground">{p.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{p.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- FINAL CTA */}
      <section className="border-t border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Wellbeing is a sign of strength.
              </h2>
              <p className="mt-2 text-sm text-primary-foreground/80 sm:text-base">
                Start a private check-in today. Your data stays yours.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("register")}
              className="shrink-0"
            >
              Get Started <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
