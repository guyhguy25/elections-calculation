#!/usr/bin/env node
/**
 * One-shot reproduction of the mandate calculation.
 * Usage: node scripts/calc-once.mjs
 */
const OFFICIAL =
  "https://votes26.bechirot.gov.il/nationalresults?lang=he";
const READER = `https://r.jina.ai/${OFFICIAL}`;

function toInt(raw) {
  const cleaned = String(raw)
    .replace(/[\u200e\u200f\u00a0]/g, "")
    .replace(/[^\d]/g, "");
  return cleaned ? Number(cleaned) : null;
}

function valueAfterLabel(text, label) {
  const re = new RegExp(`${label}\\s*\\n+\\s*([\\d,\\u200f\\u200e.\\s]+)`, "m");
  const m = text.match(re);
  return m ? toInt(m[1]) : null;
}

function parseParties(text) {
  const start = text.indexOf("| שם הרשימה");
  if (start < 0) throw new Error("party table not found");
  let end = text.indexOf("\n\nשם הרשימה", start);
  if (end < 0) end = text.length;
  const rows = [];
  for (const line of text.slice(start, end).split("\n")) {
    if (!line.startsWith("|") || line.includes("---") || line.includes("שם הרשימה")) {
      continue;
    }
    const parts = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((p) => p.trim());
    if (parts.length < 4) continue;
    const votes = toInt(parts[3]);
    if (votes == null) continue;
    rows.push({ name: parts[0], letters: parts[1], votes });
  }
  return rows;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "MandateCalcOnce/1.0" },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

async function main() {
  let text;
  try {
    text = await fetchText(OFFICIAL);
    if (!text.includes("קולות עד עתה")) throw new Error("missing label");
  } catch {
    text = await fetchText(READER);
  }

  const votesSoFar = valueAfterLabel(text, "קולות עד עתה");
  const validVotes = valueAfterLabel(text, "קולות כשרים עד עתה");
  const asOf = text.match(/תוצאות נכון ל-\s*([0-9/]+\s+[0-9:]+)/)?.[1] ?? null;
  const parties = parseParties(text);
  if (!votesSoFar) throw new Error("votesSoFar missing");

  const threshold = votesSoFar * 0.0325;
  const qualifying = parties.filter((p) => p.votes >= threshold);
  const kosher = qualifying.reduce((s, p) => s + p.votes, 0);
  const mandate = kosher / 120;

  const exact = qualifying.map((p) => {
    const m = p.votes / mandate;
    return { ...p, exact: m, rem: m - Math.floor(m), seats: Math.floor(m) };
  });
  let left = 120 - exact.reduce((s, p) => s + p.seats, 0);
  [...exact]
    .sort((a, b) => b.rem - a.rem || b.votes - a.votes)
    .forEach((p) => {
      if (left > 0) {
        p.seats += 1;
        p.up = true;
        left -= 1;
      }
    });

  console.log(`As of: ${asOf}`);
  console.log(`קולות עד עתה: ${votesSoFar}`);
  console.log(`קולות כשרים: ${validVotes}`);
  console.log(`Block 3.25%: ${threshold}`);
  console.log(`Kosher votes: ${kosher}`);
  console.log(`Electoral mandate: ${mandate}`);
  console.log("");
  for (const p of exact) {
    console.log(
      `${p.seats.toString().padStart(3)}  ${p.exact.toFixed(4).padStart(9)}  ${String(p.votes).padStart(9)}  ${p.letters}  ${p.name.slice(0, 40)}${p.up ? "  +rem" : ""}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
