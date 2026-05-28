/**
 * Token ID format helpers — NID-YYYY-CC-NNNN.
 *
 * YYYY = cycle year, CC = single-letter cycle window code, NNNN = counter.
 * Counter state lives in the store; this file only formats the ID and
 * derives the window letter from the issuance month.
 */

export type CycleWindow = 'A' | 'B';

export function windowForDate(date: Date): CycleWindow {
  // Spring window: Feb–Jul. Autumn window: Aug–Jan.
  const month = date.getUTCMonth() + 1;
  return month >= 2 && month <= 7 ? 'A' : 'B';
}

export function yearForDate(date: Date): number {
  return date.getUTCFullYear();
}

export function formatTokenId(year: number, window: CycleWindow, counter: number): string {
  const padded = counter.toString().padStart(4, '0');
  return `NID-${year}-${window}-${padded}`;
}

const TOKEN_PATTERN = /^NID-(\d{4})-([AB])-(\d{4})$/;

export function parseTokenId(
  token: string,
): { year: number; window: CycleWindow; counter: number } | null {
  const match = TOKEN_PATTERN.exec(token);
  if (!match) return null;
  return {
    year: Number(match[1]),
    window: match[2] as CycleWindow,
    counter: Number(match[3]),
  };
}
