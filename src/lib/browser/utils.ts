export const MAX_TEXT_LENGTH = 24000;
export const MAX_HTML_LENGTH = 32000;

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + `\n\n... [truncated from ${text.length} chars]`;
}
