import type { Browser, Page } from "playwright";
import type { Response as PWResponse } from "playwright";

export type BrowserLogLevel = "status" | "debug" | "error";

export type BrowserLogFn = (
  level: BrowserLogLevel,
  message: string,
  data?: Record<string, unknown>
) => void;

export type BrowserToolContext = {
  getPage: () => Page;
  goto: (url: string) => Promise<PWResponse | null>;
  getBrowser?: () => Browser;
  log?: BrowserLogFn;
};
