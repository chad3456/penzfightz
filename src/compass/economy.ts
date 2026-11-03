/**
 * Economic inequality and income for the 44 countries.
 *
 * Inequality: SWIID 9.92 — Gini index of disposable (after taxes and
 * transfers) and market (before) household income, 0–100, with standard
 * errors, and relative redistribution: the percentage by which taxes and
 * transfers reduce market-income inequality. Income: GDP per person in
 * current US dollars, World Bank WDI. North Korea is not covered by either.
 */
import { ECON_RAW } from './economy-data';

export interface Est { v: number; se?: number | null; year: number }
export interface Econ {
  gini?: Est; giniMkt?: Est; redist?: Est; gdppc?: Est; pop?: Est;
  trend: [number, number][]; trendMkt: [number, number][]; gdppcTrend: [number, number][];
}
export const ECON: Record<string, Econ> = Object.fromEntries(Object.entries(ECON_RAW).map(([k, e]) => [k, { trend: [], trendMkt: [], gdppcTrend: [], ...e }]));

export const SWIID_CITE = 'Solt, F. (2020), “Measuring Income Inequality Across Countries and Over Time: The Standardized World Income Inequality Database”, Social Science Quarterly 101(3). SWIID Version 9.92, April 2026.';
export const SWIID_URL = 'https://fsolt.org/swiid/';
export const WB_CITE = 'World Bank, World Development Indicators (GDP, current US$; population), CC BY 4.0, via github.com/datasets.';

/** Flag SWIID redistribution estimates that should be read with care: below zero, or a standard error of 4 points or more.
 *  This mostly happens where national surveys measure consumption rather than income. */
export const redistUncertain = (e?: Econ) => !!e?.redist && (e.redist.v < 0 || (e.redist.se ?? 0) >= 4);

/** Gini mapped to 0–100 for lenses: 20 or below → 0, 65 or above → 100. */
export const giniScaled = (g: number) => Math.max(0, Math.min(100, ((g - 20) / 45) * 100));
/** Relative redistribution (%) mapped to 0–100: 0% or less → 0, 50% or more → 100. */
export const redistScaled = (r: number) => Math.max(0, Math.min(100, r * 2));

export function giniBand(g: number) {
  return g < 28 ? 'Very equal' : g < 33 ? 'Equal' : g < 38 ? 'Moderate' : g < 45 ? 'Unequal' : g < 52 ? 'Very unequal' : 'Extremely unequal';
}
export const fmtUSD = (v: number) => (v >= 10000 ? `$${Math.round(v / 1000)}k` : `$${v.toLocaleString('en-US')}`);
export const fmtPop = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)} bn` : v >= 1e6 ? `${(v / 1e6).toFixed(1)} m` : v.toLocaleString('en-US'));

/** Pearson correlation of paired values. */
export function corr(xs: number[], ys: number[]) {
  const n = xs.length; if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return sxy / Math.sqrt(sxx * syy);
}
