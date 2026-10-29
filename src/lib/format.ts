const heNumber = new Intl.NumberFormat("he-IL");
const heDecimal = new Intl.NumberFormat("he-IL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const heExact = new Intl.NumberFormat("he-IL", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

export function formatInt(n: number): string {
  return heNumber.format(Math.round(n));
}

export function formatDecimal(n: number, digits = 2): string {
  if (digits === 4) return heExact.format(n);
  return heDecimal.format(n);
}

export function formatPercent(n: number): string {
  return `${formatDecimal(n, 2)}%`;
}

/** Official stamp is Israel-local wall time already labeled on the site. */
export function formatFetchedAt(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso));
}
