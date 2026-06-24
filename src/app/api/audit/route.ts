import { NextRequest } from "next/server";
import { createEmitter, SSE_HEADERS } from "@/lib/sse";
import { runAudit } from "@/lib/audit";
import { normalizeUrl } from "@/lib/prompts";
import type { AuditLanguage, OpenCodeGroup } from "@/lib/types";

const HEARTBEAT_MS = 15000;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const apiKey = String(body.apiKey || "").trim();
  const modelId = String(body.modelId || "").trim();
  const group = String(body.group || "go") as OpenCodeGroup;
  const url = normalizeUrl(String(body.url || ""));
  const language = String(body.language || "en").toLowerCase() as AuditLanguage;

  if (!apiKey || !modelId || !url) {
    return new Response(
      JSON.stringify({ error: "apiKey, modelId, and url are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const emit = createEmitter(controller);

      // Heartbeat keeps reverse proxies / load balancers from closing an idle SSE.
      const heartbeat = setInterval(() => {
        emit("status", { message: "Still working..." });
      }, HEARTBEAT_MS);

      try {
        await runAudit({ apiKey, modelId, group, url, language, emit });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        emit("error", { message });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
