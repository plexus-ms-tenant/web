/**
 * Plexus design tokens — the palette, faces, and scale decided in the brand kit
 * (compendium: miscellaneous/brand). Decided once here, propagated everywhere.
 */

/** Raw palette. These never flip with the color scheme. */
export const colors = {
  ink: '#1B1D1A',
  inkSoft: '#5C605A',
  paper: '#F4F5F2',
  card: '#FFFFFF',
  line: '#D9DBD3',
  /** Nerve ochre — the event color, never the default. */
  accent: '#D9A400',
  /** Ochre at AA contrast on white — links, § ids, keywords. */
  accentText: '#8A6E00',
  /** Requirement callouts, highlighted rows. */
  accentWash: '#F8F3E0',
  dark: '#20231E',
  darkRaised: '#262A24',
  darkPaper: '#F2F1EA',
  darkSoft: '#A9ACA2',
  darkLine: '#3A3E38',
  /** Ochre brightened one step for dark grounds. */
  darkAccent: '#E9BE3F',
  /** Semantic state colors — separate from the accent; warning is burnt orange
   * because the accent owns the yellow band. */
  ok: '#4C7D4E',
  warn: '#C77D2E',
  crit: '#B0402E',
} as const;

/** Typefaces (Google Fonts). Mono carries the voice, sans carries the reading. */
export const fonts = {
  display: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  body: "'IBM Plex Sans', system-ui, sans-serif",
  /** Weights that ship — nothing else. */
  weights: { mono: [400, 700], sans: [400, 600] },
} as const;

/** The type scale in px — one ladder, no in-betweens. */
export const typeScale = [11, 13, 15.5, 18, 23, 33] as const;

/** Wordmark construction (IBM Plex Mono 700, lowercase). */
export const wordmark = {
  /** ✕ height as a fraction of the em (Plex Mono x-height). */
  xHeightEm: 0.52,
  /** ✕ width : height ratio (the 46×54 crop). */
  aspect: 46 / 54,
  /** Side bearings so the ✕ advance equals one mono cell (0.6em). */
  sideBearingEm: 0.078,
  /** ✕ stroke ≈ 1.2× the Plex Mono 700 stem — heavier than the letters on purpose. */
  strokeWidth: 14,
  /** Below this word size, set “plexus” in plain type instead. */
  minWordSizePx: 18,
} as const;
