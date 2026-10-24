#!/usr/bin/env node
/**
 * Generates the Plexus mark SVGs and src/geometry.generated.ts from one set of
 * geometry constants. The over-under gap is cut geometrically (real sub-paths,
 * not a ground-colored halo) so every asset works on any background.
 *
 * Spec: compendium miscellaneous/brand — PLX-02 "The Crossing".
 *   - Rising strand passes over; the descending strand is cut.
 *   - Visible gap: 0.5× stroke per side. With round caps that puts the cut
 *     endpoints at a centerline clearance of (stroke + haloWidth) / 2 from the
 *     over strand, where haloWidth is the historical halo stroke of each master.
 *
 * Run: node scripts/generate-assets.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Palette (mirrors src/tokens.ts — assets are standalone files, so hexes are inlined)
const INK = '#1B1D1A';
const ACCENT = '#D9A400';
const DARK = '#20231E'; // dark ground (tokens.colors.dark)
const DARK_PAPER = '#F2F1EA';
const DARK_ACCENT = '#E9BE3F';

// ---------------------------------------------------------------------------
// Canonical geometry, 64×64 space
const RISING = [
  [48, 12],
  [32, 22],
  [32, 42],
  [16, 52],
];
const DESCENDING = [
  [16, 12],
  [32, 22],
  [32, 42],
  [48, 52],
];

// Braid band, 184×64 space. Two strands of three cubic segments; crossings sit
// at the segment midpoints (36,32), (92,32), (148,32) and alternate over/under:
// accent over at 1 & 3, ink over at 2.
const BAND_ACCENT = [
  [
    [8, 22],
    [32, 22],
    [40, 42],
    [64, 42],
  ],
  [
    [64, 42],
    [88, 42],
    [96, 22],
    [120, 22],
  ],
  [
    [120, 22],
    [144, 22],
    [152, 42],
    [176, 42],
  ],
];
const BAND_INK = [
  [
    [8, 42],
    [32, 42],
    [40, 22],
    [64, 22],
  ],
  [
    [64, 22],
    [88, 22],
    [96, 42],
    [120, 42],
  ],
  [
    [120, 42],
    [144, 42],
    [152, 22],
    [176, 22],
  ],
];

// ---------------------------------------------------------------------------
// Cubic bézier helpers
function cubicPoint([p0, p1, p2, p3], t) {
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  return [x, y];
}

function sample(seg, n = 512) {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(cubicPoint(seg, i / n));
  return pts;
}

function distToPolyline([x, y], pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
    const px = ax + t * dx;
    const py = ay + t * dy;
    best = Math.min(best, Math.hypot(x - px, y - py));
  }
  return best;
}

/** De Casteljau: sub-cubic of `seg` over [t0, t1]. */
function subCubic(seg, t0, t1) {
  const splitAfter = (s, t) => {
    // returns the [t, 1] part
    const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    const [p0, p1, p2, p3] = s;
    const p01 = lerp(p0, p1, t);
    const p12 = lerp(p1, p2, t);
    const p23 = lerp(p2, p3, t);
    const p012 = lerp(p01, p12, t);
    const p123 = lerp(p12, p23, t);
    const p0123 = lerp(p012, p123, t);
    return { before: [p0, p01, p012, p0123], after: [p0123, p123, p23, p3] };
  };
  const { after } = splitAfter(seg, t0);
  const t1r = (t1 - t0) / (1 - t0);
  return splitAfter(after, t1r).before;
}

/**
 * Find the cut parameters on `cutSeg` around its crossing with `overSeg`
 * (both cross at t=0.5 in all our geometry). Walk outward from the crossing
 * until the centerline clearance is reached.
 */
function findCut(cutSeg, overSeg, clearance) {
  const overPts = sample(overSeg);
  const solve = (dir) => {
    let t = 0.5;
    const step = dir / 4096;
    while (t > 0 && t < 1) {
      if (distToPolyline(cubicPoint(cutSeg, t), overPts) >= clearance) return t;
      t += step;
    }
    throw new Error('cut parameter not found — clearance too large for this segment');
  };
  return [solve(-1), solve(+1)];
}

