"use client";

import { ArrowLeft } from "lucide-react";
import { useApp } from "@/lib/store";
import { translate } from "@/lib/i18n";

export function BackButton({ fallback = "home", alwaysFallback = false }: { fallback?: "home" | "dashboard" | "admin"; alwaysFallback?: boolean }) {
  const language = useApp((state) => state.language);
  const navigate = useApp((state) => state.navigate);

  function goBack() {
    if (alwaysFallback) navigate(fallback);
    else if (window.history.length > 1) window.history.back();
    else navigate(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={translate("Go back", language)}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-current/15 px-3 text-sm font-medium transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span>{translate("Back", language)}</span>
    </button>
  );
}
