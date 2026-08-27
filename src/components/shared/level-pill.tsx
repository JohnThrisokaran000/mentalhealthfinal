"use client";

import { type WellbeingLevel } from "@/lib/types";
import { LEVEL_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CheckCircle2, Leaf, AlertTriangle, TriangleAlert, OctagonAlert, ShieldAlert, type LucideIcon } from "lucide-react";

const ICONS: Record<WellbeingLevel, LucideIcon> = {
  NORMAL: CheckCircle2,
  LOW: Leaf,
  MODERATE: AlertTriangle,
  ELEVATED: TriangleAlert,
  HIGH: OctagonAlert,
  CRITICAL: ShieldAlert,
};

// Risk/level pill — NEVER color-only. Always icon + label + color.
export function LevelPill({ level, className, size = "sm" }: { level: WellbeingLevel; className?: string; size?: "sm" | "md" }) {
  const meta = LEVEL_META[level];
  const Icon = ICONS[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1",
        meta.bg, meta.color, meta.ring,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2.4} />
      {meta.label}
    </span>
  );
}

// Dot variant for tables
export function LevelDot({ level }: { level: WellbeingLevel }) {
  const meta = LEVEL_META[level];
  const Icon = ICONS[level];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ background: meta.dot + "22" }}>
        <Icon className="h-3 w-3" style={{ color: meta.dot }} strokeWidth={2.6} />
      </span>
      <span className="text-sm font-medium" style={{ color: meta.dot }}>{meta.label}</span>
    </span>
  );
}
