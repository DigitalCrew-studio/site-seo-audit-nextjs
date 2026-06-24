import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { loadSkillText } from "@/lib/skill";
import { BrowserSession } from "@/lib/playwright";
import { getEndpoint } from "@/lib/opencode";
import { TOOLS } from "@/lib/tools";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import type { Emitter } from "@/lib/sse";
import type { AuditLanguage, OpenCodeGroup } from "@/lib/types";

const MAX_ITERATIONS = 16;
const MAX_TOKENS = 16000;
const TOOL_TIMEOUT_MS = 25000;

type RunAuditParams = {
  apiKey: string;
  modelId: string;
  group: OpenCodeGroup;
  url: string;
  language: AuditLanguage;
  emit: Emitter;
};

type ToolError = { name: string; args: Record<string, unknown>; error: string };

/**
 * Executes a single browser tool with a hard timeout, emitting progress and
 * error events. Always resolves to a JSON string suitable for a tool message.
 */
async function executeTool(
  name: string,
  args: Record<string, unknown>,
  browser: BrowserSession,
  emit: Emitter,
  toolErrors: ToolError[]
): Promise<string> {
  emit("tool", { name, args });
  try {
    const run = async () => {
      switch (name) {
        case "visit_page":
          return await browser.visit(String(args.url));
        case "fetch_raw_html":
          return await browser.fetchRawHtml(String(args.url));
        case "get_rendered_html":
          return await browser.getRenderedHtml(args.url ? String(args.url) : undefined);
        case "get_rendered_text":
          return await browser.getRenderedText(args.url ? String(args.url) : undefined);
        case "take_screenshot":
          return await browser.takeScreenshot(args.url ? String(args.url) : undefined);
        case "list_internal_links":
          return await browser.internalLinks(String(args.url));
        case "check_robots_and_sitemap":
          return await browser.fetchRobotsAndSitemap(String(args.url));
        default:
          return { error: `Unknown tool: ${name}` };
      }
    };

    const result = await Promise.race([
      run(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Tool ${name} timed out`)), TOOL_TIMEOUT_MS)
      ),
    ]);
    return JSON.stringify(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    toolErrors.push({ name, args, error: msg });
    emit("tool_error", { name, args, error: msg });
    return JSON.stringify({ error: msg });
  }
}

/**
 * Runs the full audit agent loop: load skill -> build prompts -> iteratively
 * call the model, executing any tool calls against the browser, until a final
 * report is produced or the iteration cap is reached. Progress is streamed via
 * the provided emitter. Owns the browser lifecycle.
 */
export async function runAudit({
  apiKey,
  modelId,
  group,
  url,
  language,
  emit,
}: RunAuditParams): Promise<void> {
  const browser = await new BrowserSession().start();
  const toolErrors: ToolError[] = [];

  try {
    emit("status", { message: "Loading SEO audit skill..." });
    const skillText = await loadSkillText();

    emit("status", { message: "Starting headless Chromium..." });

    const messages: ChatCompletionMessageParam[] = [
      buildSystemPrompt(skillText, language),
      buildUserPrompt(url, language),
    ];

    const openai = new OpenAI({
      apiKey,
      baseURL: getEndpoint(group),
      timeout: 120000,
    });

    let iterations = 0;
    while (iterations < MAX_ITERATIONS) {
      iterations += 1;
      emit("status", { message: `Thinking step ${iterations}...` });

      const completion = await openai.chat.completions.create({
        model: modelId,
        messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: MAX_TOKENS,
      });

      const choice = completion.choices[0];
      if (!choice) {
        emit("error", { message: "No response from model" });
        break;
      }

      // The model wants to call one or more tools.
      if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
        messages.push(choice.message);
        emit("status", {
          message: `Executing ${choice.message.tool_calls.length} tool call(s)...`,
        });
        const toolResults = await Promise.all(
          choice.message.tool_calls.map(async (toolCall) => {
            if (toolCall.type !== "function") {
              return {
                role: "tool" as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: "Unsupported tool call type" }),
              };
            }
            const args = JSON.parse(
              toolCall.function.arguments || "{}"
            ) as Record<string, unknown>;
            const content = await executeTool(
              toolCall.function.name,
              args,
              browser,
              emit,
              toolErrors
            );
            return { role: "tool" as const, tool_call_id: toolCall.id, content };
          })
        );
        messages.push(...toolResults);
        continue;
      }

      // The model produced the final report.
      if (choice.message.content) {
        emit("status", { message: "Generating final report..." });
        emit("done", { report: choice.message.content });
        break;
      }

      emit("error", { message: "Empty response from model" });
      break;
    }

    if (iterations >= MAX_ITERATIONS) {
      emit("error", {
        message: "Stopped after maximum number of tool-call rounds.",
      });
    }

    if (toolErrors.length > 0) {
      emit("status", {
        message: `Audit completed with ${toolErrors.length} tool error(s). See details in the report.`,
      });
    }
  } finally {
    await browser.close();
  }
}
