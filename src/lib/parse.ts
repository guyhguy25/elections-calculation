import type { PartyRow } from "./types";

function toInt(raw: string): number | null {
  const cleaned = raw
    .replace(/[\u200e\u200f\u00a0]/g, "")
    .replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toPercent(raw: string): number | null {
  const cleaned = raw
    .replace(/[\u200e\u200f]/g, "")
    .replace("%", "")
    .replace(",", ".")
    .trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function valueAfterLabel(text: string, label: string): number | null {
  const re = new RegExp(
    `${label}\\s*\\n+\\s*([\\d,\\u200f\\u200e.\\s]+)`,
    "m",
  );
  const m = text.match(re);
  if (!m) return null;
  return toInt(m[1]);
}

export function parsePublishedAsOf(text: string): string | null {
  const m = text.match(/תוצאות נכון ל-\s*([0-9/]+\s+[0-9:]+)/);
  return m?.[1]?.trim() ?? null;
}

export function parseSummary(text: string): {
  eligibleVoters: number | null;
  votesSoFar: number | null;
  stationsSoFar: number | null;
  validVotes: number | null;
  invalidVotes: number | null;
  publishedAsOf: string | null;
} {
  return {
    eligibleVoters: valueAfterLabel(text, "מספר בעלי זכות בחירה"),
    votesSoFar: valueAfterLabel(text, "קולות עד עתה"),
    stationsSoFar: valueAfterLabel(text, "קלפיות עד עתה"),
    validVotes: valueAfterLabel(text, "קולות כשרים עד עתה"),
    invalidVotes: valueAfterLabel(text, "קולות פסולים עד עתה"),
    publishedAsOf: parsePublishedAsOf(text),
  };
}

export function parsePartyTable(text: string): PartyRow[] {
  const tableStart = text.indexOf("| שם הרשימה");
  if (tableStart < 0) {
    return parsePartyBlocks(text);
  }

  let tableEnd = text.indexOf("\n\nשם הרשימה", tableStart);
  if (tableEnd < 0) tableEnd = text.length;
  const table = text.slice(tableStart, tableEnd);
  const rows: PartyRow[] = [];

  for (const line of table.split("\n")) {
    if (!line.startsWith("|")) continue;
    if (line.includes("---") || line.includes("שם הרשימה")) continue;
    const parts = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((p) => p.trim());
    if (parts.length < 4) continue;
    const [name, letters, percentRaw, votesRaw] = parts;
    const votes = toInt(votesRaw);
    const percentOfValid = toPercent(percentRaw);
    if (!name || votes === null || percentOfValid === null) continue;
    rows.push({ name, letters, percentOfValid, votes });
  }

  return rows;
}

function parsePartyBlocks(text: string): PartyRow[] {
  const rows: PartyRow[] = [];
  const re =
    /שם הרשימה\s*\n+(.+?)\n+אותיות הרשימה\s*\n+(.+?)\n+אחוז מסך הקולות הכשרים\s*\n+([0-9.]+%)\s*\n+קולות כשרים לרשימה\s*\n+([\d,\u200f\u200e]+)/g;

  for (const m of text.matchAll(re)) {
    const votes = toInt(m[4]);
    const percentOfValid = toPercent(m[3]);
    if (votes === null || percentOfValid === null) continue;
    rows.push({
      name: m[1].trim(),
      letters: m[2].trim(),
      percentOfValid,
      votes,
    });
  }
  return rows;
}

export function parseOfficialMarkdown(text: string): {
  eligibleVoters: number | null;
  votesSoFar: number;
  stationsSoFar: number | null;
  validVotes: number;
  invalidVotes: number | null;
  publishedAsOf: string | null;
  parties: PartyRow[];
} {
  const summary = parseSummary(text);
  const parties = parsePartyTable(text);

  if (summary.votesSoFar === null) {
    throw new Error("Could not find 'קולות עד עתה' on the official page");
  }
  if (summary.validVotes === null) {
    throw new Error("Could not find 'קולות כשרים עד עתה' on the official page");
  }
  if (!parties.length) {
    throw new Error("Could not parse party vote rows");
  }

  return {
    eligibleVoters: summary.eligibleVoters,
    votesSoFar: summary.votesSoFar,
    stationsSoFar: summary.stationsSoFar,
    validVotes: summary.validVotes,
    invalidVotes: summary.invalidVotes,
    publishedAsOf: summary.publishedAsOf,
    parties,
  };
}
