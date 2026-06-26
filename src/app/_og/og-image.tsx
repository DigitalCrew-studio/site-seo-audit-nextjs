import { LogoMarkSvg } from "@/components/LogoMarkSvg";

const INK = "#1b1b19";
const PAPER = "#f6f5f1";
const MUTED = "#6f6e68";
const LINE = "#e3e1d9";
const ACCENT = "#b45309";

/**
 * Shared composition used by both `opengraph-image` and `twitter-image` —
 * identical layout, just different `alt` per route. Rendered via Satori
 * inside `ImageResponse`, so we inline all colours and rely on flex layout
 * (no CSS modules, no JS-only features).
 */
export function OgImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: PAPER,
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(27,27,25,0.05) 1px, transparent 0)",
        backgroundSize: "24px 24px",
        padding: "64px",
        fontFamily: "Inter, sans-serif",
        color: INK,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: INK,
              color: PAPER,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LogoMarkSvg size={36} title="Seofriendly" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Seofriendly
            </span>
            <span
              style={{
                fontSize: 16,
                color: MUTED,
                fontFamily: "monospace",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              seofrendly.ru
            </span>
          </div>
        </div>
        <div
          style={{
            fontSize: 16,
            color: MUTED,
            fontFamily: "monospace",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Free SEO audit
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 64,
          maxWidth: 980,
        }}
      >
        <span
          style={{
            fontSize: 18,
            color: ACCENT,
            fontFamily: "monospace",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Free · AI-powered · No signup
        </span>
        <span
          style={{
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: INK,
          }}
        >
          AI-powered free SEO audit
        </span>
        <span
          style={{
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: MUTED,
            marginTop: 4,
          }}
        >
          for any public website
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginTop: "auto",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontFamily: "monospace",
            fontSize: 18,
            color: INK,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                backgroundColor: INK,
              }}
            />
            <span>60+ technical checks</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                border: `2px solid ${INK}`,
              }}
            />
            <span>12 source modules</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                border: `2px solid ${ACCENT}`,
              }}
            />
            <span style={{ color: MUTED }}>
              browser-based · local-only history
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: 18,
              borderRadius: 14,
              border: `1px solid ${LINE}`,
              backgroundColor: "rgba(255,255,255,0.7)",
              fontFamily: "monospace",
              fontSize: 16,
              color: INK,
              minWidth: 320,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: MUTED }}>/</span>
              <span>200</span>
              <span style={{ color: "#15803d" }}>· ok</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: MUTED }}>/sitemap.xml</span>
              <span>200</span>
              <span style={{ color: "#15803d" }}>· 142 url</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: MUTED }}>/robots.txt</span>
              <span>200</span>
              <span style={{ color: "#15803d" }}>· ok</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: MUTED }}>/old-page</span>
              <span>404</span>
              <span style={{ color: ACCENT }}>· missing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
