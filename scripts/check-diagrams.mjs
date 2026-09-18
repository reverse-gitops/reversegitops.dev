// Fast feedback after re-exporting a drawing from Excalidraw.
//
// `npm run diagrams:check` — reports what the build will make of each export,
// and fails with the same errors the build would, without waiting for a build.
// Nothing here modifies the exports: the gradient and the background strip are
// applied when the page is built, so there is no clean-up step to remember.

import { PANELS, readPanel, prepareForWeb, drawingOf, svgSize, svgAlt, hasOpaqueBackground } from '../src/lib/diagrams.ts';

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
let failed = false;

for (const panel of PANELS) {
	process.stdout.write(`\n${panel.file}\n`);

	try {
		const svg = readPanel(panel.file);
		const drawing = drawingOf(svg);
		const { width, height } = svgSize(svg, panel.file);
		const web = prepareForWeb(svg, panel.file);
		const alt = svgAlt(drawing);

		console.log(`  served as   /diagrams/${panel.slug}.svg`);
		console.log(`  size        ${width} x ${height}  (${kb(svg.length)} source)`);
		console.log(`  gradient    applied to the "Your GitOps repo" box`);
		console.log(
			`  background  ${
				hasOpaqueBackground(drawing)
					? 'exported with Excalidraw’s "Background" toggle on — stripped for the page'
					: 'none (exported with "Background" off)'
			}`,
		);
		console.log(`  alt         ${alt.length} chars`);
		console.log(`              ${alt.slice(0, 140)}${alt.length > 140 ? '…' : ''}`);

		if (!web.includes('url(#')) throw new Error('gradient reference missing after transform');
	} catch (error) {
		failed = true;
		console.log(`  ERROR       ${error.message}`);
	}
}

console.log(
	failed
		? '\nSomething needs attention before this builds.\n'
		: '\nAll diagrams look good.\n',
);

process.exit(failed ? 1 : 0);
