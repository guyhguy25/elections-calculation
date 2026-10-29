const PREV_KEY = "mandate-tracker:previous-seats:v1";
const TIP_KEY = "mandate-tracker:seat-tips:v1";

export type SeatSnapshotMemory = {
  publishedAsOf: string | null;
  votesSoFar: number;
  seatsByLetters: Record<string, number>;
};

export type SeatDelta = {
  letters: string;
  previous: number;
  current: number;
  delta: number;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function readPreviousSeats(): SeatSnapshotMemory | null {
  return readJson<SeatSnapshotMemory>(PREV_KEY);
}

export function writePreviousSeats(memory: SeatSnapshotMemory): void {
  writeJson(PREV_KEY, memory);
}

export function readStickyTips(): Record<string, SeatDelta> {
  return readJson<Record<string, SeatDelta>>(TIP_KEY) ?? {};
}

export function writeStickyTips(tips: Record<string, SeatDelta>): void {
  writeJson(TIP_KEY, tips);
}

export function seatMapFromQualifying(
  qualifying: { letters: string; seats: number }[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const party of qualifying) {
    map[party.letters] = party.seats;
  }
  return map;
}

export function computeSeatDeltas(
  currentSeats: Record<string, number>,
  previous: SeatSnapshotMemory | null,
): Record<string, SeatDelta> {
  if (!previous) return {};

  const out: Record<string, SeatDelta> = {};
  for (const [letters, current] of Object.entries(currentSeats)) {
    const prev = previous.seatsByLetters[letters] ?? 0;
    const delta = current - prev;
    if (delta === 0) continue;
    out[letters] = {
      letters,
      previous: prev,
      current,
      delta,
    };
  }
  return out;
}

/**
 * Detect fresh seat moves vs the last remembered snapshot.
 * Keep showing the last tips until a newer move replaces them.
 */
export function resolveSeatTips(input: {
  publishedAsOf: string | null;
  votesSoFar: number;
  currentSeats: Record<string, number>;
}): Record<string, SeatDelta> {
  const previous = readPreviousSeats();
  const fresh = computeSeatDeltas(input.currentSeats, previous);

  writePreviousSeats({
    publishedAsOf: input.publishedAsOf,
    votesSoFar: input.votesSoFar,
    seatsByLetters: input.currentSeats,
  });

  if (Object.keys(fresh).length > 0) {
    writeStickyTips(fresh);
    return fresh;
  }

  const sticky = readStickyTips();
  const stillRelevant: Record<string, SeatDelta> = {};
  for (const [letters, tip] of Object.entries(sticky)) {
    if (input.currentSeats[letters] === tip.current) {
      stillRelevant[letters] = tip;
    }
  }
  writeStickyTips(stillRelevant);
  return stillRelevant;
}
