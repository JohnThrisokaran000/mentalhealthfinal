"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Spinner } from "@/components/shared/ui";

// Loads the current user on mount and routes appropriately:
//  - if firstLogin && !onboardingComplete and the user tries to go to the app,
//    send them to the assessment.
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { user, loadingUser, setUser, setLoadingUser, view, navigate } = useApp();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user } = await api.get<{ user: import("@/lib/types").SafeUser | null }>("/api/auth/me");
        if (cancelled) return;
        setUser(user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();
    return () => { cancelled = true; };
  }, [setUser, setLoadingUser]);

  // First-login onboarding enforcement: if logged in but onboarding not complete
  // and the user is trying to enter the app, push them to assessment.
  useEffect(() => {
    if (user && !user.onboardingComplete) {
      const appViews = ["dashboard", "daily-log", "voice-journal", "ai-companion", "history", "profile", "settings", "help"];
      if (appViews.includes(view)) {
        navigate("assessment");
      }
    }
  }, [user, view, navigate]);

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="h-6 w-6 text-primary" />
          <p className="text-sm">Loading Sentinel…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
