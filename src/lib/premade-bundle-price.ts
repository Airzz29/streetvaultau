/** Split a bundle total across line items by retail share (AUD, 2 decimal places). */
export function allocateBundleUnitPricesAud(retailPrices: number[], bundleTotalAud: number): number[] {
  const n = retailPrices.length;
  if (n === 0) return [];
  const sum = retailPrices.reduce((a, b) => a + b, 0);
  if (sum <= 0 || Math.abs(bundleTotalAud - sum) < 0.005) return retailPrices.slice();

  const raw = retailPrices.map((p) => Math.round(((p / sum) * bundleTotalAud + Number.EPSILON) * 100) / 100);
  const total = raw.reduce((a, b) => a + b, 0);
  const drift = Math.round((bundleTotalAud - total) * 100) / 100;
  raw[n - 1] = Math.round((raw[n - 1]! + drift) * 100) / 100;
  return raw;
}
