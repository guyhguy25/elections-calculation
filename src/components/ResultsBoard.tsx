"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  formatDecimal,
  formatFetchedAt,
  formatInt,
  formatPercent,
} from "@/lib/format";
import {
  resolveSeatTips,
  seatMapFromQualifying,
  type SeatDelta,
} from "@/lib/seat-history";
import type { MandateSnapshot, ResultsResponse } from "@/lib/types";

const REFRESH_MS = 90_000;

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string; fetchedAt: string }
  | {
      status: "ready";
      data: MandateSnapshot;
      seatDeltas: Record<string, SeatDelta>;
    };

export function ResultsBoard() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [secondsLeft, setSecondsLeft] = useState(Math.round(REFRESH_MS / 1000));
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/results", { cache: "no-store" });
      const json = (await res.json()) as ResultsResponse;
      if (!json.ok) {
        setState({
          status: "error",
          message: json.error,
          fetchedAt: json.fetchedAt,
        });
        return;
      }

      const currentSeats = seatMapFromQualifying(json.data.qualifying);
      const seatDeltas = resolveSeatTips({
        publishedAsOf: json.data.publishedAsOf,
        votesSoFar: json.data.votesSoFar,
        currentSeats,
      });

      startTransition(() => {
        setState({ status: "ready", data: json.data, seatDeltas });
        setSecondsLeft(Math.round(REFRESH_MS / 1000));
      });
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "Network error while refreshing",
        fetchedAt: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          void load();
          return Math.round(REFRESH_MS / 1000);
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [load]);

  return (
    <div className="board">
      <header className="board-header">
        <div className="board-header-top">
          <div>
            <p className="eyebrow">בחירות לכנסת ה־26</p>
            <h1 className="brand">מנדט</h1>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="refresh-btn"
            disabled={isPending}
          >
            רענון
            <span className="refresh-count">{secondsLeft}</span>
          </button>
        </div>
        <p className="lede">
          חישוב מנדטים מתוצאות האמת: אחוז חסימה 3.25% מ־״קולות עד עתה״, סכום
          הרשימות שעברו, חלוקה ב־120.
        </p>
      </header>

      {state.status === "loading" ? (
        <p className="status-line">טוען תוצאות רשמיות…</p>
      ) : null}

      {state.status === "error" ? (
        <div className="error-box">
          <p className="font-medium">לא הצלחתי לעדכן את הנתונים</p>
          <p className="mt-1 text-sm opacity-90">{state.message}</p>
          <p className="mt-2 text-xs opacity-70">
            ניסיון: {formatFetchedAt(state.fetchedAt)}
          </p>
        </div>
      ) : null}

      {state.status === "ready" ? (
        <SnapshotView data={state.data} seatDeltas={state.seatDeltas} />
      ) : null}
    </div>
  );
}

function SnapshotView({
  data,
  seatDeltas,
}: {
  data: MandateSnapshot;
  seatDeltas: Record<string, SeatDelta>;
}) {
  const changed = Object.values(seatDeltas);

  return (
    <div className="snapshot">
      <div className="meta-line">
        נכון ל־{data.publishedAsOf ?? "לא צוין"} · עודכן{" "}
        {formatFetchedAt(data.fetchedAt)}
      </div>

      <section className="summary-strip" aria-label="סיכום חישוב">
        <SummaryChip
          label="קולות עד עתה"
          value={formatInt(data.votesSoFar)}
        />
        <SummaryChip
          label="רף 3.25%"
          value={formatInt(Math.round(data.blockThresholdVotes))}
        />
        <SummaryChip
          label="כשרים שעברו"
          value={formatInt(data.kosherVotes)}
        />
        <SummaryChip
          label="מודד מנדט"
          value={formatInt(Math.round(data.electoralMandate))}
          emphasis
        />
      </section>

      <details className="more-stats">
        <summary>עוד נתוני ספירה</summary>
        <div className="more-stats-grid">
          <span>כשרים עד עתה</span>
          <strong>{formatInt(data.validVotes)}</strong>
          <span>קלפיות</span>
          <strong>
            {data.stationsSoFar != null ? formatInt(data.stationsSoFar) : "—"}
          </strong>
          <span>פסולים</span>
          <strong>
            {data.invalidVotes != null ? formatInt(data.invalidVotes) : "—"}
          </strong>
          <span>רשימות מעל הרף</span>
          <strong>{data.qualifying.length}</strong>
        </div>
      </details>

      {changed.length > 0 ? (
        <p className="delta-banner" role="status">
          שינוי מנדטים:{" "}
          {changed
            .map((d) => `${d.letters} ${formatDelta(d.delta)}`)
            .join(" · ")}
        </p>
      ) : null}

      <section className="party-section">
        <div className="section-head">
          <h2 className="section-title">חלוקת מנדטים</h2>
          <p className="section-note">שם ואז מנדטים — הקריאה המהירה</p>
        </div>

        <ul className="party-list">
          {data.qualifying.map((p, index) => {
            const tip = seatDeltas[p.letters];
            return (
              <li key={p.letters + p.name} className="party-row">
                <div className="party-main">
                  <span className="party-rank">{index + 1}</span>
                  <div className="party-identity">
                    <span className="party-name">{shortName(p.name)}</span>
                    <span className="party-meta">
                      <span className="letters">{p.letters}</span>
                      <span>{formatInt(p.votes)} קולות</span>
                      <span>{formatPercent(p.shareOfVotesSoFar)}</span>
                    </span>
                  </div>
                  <div className="party-seats">
                    <span className="seat-with-tip">
                      <span className="seats-num">{p.seats}</span>
                      {tip ? <SeatTip delta={tip.delta} /> : null}
                    </span>
                    <span className="exact-seats">
                      {formatDecimal(p.exactMandates, 2)}
                      {p.gotRemainderSeat ? " · שארית" : ""}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="party-total">
          <span>סה״כ מנדטים</span>
          <strong>
            {data.qualifying.reduce((s, p) => s + p.seats, 0)}
          </strong>
        </div>
      </section>

      <section className="below-section">
        <h2 className="section-title">מתחת לאחוז החסימה</h2>
        <ul className="below-list">
          {data.belowThreshold.slice(0, 6).map((p) => (
            <li key={p.letters + p.name} className="below-row">
              <span className="below-name">
                <strong>{shortName(p.name)}</strong>
                <span className="letters">{p.letters}</span>
              </span>
              <span className="below-nums">
                {formatPercent(p.percentOfValid)}
                <span className="below-gap">
                  חסר{" "}
                  {formatInt(
                    Math.round(
                      Math.max(0, data.blockThresholdVotes - p.votes),
                    ),
                  )}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {data.belowThreshold.length > 6 ? (
          <p className="below-more">
            ועוד {data.belowThreshold.length - 6} רשימות מתחת לרף
          </p>
        ) : null}
      </section>
    </div>
  );
}

function SummaryChip({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`summary-chip${emphasis ? " emphasis" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SeatTip({ delta }: { delta: number }) {
  const up = delta > 0;
  return (
    <span
      className={`seat-tip ${up ? "up" : "down"}`}
      title={up ? "עלה מנדט מאז העדכון הקודם" : "ירד מנדט מאז העדכון הקודם"}
    >
      {formatDelta(delta)}
    </span>
  );
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function shortName(name: string): string {
  const cuts = [
    " בהנהגת",
    " בראשות",
    " עם ",
    " - ",
    " – ",
    " לראשות",
  ];
  let out = name;
  for (const cut of cuts) {
    const i = out.indexOf(cut);
    if (i > 2) {
      out = out.slice(0, i);
      break;
    }
  }
  return out.trim();
}
