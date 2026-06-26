import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // `lighthouse` (and its ESM/CJS-hybrid transitive deps such as
  // `@paulirish/trace_engine`) is only required at runtime for the optional
  // `run_lighthouse` tool. Marking it external avoids Turbopack trying to
  // bundle it and keeps the build green even when the package is absent.
  serverExternalPackages: ["lighthouse", "chrome-launcher"],
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
};

export default nextConfig;
