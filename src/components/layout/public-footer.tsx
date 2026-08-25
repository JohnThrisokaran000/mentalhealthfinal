"use client";

import { Logo } from "@/components/shared/logo";
import { useApp } from "@/lib/store";
import { ShieldCheck, Lock, FileText } from "lucide-react";

export function PublicFooter() {
  const navigate = useApp((s) => s.navigate);
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A confidential, AI-assisted wellbeing and early-support platform for armed forces and uniformed-service personnel. Not a substitute for professional care.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Encrypted at rest</span>
              <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> RBAC + audit logging</span>
              <span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Consent-tracked</span>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><button className="text-muted-foreground hover:text-foreground" onClick={() => navigate("about")}>About</button></li>
              <li><button className="text-muted-foreground hover:text-foreground" onClick={() => navigate("how-it-works")}>How It Works</button></li>
              <li><button className="text-muted-foreground hover:text-foreground" onClick={() => navigate("resources")}>Resources</button></li>
              <li><button className="text-muted-foreground hover:text-foreground" onClick={() => navigate("support")}>Support</button></li>
              <li><button className="text-muted-foreground hover:text-foreground" onClick={() => navigate("contact")}>Contact</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Account</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><button className="text-muted-foreground hover:text-foreground" onClick={() => navigate("login")}>Login</button></li>
              <li><button className="text-muted-foreground hover:text-foreground" onClick={() => navigate("register")}>Create account</button></li>
              <li><button className="text-muted-foreground hover:text-foreground" onClick={() => navigate("privacy")}>Privacy</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Sentinel Wellbeing Platform. Development build — fictional data.</p>
          <p className="italic">If you are in immediate danger, contact your local emergency services.</p>
        </div>
      </div>
    </footer>
  );
}
