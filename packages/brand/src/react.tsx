/**
 * React components for the Plexus identity. Geometry comes from
 * geometry.generated.ts (same data as the SVG assets — decide once, propagate).
 *
 * Colors resolve through the role tokens in brand.css (`--plx-*`) with hex
 * fallbacks, so the components work with or without the stylesheet and flip
 * correctly under a `.dark` scheme when it is loaded.
 */
import type { CSSProperties } from 'react';
import { band, crossing, wordmarkX } from './geometry.generated.js';
import { colors, wordmark } from './tokens.js';

const EVENT = `var(--plx-event, ${colors.accent})`;
const FG_SOFT = `var(--plx-fg-soft, ${colors.inkSoft})`;

export type MarkProps = {
  /** Rendered size in px. Below 24 the heavier small master is used. */
  size?: number;
  /** `ink` = single color (currentColor); `twotone` = rising strand in ochre. */
  variant?: 'ink' | 'twotone';
  /** Accessible label; omit to hide from assistive tech (decorative use). */
  title?: string;
  className?: string;
};

/** The Crossing mark — two strands crossing once, the rising one over. */
export function Mark({ size = 32, variant = 'ink', title, className }: MarkProps) {
  const strokeWidth = size < 24 ? 9 : 7;
  const cut = crossing.descendingCut[strokeWidth];
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: a <title> is rendered whenever `title` is set; without it the svg is aria-hidden (decorative)
    <svg
      viewBox={crossing.viewBox}
      width={size}
      height={size}
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d={cut} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path
        d={crossing.rising}
        stroke={variant === 'twotone' ? EVENT : 'currentColor'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export type WordmarkProps = {
  /** Optional suffix rendered in regular weight, e.g. ".ms". */
  tld?: string;
  /** Rising strand of the ✕ in ochre. */
  twotone?: boolean;
  /**
   * The wordmark inherits font-family and font-size from its context; it must
   * sit in IBM Plex Mono 700 (pass e.g. a `font-display font-bold` class).
   */
  className?: string;
};

const wordmarkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'baseline',
  lineHeight: 1,
  letterSpacing: '-0.01em',
};

const xStyle: CSSProperties = {
  height: `${wordmark.xHeightEm}em`,
  width: `${wordmark.xHeightEm * wordmark.aspect}em`,
  margin: `0 ${wordmark.sideBearingEm}em`,
  flex: 'none',
};

/** The ple✕us wordmark — the crossing standing as the letter x. */
export function Wordmark({ tld, twotone = false, className }: WordmarkProps) {
  return (
    <span role="img" aria-label={`plexus${tld ?? ''}`} className={className} style={wordmarkStyle}>
      <span aria-hidden="true">ple</span>
      <svg viewBox={wordmarkX.viewBox} fill="none" style={xStyle} aria-hidden="true">
        <path
          d={wordmarkX.descendingCut}
          stroke="currentColor"
          strokeWidth={wordmarkX.strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={wordmarkX.rising}
          stroke={twotone ? EVENT : 'currentColor'}
          strokeWidth={wordmarkX.strokeWidth}
          strokeLinecap="round"
        />
      </svg>
      <span aria-hidden="true">us</span>
      {tld ? (
        <span aria-hidden="true" style={{ fontWeight: 400, color: FG_SOFT }}>
          {tld}
        </span>
      ) : null}
    </span>
  );
}

export type BraidBandProps = {
  className?: string;
  style?: CSSProperties;
};

/** The braid band — the crossing repeated; the system's divider motif. Horizontal only. */
export function BraidBand({ className, style }: BraidBandProps) {
  return (
    <svg viewBox={band.viewBox} fill="none" className={className} style={style} aria-hidden="true">
      <path d={band.ink} stroke="currentColor" strokeWidth={band.strokeWidth} strokeLinecap="round" />
      <path d={band.accent} stroke={EVENT} strokeWidth={band.strokeWidth} strokeLinecap="round" />
    </svg>
  );
}
