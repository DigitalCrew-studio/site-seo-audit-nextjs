import type { NextConfig } from "next";
import { execSync } from "child_process";

// Ensure Playwright Chromium and its system dependencies are present
// before the production server starts.
try {
  execSync("npx playwright install chromium", { stdio: "pipe", timeout: 300000 });
  execSync("npx playwright install-deps chromium", { stdio: "pipe", timeout: 300000 });
} catch {
  // Ignore install errors during build; runtime handler will retry if needed.
}

const nextConfig: NextConfig = {};

export default nextConfig;
