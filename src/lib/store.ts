"use client";

import { create } from "zustand";
import type { Role, SafeUser } from "./types";

// All in-app "routes" are keys here. The SPA dispatcher in src/app/page.tsx
// renders the matching component. Auth & RBAC gate transitions on the client;
// the backend re-enforces everything on every call.
export type View =
  | "home" | "about" | "how-it-works" | "resources" | "support" | "contact"
  | "login" | "register" | "forgot-password" | "reset-password" | "verify-email"
  // authed
  | "dashboard" | "daily-log" | "voice-journal" | "ai-companion"
  | "assessment" | "history" | "profile" | "settings" | "help"
  // admin
  | "admin" | "admin-personnel" | "admin-person" | "admin-risk"
  | "admin-alerts" | "admin-analytics" | "admin-audit" | "admin-settings"
  | "privacy";

interface AppState {
  // routing
  view: View;
  params: Record<string, string>;
  navigate: (view: View, params?: Record<string, string>) => void;

  // auth
  user: SafeUser | null;
  setUser: (u: SafeUser | null) => void;
  loadingUser: boolean;
  setLoadingUser: (b: boolean) => void;

  // theme
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;

  // mobile nav
  mobileNavOpen: boolean;
  setMobileNavOpen: (b: boolean) => void;
}

export const useApp = create<AppState>((set, get) => ({
  view: "home",
  params: {},
  navigate: (view, params = {}) => {
    set({ view, params, mobileNavOpen: false });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  },

  user: null,
  setUser: (user) => set({ user }),
  loadingUser: true,
  setLoadingUser: (loadingUser) => set({ loadingUser }),

  theme: "light",
  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    set({ theme: next });
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
    }
  },
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  },

  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}));

// Convenience hook for role checks.
export function useRole(): Role | null {
  return useApp((s) => s.user?.role ?? null);
}
