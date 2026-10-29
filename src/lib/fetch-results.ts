import { computeMandates } from "@/lib/calc";
import { parseOfficialResults } from "@/lib/parse";
import type { MandateSnapshot } from "@/lib/types";

const OFFICIAL_URL =
  "https://votes26.bechirot.gov.il/nationalresults?lang=he";
const JINA_READER = `https://r.jina.ai/${OFFICIAL_URL}`;

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "MandateTracker/1.0 (+local)",
      Accept: "text/html,text/plain,*/*",
    },
  });
  if (!res.ok) {
    throw new Error(`${url} -> ${res.status}`);
  }
  return res.text();
}

export async function loadMandateSnapshot(): Promise<MandateSnapshot> {
  let html = "";
  let usedFallback = false;

  try {
    html = await fetchText(OFFICIAL_URL);
    // Sanity: official page should mention Hebrew labels we parse.
    if (!html.includes("קולות עד עתה") && !html.includes("שם הרשימה")) {
      throw new Error("Official page missing expected labels");
    }
  } catch {
    html = await fetchText(JINA_READER);
    usedFallback = true;
  }

  const parsed = parseOfficialResults(html);
  const computed = computeMandates(parsed);

  return {
    ...computed,
    sourceUrl: OFFICIAL_URL,
    fetchedAt: new Date().toISOString(),
    usedFallback,
  };
}
