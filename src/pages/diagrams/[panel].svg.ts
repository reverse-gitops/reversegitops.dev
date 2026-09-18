import type { APIRoute } from 'astro';
import { PANELS, readPanel, prepareForWeb } from '../../lib/diagrams';

// Serves each Excalidraw export with the two things the drawing itself cannot
// carry: the wordmark gradient on the "Your GitOps repo" box, and the removal
// of the exporter's opaque background. Derived at build time from public/, the
// way sitemap.xml is derived from src/pages, so re-exporting never undoes them
// and there is no clean-up step to remember.

export function getStaticPaths() {
	return PANELS.map((panel) => ({ params: { panel: panel.slug }, props: { panel } }));
}

export const GET: APIRoute = ({ props }) => {
	const { file } = props.panel;

	return new Response(prepareForWeb(readPanel(file), file), {
		headers: {
			'Content-Type': 'image/svg+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
