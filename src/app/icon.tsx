import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const INK = "#1b1b19";
const PAPER = "#f6f5f1";

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: INK,
          color: PAPER,
          borderRadius: 7,
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="26" height="24" rx="4" />
          <rect
            x="7.5"
            y="8"
            width="6"
            height="4.5"
            rx="1"
            fill="currentColor"
            stroke="none"
          />
          <line x1="10.5" y1="12.5" x2="7.5" y2="17" />
          <line x1="10.5" y1="12.5" x2="14" y2="17" />
          <rect x="5.5" y="17" width="4.5" height="4" rx="1" />
          <rect x="12" y="17" width="4.5" height="4" rx="1" />
          <circle cx="23" cy="22" r="4.2" fill={INK} stroke="currentColor" />
          <line x1="26" y1="25" x2="28.5" y2="27.5" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
