export type PartyVotes = {
  name: string;
  letters: string;
  votes: number;
};

export type PartyMandate = PartyVotes & {
  exact: number;
  remainder: number;
  seats: number;
  gotRemainderSeat: boolean;
  seatDelta: number | null;
};

export type MandateSnapshot = {
  asOf: string | null;
  votesSoFar: number;
  validVotes: number | null;
  threshold: number;
  kosherVotes: number;
  electoralMandate: number;
  parties: PartyMandate[];
  sourceUrl: string;
  fetchedAt: string;
  usedFallback: boolean;
};

export type ResultsResponse =
  | { ok: true; data: MandateSnapshot }
  | { ok: false; error: string; fetchedAt: string };
