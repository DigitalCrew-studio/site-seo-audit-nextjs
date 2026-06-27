import { NextResponse } from "next/server";
import { getServerApiKeys, pickRandomApiKey } from "@/lib/server-keys";
import { fetchFreeZenModelIds } from "@/lib/zen-models";

/**
 * Server-side readiness check. It intentionally exposes no infrastructure
 * details.
 */
export async function GET() {
  const keys = getServerApiKeys();
  if (keys.length === 0) {
    return NextResponse.json(
      { available: false },
      { status: 503 }
    );
  }
  const apiKey = pickRandomApiKey(keys);
  if (!apiKey) {
    return NextResponse.json(
      { available: false },
      { status: 503 }
    );
  }
  try {
    const modelIds = await fetchFreeZenModelIds(apiKey);
    return NextResponse.json({ available: modelIds.length > 0 });
  } catch (err) {
    console.error("Processing readiness check failed", err);
    return NextResponse.json({ available: false }, { status: 502 });
  }
}
