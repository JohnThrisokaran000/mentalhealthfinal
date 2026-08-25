"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

/**
 * Shared layout for all authentication views.
 * Renders a centered, calm card over a split teal-gradient + hero-grid
 * background. Subtle framer-motion entrance keeps the tone professional.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[78vh] flex-1 items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      {/* Calm split background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-background to-background" />
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div
          className="absolute left-1/2 top-0 h-[460px] w-[860px] max-w-[120vw] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.6 0.09 178 / 0.16), transparent)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-border/70 shadow-lg shadow-primary/5">
          <CardHeader className="gap-3 text-center">
            <div className="mx-auto flex justify-center">
              <Logo size={34} />
            </div>
            <div className="space-y-1.5">
              {eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {eyebrow}
                </p>
              )}
              <CardTitle className="text-xl">{title}</CardTitle>
              {description && (
                <CardDescription className="text-sm leading-relaxed">
                  {description}
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {children}
            {footer && (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
          Encrypted in transit · Accessible only to authorised personnel
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Password strength meter — on-brand teal with red only for "weak".
 * Shared by Register and Reset-password views.
 */
export function PasswordStrength({ password }: { password: string }) {
  const { score, label } = scorePassword(password);
  const colors = [
    "bg-muted",
    "bg-destructive/70",
    "bg-primary/40",
    "bg-primary/70",
    "bg-primary",
  ];
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={
              "h-1.5 flex-1 rounded-full transition-colors " +
              (i < score ? colors[score] : "bg-muted")
            }
          />
        ))}
      </div>
      <span className="w-12 text-right text-xs text-muted-foreground">
        {password ? label : "—"}
      </span>
    </div>
  );
}

export function scorePassword(pw: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  if (!pw) return { score: 0, label: "—" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const score = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}

/**
 * Password input with a leading lock icon and a trailing show/hide toggle.
 * Forwards all input props, so it can be dropped straight into a FormField.
 */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { value?: string }
>(function PasswordInput({ className, ...props }, ref) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <LockKeyhole
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        ref={ref}
        type={show ? "text" : "password"}
        className={cn("pl-9 pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});
