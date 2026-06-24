import { NextRequest } from "next/server";
import { createEmitter, createKeepAlive, SSE_HEADERS } from "@/lib/sse";
import { runAudit } from "@/lib/audit";
import { normalizeUrl } from "@/lib/prompts";
import type { AuditLanguage, OpenCodeGroup } from "@/lib/types";

const HEARTBEAT_MS = 15000;
const MAX_REQUEST_BYTES = 10_000;

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const apiKey = String(body.apiKey || "").trim();
  const modelId = String(body.modelId || "").trim();
  const group = String(body.group || "go") as OpenCodeGroup;
  const url = normalizeUrl(String(body.url || ""));
  const language = String(body.language || "en").toLowerCase() as AuditLanguage;
  // Informational only. The server always emits the same structured events
  // (status/tool/tool_error/tool_end/debug/error/done) so a client can switch
  // its display mode at any time without round-tripping.
  const debugMode = Boolean(body.debugMode);

  if (!apiKey || !modelId || !url) {
    return new Response(
      JSON.stringify({ error: "apiKey, modelId, and url are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const emit = createEmitter(controller);
      const keepAlive = createKeepAlive(controller);
      let lastPhase = "init";
      emit("debug", {
        message: "Audit request accepted",
        data: { debugMode, group, language },
      });

      // Heartbeat keeps reverse proxies / load balancers from closing an idle
      // SSE. The audit loop emits its own "status" events with current phase
      // during active work; the heartbeat is intentionally quiet and only
      // fires after long idle stretches as a debug-only nudge.
      const heartbeat = setInterval(() => {
        keepAlive();
        emit("debug", {
          message: "SSE heartbeat (still connected)",
          data: { phase: lastPhase },
        });
      }, HEARTBEAT_MS);

      try {
        await runAudit({
          apiKey,
          modelId,
          group,
          url,
          language,
          emit,
          signal: req.signal,
          onPhase: (phase) => {
            lastPhase = phase;
          },
        });
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