const fmt = (n) => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};
const M = ([x, y]) => `M${fmt(x)} ${fmt(y)}`;
const C = ([, p1, p2, p3]) => `C${fmt(p1[0])} ${fmt(p1[1])} ${fmt(p2[0])} ${fmt(p2[1])} ${fmt(p3[0])} ${fmt(p3[1])}`;
const pathFrom = (segs) => segs.map((s, i) => (i === 0 ? `${M(s[0])} ${C(s)}` : C(s))).join(' ');

// ---------------------------------------------------------------------------
// Crossing masters. clearance = (stroke + legacy halo width) / 2 keeps the
// visible gap identical to the approved studies.
function cutCrossing(stroke, halo) {
  const clearance = (stroke + halo) / 2;
  const [t1, t2] = findCut(DESCENDING, RISING, clearance);
  const a = subCubic(DESCENDING, 0, t1);
  const b = subCubic(DESCENDING, t2, 1);
  return `${M(a[0])} ${C(a)} ${M(b[0])} ${C(b)}`;
}

const risingD = pathFrom([RISING]);
const descCut = {
  regular: cutCrossing(7, 14), // ≥24 px master
  small: cutCrossing(9, 17), // <24 px master (favicons, badges)
  wordmark: cutCrossing(14, 26), // in-word ✕, Plex-tuned
};

// Band: cut ink strand at crossings 1 & 3, accent strand at crossing 2.
function cutBand() {
  const clearance = (6 + 12) / 2;
  const [i1a, i1b] = findCut(BAND_INK[0], BAND_ACCENT[0], clearance);
  const [a2a, a2b] = findCut(BAND_ACCENT[1], BAND_INK[1], clearance);
  const [i3a, i3b] = findCut(BAND_INK[2], BAND_ACCENT[2], clearance);
  const accentD = [
    pathFrom([BAND_ACCENT[0], subCubic(BAND_ACCENT[1], 0, a2a)]),
    pathFrom([subCubic(BAND_ACCENT[1], a2b, 1), BAND_ACCENT[2]]),
  ].join(' ');
  const inkD = [
    pathFrom([subCubic(BAND_INK[0], 0, i1a)]),
    pathFrom([subCubic(BAND_INK[0], i1b, 1), BAND_INK[1], subCubic(BAND_INK[2], 0, i3a)]),
    pathFrom([subCubic(BAND_INK[2], i3b, 1)]),
  ].join(' ');
  return { accentD, inkD };
}
const band = cutBand();

// ---------------------------------------------------------------------------
// Org avatar. A full-bleed square (GitHub masks it to a circle) carrying the
// dark-ground mark — accent over paper, matching mark-dark.svg. The mark is
// centered on its true visual bounding box (stroke caps included) and scaled to
// leave a safe margin inside the circular crop.
const AVATAR = {
  size: 1024,
  ground: DARK,
  over: DARK_ACCENT, // rising strand, passes over
  under: DARK_PAPER, // descending strand, cut
  stroke: 7, // in 64-space; scales with the mark
  /** The mark's taller dimension occupies this fraction of the canvas. */
  heightFraction: 0.52,
};

