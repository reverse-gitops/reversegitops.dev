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

## Attributions

- The GitOps movement as managed by [OpenGitOps](https://github.com/open-gitops) project (CC BY 4.0)
- GitHub corner ribbon by [Tim Holman](https://github.com/tholman/github-corners) (MIT License)
- Logo based on the [Combine](https://lucide.dev/icons/combine) icon by [Lucide](https://lucide.dev) (ISC License)
