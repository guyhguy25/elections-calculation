import { NextResponse } from "next/server";
import { loadMandateSnapshot } from "@/lib/fetch-results";
import type { ResultsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const fetchedAt = new Date().toISOString();
  try {
    const data = await loadMandateSnapshot();
    const body: ResultsResponse = { ok: true, data };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load election results";
    const body: ResultsResponse = { ok: false, error: message, fetchedAt };
    return NextResponse.json(body, {
      status: 502,
      headers: {
        "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    });
  }
}
