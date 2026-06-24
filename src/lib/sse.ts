import type { ReadableStreamDefaultController } from "stream/web";

/**
 * A function that pushes a Server-Sent-Event to the client stream.
 */
export type Emitter = (event: string, data: unknown) => void;

/**
 * Creates an emitter bound to a ReadableStream controller. All errors are
 * swallowed because the stream may have been closed by the client mid-flight.
 */
export function createEmitter(controller: ReadableStreamDefaultController): Emitter {
  const encoder = new TextEncoder();
  return (event: string, data: unknown) => {
    try {
      controller.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      );
    } catch {
      // Stream may already be closed; safe to ignore.
    }
  };
}

/**
 * Headers shared by every SSE response.
 */
export const SSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};