/** Visual bounding box of the crossing in 64-space, stroke caps included. */
function markBBox(stroke) {
  const r = stroke / 2;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const seg of [RISING, DESCENDING]) {
    for (const [x, y] of sample(seg)) {
      minX = Math.min(minX, x - r);
      minY = Math.min(minY, y - r);
      maxX = Math.max(maxX, x + r);
      maxY = Math.max(maxY, y + r);
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

function avatarSvg() {
  const bb = markBBox(AVATAR.stroke);
  const k = (AVATAR.heightFraction * AVATAR.size) / Math.max(bb.w, bb.h);
  const tx = AVATAR.size / 2 - bb.cx * k;
  const ty = AVATAR.size / 2 - bb.cy * k;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${AVATAR.size} ${AVATAR.size}" width="${AVATAR.size}" height="${AVATAR.size}" fill="none" role="img" aria-labelledby="t">
  ${GENERATED}
  <title id="t">The Plexus avatar</title>
  <rect width="${AVATAR.size}" height="${AVATAR.size}" fill="${AVATAR.ground}"/>
  <g transform="translate(${fmt(tx)} ${fmt(ty)}) scale(${fmt(k)})" stroke-width="${AVATAR.stroke}" stroke-linecap="round">
    <path d="${descCut.regular}" stroke="${AVATAR.under}"/>
    <path d="${risingD}" stroke="${AVATAR.over}"/>
  </g>
</svg>
`;
}

// ---------------------------------------------------------------------------
// SVG emitters
const GENERATED = '<!-- generated by scripts/generate-assets.mjs — do not edit by hand -->';

function crossingSvg({ stroke, cut, over, under, title, extra = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" role="img" aria-labelledby="t">
  ${GENERATED}
  <title id="t">${title}</title>
  ${extra}<path d="${cut}" stroke="${under}" stroke-width="${stroke}" stroke-linecap="round"${extra ? ' class="s"' : ''}/>
  <path d="${risingD}" stroke="${over}" stroke-width="${stroke}" stroke-linecap="round"${extra ? ' class="s r"' : ''}/>
</svg>
`;
}

const assets = {
  'mark.svg': crossingSvg({ stroke: 7, cut: descCut.regular, over: INK, under: INK, title: 'The Plexus mark' }),
  'mark-small.svg': crossingSvg({
    stroke: 9,
    cut: descCut.small,
    over: INK,
    under: INK,
    title: 'The Plexus mark (small master)',
  }),
  'mark-twotone.svg': crossingSvg({
    stroke: 7,
    cut: descCut.regular,
    over: ACCENT,
    under: INK,
    title: 'The Plexus mark, two-tone',
  }),
  'mark-dark.svg': crossingSvg({
    stroke: 7,
    cut: descCut.regular,
    over: DARK_ACCENT,
    under: DARK_PAPER,
    title: 'The Plexus mark, dark-ground variant',
  }),
  'favicon.svg': crossingSvg({
    stroke: 9,
    cut: descCut.small,
    over: INK,
    under: INK,
    title: 'Plexus',
    extra: `<style>@media (prefers-color-scheme: dark) { .s { stroke: ${DARK_PAPER}; } .r { stroke: ${DARK_ACCENT}; } }</style>\n  `,
  }),
  'avatar.svg': avatarSvg(),
  'braid-band.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 184 64" fill="none" role="img" aria-labelledby="t">
  ${GENERATED}
  <title id="t">The Plexus braid band</title>
  <path d="${band.inkD}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  <path d="${band.accentD}" stroke="${ACCENT}" stroke-width="6" stroke-linecap="round"/>
</svg>
`,
};

mkdirSync(join(ROOT, 'assets'), { recursive: true });
for (const [name, svg] of Object.entries(assets)) {
  writeFileSync(join(ROOT, 'assets', name), svg);
}

// ---------------------------------------------------------------------------
// geometry.generated.ts — the same path data for the React components
const ts = `// generated by scripts/generate-assets.mjs — do not edit by hand

/** PLX-02 "The Crossing", 64×64 space. Rising strand passes over. */
export const crossing = {
  viewBox: '0 0 64 64',
  /** The over strand (bottom-left to top-right). */
  rising: '${risingD}',
  /** The under strand, gap pre-cut per master. Key = stroke width. */
  descendingCut: {
    7: '${descCut.regular}',
    9: '${descCut.small}',
    14: '${descCut.wordmark}',
  },
} as const;

/** The in-word ✕ crop of the crossing (wordmark use, stroke 14). */
export const wordmarkX = {
  viewBox: '9 5 46 54',
  rising: crossing.rising,
  descendingCut: crossing.descendingCut[14],
  strokeWidth: 14,
} as const;

/** The braid band (the crossing repeated), 184×64 space. */
export const band = {
  viewBox: '0 0 184 64',
  strokeWidth: 6,
  /** Over at the outer crossings. */
  accent: '${band.accentD}',
  /** Over at the middle crossing. */
  ink: '${band.inkD}',
} as const;
`;
writeFileSync(join(ROOT, 'src', 'geometry.generated.ts'), ts);

// ---------------------------------------------------------------------------
// Rasterize the avatar to a 1024×1024 PNG for the GitHub org profile picture,
// which cannot use SVG. Rendered from the SVG we just wrote so the two stay in
// lockstep.
await sharp(Buffer.from(assets['avatar.svg']))
  .resize(AVATAR.size, AVATAR.size)
  .png()
  .toFile(join(ROOT, 'assets', 'avatar.png'));

console.log(`wrote ${Object.keys(assets).length} assets + avatar.png + src/geometry.generated.ts`);
