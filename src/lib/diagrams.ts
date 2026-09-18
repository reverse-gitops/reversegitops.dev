// Everything the manifesto panels know about the Excalidraw exports lives here,
// because two places need it: index.astro (to lay the panels out) and the
// /diagrams/[panel].svg endpoint (to serve them).
//
// The exports in public/ are the source of truth and are never edited by hand —
// Simon draws, exports, and the page follows. Anything the drawing cannot
// express is applied here on the way out, so a re-export never loses it.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface Panel {
	slug: string;
	file: string;
	/** Manifesto heading this panel is filed under, matched against the rendered HTML. */
	heading: string;
}

export const PANELS: Panel[] = [
	{
		slug: '1-api-first',
		file: '1-api-first.excalidraw.svg',
		heading: 'Principle 1: API First',
	},
	{
		slug: '2-intent-only',
		file: '2-intent-only.excalidraw.svg',
		heading: 'Principle 2: Capture Intent, Not Implementation',
	},
	{
		slug: '3-gitops-applies',
		file: '3-gitops-applies.excalidraw.svg',
		heading: 'Principle 3: GitOps Still Applies',
	},
];

// Read from the project root rather than import.meta.url: this runs during
// prerender from a chunk bundled into dist/, where a module-relative path
// resolves against the wrong root. Vite discourages importing out of public/,
// hence readFileSync.
export function readPanel(file: string): string {
	return readFileSync(resolve(process.cwd(), 'public', file), 'utf8');
}

// ── The GitOps repo box, in the wordmark's gradient ──────────────────────────
// The wordmark sets "Reverse" in grey and "GitOps" in a blue→violet gradient.
// The drawings already echo the first half (the Intent API box is the muted
// grey); this gives the repo box the second half. Excalidraw cannot draw a
// gradient, so it is swapped in here — which also means it survives a
// re-export, where an edit to the file itself would not.
//
// Kept in step with .w-gitops in global.css.
const GRADIENT_ID = 'rgo-gitops-gradient';
const GRADIENT_STOPS = [
	{ offset: '0%', color: '#60a5fa' },
	{ offset: '50%', color: '#4493f8' },
	{ offset: '100%', color: '#a78bfa' },
];

/** The flat fill Excalidraw writes for the "Your GitOps repo" box. */
const REPO_FILL = '#b4d4fc';

/**
 * Everything applied to an export on its way to the page. Both steps are done
 * here rather than in the file so that a re-export never undoes them — there is
 * no manual clean-up step to remember after drawing.
 */
export function prepareForWeb(svg: string, file: string): string {
	return withLogoGradient(stripExportBackground(svg), file);
}

/**
 * Excalidraw's export dialog has a "Background" toggle, and leaving it on bakes
 * an opaque white rect across the canvas. On the tinted card that reads as a
 * bright slab, so it is removed here and the card's paper shows through —
 * whichever way the toggle happened to be set.
 */
export function stripExportBackground(svg: string): string {
	return svg.replace(/<rect x="0" y="0"[^>]*\bfill="#[0-9a-fA-F]{3,8}"[^>]*>(?:<\/rect>)?/, '');
}

export function withLogoGradient(svg: string, file: string): string {
	const fill = `fill="${REPO_FILL}"`;
	const hits = svg.split(fill).length - 1;

	// One box, one fill. Anything else means the drawing changed in a way that
	// would put the gradient on the wrong shape, so fail loudly at build time.
	if (hits !== 1) {
		throw new Error(
			`expected exactly one ${fill} (the "Your GitOps repo" box) in public/${file}, found ${hits}. ` +
				`If the box colour changed, update REPO_FILL in src/lib/diagrams.ts.`,
		);
	}

	// x1/y1 → x2/y2 across the bounding box is the SVG spelling of the CSS
	// gradient's 135deg.
	const stops = GRADIENT_STOPS.map(
		(s) => `<stop offset="${s.offset}" stop-color="${s.color}" />`,
	).join('');
	const gradient =
		`<linearGradient id="${GRADIENT_ID}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>`;

	const withDefs = svg.includes('</defs>')
		? svg.replace('</defs>', `${gradient}</defs>`)
		: svg.replace(/(<svg[^>]*>)/, `$1<defs>${gradient}</defs>`);

	return withDefs.replace(fill, `fill="url(#${GRADIENT_ID})"`);
}

// ── Reading the drawing back out ─────────────────────────────────────────────

/** Intrinsic size, so the manifesto does not reflow as each drawing arrives. */
export function svgSize(svg: string, file: string): { width: number; height: number } {
	const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
	if (!viewBox) throw new Error(`no viewBox found in public/${file}`);
	return { width: Math.round(+viewBox[1]), height: Math.round(+viewBox[2]) };
}

/**
 * Whether the export was made with Excalidraw's "Background" toggle on. The
 * page does not care — prepareForWeb strips it either way — but the diagram
 * check reports it, since an export without it is a slightly smaller file.
 */
export function hasOpaqueBackground(drawing: string): boolean {
	const backdrop = drawing.match(/<rect x="0" y="0"[^>]*\bfill="([^"]+)"/);
	return Boolean(backdrop && backdrop[1] !== 'none' && backdrop[1] !== 'transparent');
}

/** Everything after the embedded Excalidraw scene: the drawing itself. */
export function drawingOf(svg: string): string {
	return svg.split('<!-- payload-end -->').pop() ?? svg;
}

const ENTITIES: Record<string, string> = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'",
	'&apos;': "'",
};

/**
 * The wording inside each drawing is the leading copy, so the alt text is read
 * back out of the drawing rather than written alongside it — re-export and the
 * description follows, the way sitemap.xml follows src/pages. A hand-written
 * sentence would be a second source of truth that silently goes stale.
 *
 * Excalidraw wraps each text element in a translated <g>, and splits a
 * multi-line label into one <text> per line, so lines are regrouped and the
 * blocks sorted roughly top-to-bottom then left-to-right into reading order.
 */
export function svgAlt(drawing: string): string {
	const decode = (s: string) => s.replace(/&(?:amp|lt|gt|quot|#39|apos);/g, (m) => ENTITIES[m]);

	const blocks: { x: number; y: number; text: string }[] = [];
	for (const g of drawing.matchAll(
		/<g transform="translate\(([-\d.]+) ([-\d.]+)\)[^"]*">(.*?)<\/g>/gs,
	)) {
		const lines = [...g[3].matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
			.map((t) => decode(t[1]).trim())
			.filter(Boolean);
		if (lines.length) blocks.push({ x: +g[1], y: +g[2], text: lines.join(' ') });
	}

	// Bucket the y axis so labels sitting on one visual row stay together.
	blocks.sort((a, b) => Math.round(a.y / 28) - Math.round(b.y / 28) || a.x - b.x);

	const labels = blocks.map((b) => b.text).join('; ');
	return labels
		? `Hand-drawn diagram. Labels, in reading order: ${labels}.`
		: 'Hand-drawn diagram of the Reverse GitOps flow.';
}
