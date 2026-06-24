import type {
  SSEDebug,
  SSEError,
  SSEReport,
  SSEStatus,
  SSETool,
  SSEToolEnd,
  SSEToolError,
} from "@/lib/types";

const MAX_SSE_BUFFER_CHARS = 1_000_000;

export type SSEHandlers = {
  onStatus?: (payload: SSEStatus) => void;
  onTool?: (payload: SSETool) => void;
  onToolError?: (payload: SSEToolError) => void;
  onToolEnd?: (payload: SSEToolEnd) => void;
  onDebug?: (payload: SSEDebug) => void;
  onError?: (payload: SSEError) => void;
  onDone?: (payload: SSEReport) => void;
};

/**
 * Reads an SSE response body and dispatches parsed events to handlers.
 * Resolves when the stream ends.
 */
export async function consumeSSE(
  body: ReadableStream<Uint8Array>,
  handlers: SSEHandlers
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    if (buffer.length > MAX_SSE_BUFFER_CHARS) {
      throw new Error("SSE stream buffer exceeded 1000000 characters");
    }

    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      const eventMatch = block.match(/^event: (.+)$/m);
      const dataMatch = block.match(/^data: (.+)$/m);
      if (!eventMatch || !dataMatch) continue;

      const event = eventMatch[1];
      let payload: unknown;
      try {
        payload = JSON.parse(dataMatch[1]);
      } catch {
        handlers.onDebug?.({
          message: "Skipped malformed SSE event payload",
          data: { event },
        });
        continue;
      }

      try {
        switch (event) {
          case "status":
            handlers.onStatus?.(payload as SSEStatus);
            break;
          case "tool":
            handlers.onTool?.(payload as SSETool);
            break;
          case "tool_error":
            handlers.onToolError?.(payload as SSEToolError);
            break;
          case "tool_end":
            handlers.onToolEnd?.(payload as SSEToolEnd);
            break;
          case "debug":
            handlers.onDebug?.(payload as SSEDebug);
            break;
          case "error":
            handlers.onError?.(payload as SSEError);
            break;
          case "done":
            handlers.onDone?.(payload as SSEReport);
            break;
        }
      } catch (err) {
        handlers.onDebug?.({
          message: "SSE event handler failed",
          data: { event, error: err instanceof Error ? err.message : String(err) },
        });
      }
    }
  }
}
