"use client";

import {
  LayoutDashboard, Users, ShieldAlert, BellRing, BarChart3,
  ScrollText, Settings, LogOut, Menu, Sun, Moon, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useApp } from "@/lib/store";
import { ADMIN_NAV, ROLE_LABELS } from "@/lib/constants";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { View } from "@/lib/store";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, ShieldAlert, BellRing, BarChart3, ScrollText, Settings,
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, view, navigate, theme, toggleTheme, mobileNavOpen, setMobileNavOpen } = useApp();

  const Sidebar = (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <button onClick={() => navigate("admin")}>
          <span className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg shadow-sm" style={{ background: "oklch(0.42 0.05 178)" }}>
              <ShieldAlert className="h-4 w-4 text-white" />
            </span>
            <span className="font-semibold tracking-tight text-sidebar-foreground">Sentinel <span className="text-primary">Admin</span></span>
          </span>
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto calm-scroll px-3 py-4">
        {ADMIN_NAV.map((item) => {
          const Icon = ICONS[item.icon ?? ""] ?? LayoutDashboard;
          const activeView = view === item.key || (view === "admin-person" && item.key === "admin-personnel");
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key as View)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                activeView ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button onClick={() => navigate("dashboard")} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold">
            {(user?.name?.[0] ?? "A").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user ? ROLE_LABELS[user.role] : ""}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <Button
          variant="ghost" size="sm" className="mt-1 w-full justify-start text-muted-foreground"
          onClick={async () => { await api.post("/api/auth/logout"); useApp.getState().setUser(null); useApp.getState().navigate("home"); }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
        {Sidebar}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">{Sidebar}</SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold text-foreground">{ADMIN_NAV.find((n) => n.key === view)?.label ?? "Admin"}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
