const heNumber = new Intl.NumberFormat("he-IL");

export function formatInt(value: number): string {
  return heNumber.format(Math.round(value));
}

export function formatDecimal(value: number, digits = 4): string {
  return value.toLocaleString("he-IL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(value: number, digits = 2): string {
  return `${value.toLocaleString("he-IL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}
