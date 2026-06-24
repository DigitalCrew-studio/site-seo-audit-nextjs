import type OpenAI from "openai";

/**
 * Function-calling tools exposed to the model during an audit. Each maps to a
 * BrowserSession method in `src/lib/audit.ts`.
 */
export const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "visit_page",
      description:
        "Load a URL in a headless Chromium browser and return core SEO fields: status, finalUrl, title, meta description, H1s, canonical, robots meta, response time.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_raw_html",
      description:
        "Fetch the raw HTML of a URL without JavaScript rendering. Useful to compare SSR output with rendered DOM.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_rendered_html",
      description:
        "Return the browser-rendered HTML/DOM of the currently loaded page or a given URL.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_rendered_text",
      description:
        "Return the visible text content of the currently loaded page or a given URL.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "take_screenshot",
      description:
        "Take a viewport screenshot of the currently loaded page or a given URL and return it as a base64 JPEG. Use sparingly for visual/layout checks.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_internal_links",
      description:
        "Extract internal links from a URL. Returns total link count, unique internal link count, and a sample of up to 30 internal URLs.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_robots_and_sitemap",
      description:
        "Fetch /robots.txt and /sitemap.xml from the base origin of the provided URL.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
];
