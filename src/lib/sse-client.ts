import type {
  SSEError,
  SSEReport,
  SSEStatus,
  SSETool,
  SSEToolError,
} from "@/lib/types";

export type SSEHandlers = {
  onStatus?: (payload: SSEStatus) => void;
  onTool?: (payload: SSETool) => void;
  onToolError?: (payload: SSEToolError) => void;
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

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      const eventMatch = block.match(/^event: (.+)$/m);
      const dataMatch = block.match(/^data: (.+)$/m);
      if (!eventMatch || !dataMatch) continue;

      const event = eventMatch[1];
      const payload = JSON.parse(dataMatch[1]);

      switch (event) {
        case "status":
          handlers.onStatus?.(payload);
          break;
        case "tool":
          handlers.onTool?.(payload);
          break;
        case "tool_error":
          handlers.onToolError?.(payload);
          break;
        case "error":
          handlers.onError?.(payload);
          break;
        case "done":
          handlers.onDone?.(payload);
          break;
      }
    }
  }
}
