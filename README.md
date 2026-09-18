# reversegitops.dev

The public website for [reversegitops.dev](https://reversegitops.dev).

Built with [Astro](https://astro.build) and deployed to GitHub Pages.
This site uses PostHog for basic analytics. PostHog is hosted in the EU and configured without cookies.

## Manifesto content

The manifesto text comes from [reverse-gitops/manifesto](https://github.com/reverse-gitops/manifesto), included as a submodule at `external/manifesto` and pinned to nothing in particular — `npm run dev` and `npm run build` both move it to the tip of `main` first, so a build always renders current upstream.

```sh
git clone --recurse-submodules https://github.com/reverse-gitops/reversegitops.dev
npm install
npm run dev
```

Notes:

- The commit recorded for the submodule is stale by design. `ignore = all` in `.gitmodules` keeps it out of `git status`; don't bother committing bumps.
- To preview an unpublished manifesto edit, change `external/manifesto/README.md` and run `npx astro dev` — plain `npm run dev` resets the submodule and discards it.

## Principle diagrams

Each of the three principles carries a hand-drawn diagram. The drawings are Excalidraw exports in `public/*.excalidraw.svg`, and **editing and re-exporting one is the entire update** — nothing has to be adjusted in code afterwards.

Everything the page needs is read back out of the export at build time (`src/lib/diagrams.ts`):

| Derived | From |
| --- | --- |
| Panel size (prevents layout shift) | the `viewBox` |
| `alt` text | the drawing's own text labels, sorted into reading order |
| Where the panel appears | `heading` in `PANELS`, matched against the rendered manifesto |

Two things the drawing itself cannot express are applied when it is served, by `src/pages/diagrams/[panel].svg.ts`:

- **The wordmark gradient** on the "Your GitOps repo" box. Excalidraw has no gradients, and the drawings otherwise echo the logo — the Intent API box is the "Reverse" grey, so the repo box gets the "GitOps" blue→violet.
- **Removing the exporter's background.** Excalidraw's export dialog bakes in an opaque white rect unless "Background" is unticked; on the light card that reads as a bright slab, so it is stripped either way.

Both happen on a derived copy at `/diagrams/<slug>.svg`, the same way `sitemap.xml` is derived from `src/pages`. The exports in `public/` are never modified, so a re-export can never undo them.

```sh
npm run diagrams:check
```

Reports what the build will make of each export — size, alt text, whether the background needed stripping — and fails with the same errors a build would, without waiting for one. Worth running after re-exporting.

Two things will stop a build rather than fail quietly:

- The "Your GitOps repo" box is found by its fill colour (`REPO_FILL` in `src/lib/diagrams.ts`). Recolour that box in Excalidraw and the build stops with a message naming the file — otherwise the gradient would silently land on the wrong shape.
- A missing `viewBox` stops the build, since the panel would have no dimensions to reserve.

Adding a fourth panel means adding an entry to `PANELS` and a matching `<hr>`-terminated section in the manifesto.

## Attributions

- The GitOps movement as managed by [OpenGitOps](https://github.com/open-gitops) project (CC BY 4.0)
- GitHub corner ribbon by [Tim Holman](https://github.com/tholman/github-corners) (MIT License)
- Logo based on the [Combine](https://lucide.dev/icons/combine) icon by [Lucide](https://lucide.dev) (ISC License)
