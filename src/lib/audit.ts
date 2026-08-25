import { createHmac } from "crypto";
import { db } from "./db";
import { headers } from "next/headers";
import { AUDIT_ACTIONS } from "./constants";

// Re-export so server code can `import { AUDIT_ACTIONS } from "@/lib/audit"`.
// Client code must import AUDIT_ACTIONS from "@/lib/constants" instead, since
// this module uses next/headers (server-only).
export { AUDIT_ACTIONS };

// Minimal but real audit logging. ipHash is a salted hash — we never log raw IP,
// and we never log passwords, API keys, or raw sensitive journal/conversation
// content. Metadata is curated per-action.

const IP_SALT = process.env.AUDIT_IP_SALT || "sentinel-dev-salt-change-me";

function hashIp(ip: string): string {
  return createHmac("sha256", IP_SALT).update(ip).digest("hex").slice(0, 24);
}

export async function logAudit(input: {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? undefined;
    await db.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        ipHash: ip ? hashIp(ip) : null,
        metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (e) {
    // Audit must never break the request flow.
    console.error("[audit] failed to write log:", e);
  }
}

// (AUDIT_ACTIONS lives in ./constants so client components can import it
//  without pulling in this server-only module.)
