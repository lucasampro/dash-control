// Helpers para lidar com os valores já formatados (padrão BR) que vêm da planilha.

export function toNumber(raw: string | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-") return null;

  let s = trimmed
    .replace(/R\$\s?/g, "")
    .replace(/%/g, "")
    .replace(/x$/i, "")
    .trim();

  // Formato BR: ponto separa milhar, vírgula separa decimal.
  s = s.replace(/\./g, "").replace(/,/g, ".");

  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

export function displayOr(value: string | undefined | null, fallback = "-"): string {
  if (value === undefined || value === null) return fallback;
  const t = value.trim();
  return t === "" ? fallback : t;
}

export function isRowEmpty(row: string[]): boolean {
  return row.every((cell) => cell === undefined || cell.trim() === "");
}
