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

const VIEW_PATHS: Record<View, string> = {
  home: "/", about: "/about", "how-it-works": "/how-it-works", resources: "/resources", support: "/support", contact: "/contact",
  login: "/login", register: "/register", "forgot-password": "/forgot-password", "reset-password": "/reset-password", "verify-email": "/verify-email", privacy: "/privacy",
  dashboard: "/dashboard", "daily-log": "/daily-log", "voice-journal": "/voice-journal", "ai-companion": "/ai-companion", assessment: "/assessment", history: "/history", profile: "/profile", settings: "/settings", help: "/help",
  admin: "/admin", "admin-personnel": "/admin/personnel", "admin-person": "/admin/personnel", "admin-risk": "/admin/risk-monitoring", "admin-alerts": "/admin/alerts", "admin-analytics": "/admin/analytics", "admin-audit": "/admin/audit-logs", "admin-settings": "/admin/settings",
};

export function pathForView(view: View, params: Record<string, string> = {}): string {
  if (view === "admin-person" && params.id) return `/admin/personnel/${encodeURIComponent(params.id)}`;
  return VIEW_PATHS[view];
}

export function viewFromPath(pathname: string): { view: View; params: Record<string, string> } {
  const path = pathname.replace(/\/+$/, "") || "/";
  const personnel = path.match(/^\/admin\/personnel\/([^/]+)$/);
  if (personnel) return { view: "admin-person", params: { id: decodeURIComponent(personnel[1]) } };
  const direct = (Object.entries(VIEW_PATHS).find(([, value]) => value === path)?.[0] ?? "home") as View;
  return { view: direct, params: {} };
}

interface AppState {
  language: "en" | "hi";
  setLanguage: (language: "en" | "hi") => void;

  // routing
  view: View;
  params: Record<string, string>;
  navigate: (view: View, params?: Record<string, string>, updateUrl?: boolean) => void;

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
  language: "en",
  setLanguage: (language) => {
    set({ language });
    if (typeof window !== "undefined") localStorage.setItem("sentinel:language", language);
  },

  // Start deterministically for SSR; page.tsx synchronises the real location after mount.
  view: "home",
  params: {},
  navigate: (view, params = {}, updateUrl = true) => {
    set({ view, params, mobileNavOpen: false });
    if (typeof window !== "undefined") {
      if (updateUrl && window.location.pathname !== pathForView(view, params)) window.history.pushState({}, "", pathForView(view, params));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
