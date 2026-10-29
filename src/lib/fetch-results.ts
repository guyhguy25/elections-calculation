import { calculateMandates } from "./calc";
import { parseOfficialMarkdown } from "./parse";
import type { MandateSnapshot } from "./types";

export const OFFICIAL_URL =
  "https://votes26.bechirot.gov.il/nationalresults?lang=he";

const READER_URL = `https://r.jina.ai/${OFFICIAL_URL}`;

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ElectionMandateTracker/1.0; +local)",
      Accept: "text/html,text/plain,text/markdown,*/*",
    },
    cache: "no-store",
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
  let sourceUrl = OFFICIAL_URL;

  try {
    text = await fetchText(OFFICIAL_URL);
    if (!looksLikeResults(text)) {
      throw new Error("Official HTML did not include the results table");
    }
  } catch {
    sourceUrl = OFFICIAL_URL;
    text = await fetchText(READER_URL);
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
