export type PartyRow = {
  name: string;
  letters: string;
  percentOfValid: number;
  votes: number;
};

export type QualifyingParty = PartyRow & {
  shareOfVotesSoFar: number;
  exactMandates: number;
  seats: number;
  remainder: number;
  gotRemainderSeat: boolean;
};

export type MandateSnapshot = {
  sourceUrl: string;
  publishedAsOf: string | null;
  fetchedAt: string;
  eligibleVoters: number | null;
  votesSoFar: number;
  stationsSoFar: number | null;
  validVotes: number;
  invalidVotes: number | null;
  blockPercent: number;
  blockThresholdVotes: number;
  kosherVotes: number;
  electoralMandate: number;
  qualifying: QualifyingParty[];
  belowThreshold: PartyRow[];
  parties: PartyRow[];
};

export type ResultsResponse =
  | { ok: true; data: MandateSnapshot }
  | { ok: false; error: string; fetchedAt: string };
