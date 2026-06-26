import { ImageResponse } from "next/og";
import { OgImage } from "@/app/_og/og-image";

export const runtime = "nodejs";
export const alt = "Seofriendly — AI-powered free SEO audit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(<OgImage />, { ...size });
}
