import type { MandateSnapshot, PartyRow, QualifyingParty } from "./types";

export const BLOCK_PERCENT = 3.25;
export const KNESSET_SEATS = 120;

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Reproduce the user's mandate pipeline:
 * 1) Block = 3.25% of "קולות עד עתה"
 * 2) Keep lists with at least that many "קולות כשרים לרשימה"
 * 3) Kosher = sum of those list votes
 * 4) Electoral mandate = kosher / 120
 * 5) Exact seats = list votes / mandate; whole seats via largest remainders
 */
export function calculateMandates(input: {
  sourceUrl: string;
  publishedAsOf: string | null;
  fetchedAt: string;
  eligibleVoters: number | null;
  votesSoFar: number;
  stationsSoFar: number | null;
  validVotes: number;
  invalidVotes: number | null;
  parties: PartyRow[];
}): MandateSnapshot {
  const { votesSoFar, parties } = input;
  if (!Number.isFinite(votesSoFar) || votesSoFar <= 0) {
    throw new Error("Missing or invalid 'קולות עד עתה'");
  }
  if (!parties.length) {
    throw new Error("No party rows found");
  }

  const blockThresholdVotes = votesSoFar * (BLOCK_PERCENT / 100);
  const qualifyingRows = parties.filter((p) => p.votes >= blockThresholdVotes);
  const belowThreshold = parties.filter((p) => p.votes < blockThresholdVotes);
  const kosherVotes = qualifyingRows.reduce((sum, p) => sum + p.votes, 0);

  if (kosherVotes <= 0) {
    throw new Error("No parties crossed the block percentage");
  }

  const electoralMandate = kosherVotes / KNESSET_SEATS;

  const withExact: Omit<QualifyingParty, "seats" | "gotRemainderSeat">[] =
    qualifyingRows.map((p) => {
      const exactMandates = p.votes / electoralMandate;
      const seatsFloor = Math.floor(exactMandates);
      return {
        ...p,
        shareOfVotesSoFar: (p.votes / votesSoFar) * 100,
        exactMandates,
        remainder: exactMandates - seatsFloor,
      };
    });

  const baseSeats = withExact.reduce(
    (sum, p) => sum + Math.floor(p.exactMandates),
    0,
  );
  let seatsLeft = KNESSET_SEATS - baseSeats;

  const order = [...withExact]
    .map((p, index) => ({ p, index }))
    .sort((a, b) => {
      if (b.p.remainder !== a.p.remainder) return b.p.remainder - a.p.remainder;
      return b.p.votes - a.p.votes;
    });

  const remainderWinners = new Set<number>();
  for (const item of order) {
    if (seatsLeft <= 0) break;
    remainderWinners.add(item.index);
    seatsLeft -= 1;
  }

  const qualifying: QualifyingParty[] = withExact.map((p, index) => {
    const gotRemainderSeat = remainderWinners.has(index);
    return {
      ...p,
      shareOfVotesSoFar: round4(p.shareOfVotesSoFar),
      exactMandates: p.exactMandates,
      remainder: p.remainder,
      seats: Math.floor(p.exactMandates) + (gotRemainderSeat ? 1 : 0),
      gotRemainderSeat,
    };
  });

  return {
    sourceUrl: input.sourceUrl,
    publishedAsOf: input.publishedAsOf,
    fetchedAt: input.fetchedAt,
    eligibleVoters: input.eligibleVoters,
    votesSoFar,
    stationsSoFar: input.stationsSoFar,
    validVotes: input.validVotes,
    invalidVotes: input.invalidVotes,
    blockPercent: BLOCK_PERCENT,
    blockThresholdVotes,
    kosherVotes,
    electoralMandate,
    qualifying,
    belowThreshold,
    parties,
  };
}
