import { NextRequest, NextResponse } from "next/server";
import { getModelsUrl, FALLBACK_MODELS } from "@/lib/opencode";
import type { ModelInfo, OpenCodeGroup } from "@/lib/types";

const GROUPS: OpenCodeGroup[] = ["go", "zen"];

/** Fetch the live model list for a group, falling back to a static list. */
async function fetchModels(
  group: OpenCodeGroup,
  apiKey: string
): Promise<ModelInfo[]> {
  const url = getModelsUrl(group);
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : [];
    return list
      .map((m: { id?: string; name?: string }): ModelInfo => ({
        id: m.id || "",
        name: m.name || m.id || "",
      }))
      .filter((m: ModelInfo) => m.id)
      .sort((a: ModelInfo, b: ModelInfo) => a.name.localeCompare(b.name));
  } catch {
    return FALLBACK_MODELS[group];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = String(body.apiKey || "").trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const [go, zen] = await Promise.all(
      GROUPS.map((g) => fetchModels(g, apiKey))
    );

    return NextResponse.json({ go, zen });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
