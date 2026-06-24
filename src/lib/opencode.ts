export type OpenCodeGroup = "go" | "zen";

export function getEndpoint(group: OpenCodeGroup) {
  return group === "go"
    ? "https://opencode.ai/zen/go/v1"
    : "https://opencode.ai/zen/v1";
}

export function getChatCompletionsUrl(group: OpenCodeGroup) {
  return `${getEndpoint(group)}/chat/completions`;
}

export function getModelsUrl(group: OpenCodeGroup) {
  return `${getEndpoint(group)}/models`;
}

export const FALLBACK_MODELS: Record<
  OpenCodeGroup,
  { id: string; name: string }[]
> = {
  go: [
    { id: "glm-5.2", name: "GLM 5.2" },
    { id: "glm-5.1", name: "GLM 5.1" },
    { id: "kimi-k2.7-code", name: "Kimi K2.7 Code" },
    { id: "kimi-k2.6", name: "Kimi K2.6" },
    { id: "kimi-k2.5", name: "Kimi K2.5" },
    { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro" },
    { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash" },
    { id: "mimo-v2.5", name: "MiMo V2.5" },
    { id: "mimo-v2-pro", name: "MiMo V2.5 Pro" },
  ],
  zen: [
    { id: "kimi-k2.5-free", name: "Kimi K2.5 Free" },
    { id: "qwen3-coder-480b", name: "Qwen 3 Coder 480B" },
  ],
};
