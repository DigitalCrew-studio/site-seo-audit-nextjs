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
  poweredByHeader: false,
  // SEO/security baseline. No CSP here: Next renders inline styles and
  // inline scripts for the bootstrap, so a strict CSP would need careful
  // opt-in (nonces/hashes) — out of scope for this iteration.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
