import { calculateMandates } from "./calc";
import { parseOfficialMarkdown } from "./parse";
import type { MandateSnapshot } from "./types";

export const OFFICIAL_URL =
  "https://votes26.bechirot.gov.il/nationalresults?lang=he";

function readerUrl(): string {
  // Jina caches by URL; bust it so refreshes pick up new CEC counts.
  return `https://r.jina.ai/${OFFICIAL_URL}&_=${Date.now()}`;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ElectionMandateTracker/1.0; +local)",
      Accept: "text/html,text/plain,text/markdown,*/*",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}) from ${url}`);
  }
  return res.text();
}

function looksLikeResults(text: string): boolean {
  return (
    text.includes("קולות עד עתה") &&
    text.includes("קולות כשרים לרשימה") &&
    (text.includes("| שם הרשימה") || text.includes("שם הרשימה"))
  );
}

export async function loadMandateSnapshot(): Promise<MandateSnapshot> {
  const fetchedAt = new Date().toISOString();
  let text = "";
  const sourceUrl = OFFICIAL_URL;

  try {
    text = await fetchText(OFFICIAL_URL);
    if (!looksLikeResults(text)) {
      throw new Error("Official HTML did not include the results table");
    }
  } catch {
    // Official site is often WAF-blocked from server IPs; reader is the fallback.
    text = await fetchText(readerUrl());
    if (!looksLikeResults(text)) {
      throw new Error(
        "Could not read national results from the official source or reader fallback",
      );
    }
  }

  const parsed = parseOfficialMarkdown(text);
  return calculateMandates({
    sourceUrl,
    fetchedAt,
    ...parsed,
  });
}
