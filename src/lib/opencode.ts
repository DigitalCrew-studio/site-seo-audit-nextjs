export type OpenCodeGroup = "zen";

export function getEndpoint(group: OpenCodeGroup = "zen") {
  return "https://opencode.ai/zen/v1";
}

export function getChatCompletionsUrl(group: OpenCodeGroup = "zen") {
  return `${getEndpoint(group)}/chat/completions`;
}

export function getModelsUrl(group: OpenCodeGroup = "zen") {
  return `${getEndpoint(group)}/models`;
}
