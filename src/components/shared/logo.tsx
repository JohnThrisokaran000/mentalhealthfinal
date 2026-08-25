"use client";

import { ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="inline-flex items-center justify-center rounded-xl shadow-sm"
        style={{ width: size, height: size, background: "oklch(0.42 0.05 178)" }}
      >
        <ShieldCheck className="text-white" style={{ width: size * 0.6, height: size * 0.6 }} strokeWidth={2.2} />
      </span>
      <span className="font-semibold tracking-tight text-foreground text-lg leading-none">
        Sentinel
      </span>
    </span>
  );
}

export function LogoButton() {
  const navigate = useApp((s) => s.navigate);
  const user = useApp((s) => s.user);
  return (
    <button
      onClick={() => navigate(user ? "dashboard" : "home")}
      className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label="Sentinel home"
    >
      <Logo />
    </button>
  );
}
