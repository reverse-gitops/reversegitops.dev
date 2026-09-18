# Agent readiness: what is done, what is open

This site should be easy for crawlers, language models, and agents to read. The
manifesto exists to be spread, so the default answer to "may I read this?" is yes.

This file records what is in place, what is still open, and why the open items are
blocked on hosting decisions rather than on writing code.

## Background: we were blocking by default

Cloudflare sits in front of this domain, and its managed bot preferences were
blocking AI crawlers. Nobody chose that for this site; it was the default, and it
stayed on for months while the whole point of the project was to get the idea in
front of people. Cloudflare's "Bot Preference Sync" also meant Cloudflare answered
`/robots.txt` on our behalf, so the origin's own rules never reached anyone.

Bot Preference Sync is now disabled. The origin serves its own `robots.txt` again.

The lesson worth keeping: a proxy can quietly hold an opinion about your content
that you never agreed to. Check what the edge says on your behalf.

## Done (in this repo)

| What | Where |
| --- | --- |
| `robots.txt` — everyone allowed, Content Signals `search=yes, ai-input=yes, ai-train=yes` | `public/robots.txt` |
| Named AI crawler groups repeating the same permissive rules | `public/robots.txt` |
| `sitemap.xml`, derived from `src/pages` so it cannot drift | `src/pages/sitemap.xml.ts` |
| `llms.txt` — plain-text summary of the site and the pattern | `public/llms.txt` |
| ARD capability manifest | `public/.well-known/ai-catalog.json` |
| `<link rel="sitemap">` and `<link rel="alternate">` to `llms.txt` | `src/layouts/Layout.astro` |

A crawler that matches one of the named groups in `robots.txt` ignores the
wildcard group entirely (RFC 9309), which is why the permissive rules are
repeated rather than inherited. When pages are added or removed, the sitemap
follows automatically; nothing needs updating by hand.

## Open: blocked on the hosting setup

These need control over HTTP response headers or DNS. GitHub Pages serves static
files and will not set custom headers, and the Cloudflare features that would do
it at the edge are either behind a paid plan on this account or not something we
want to depend on long term.

### 1. `Link` response headers (RFC 8288)

Agents look for discovery hints in headers, not just in HTML. The homepage should
send something like:

```
Link: </llms.txt>; rel="alternate"; type="text/plain",
      </sitemap.xml>; rel="sitemap",
      </.well-known/ai-catalog.json>; rel="service-desc"
```

The `<link>` tags in `Layout.astro` are the in-page equivalent and cover agents
that parse HTML, but header-based checks will not see them.

*Blocked by:* no header control on GitHub Pages. Doable at the edge with a
Cloudflare response header transform rule; doable trivially with any origin we
run ourselves.

### 2. Markdown for Agents

Requests sending `Accept: text/markdown` should get markdown back, with HTML
staying the default for browsers. Verified as not happening today — the homepage
returns `text/html` either way.

Worth noting that this site is *already* markdown underneath: the manifesto is
fetched from `reverse-gitops/manifesto` as `README.md` at build time and rendered
with `marked`. Serving the markdown is a matter of emitting it, not converting
anything. Self-hosted, this is a content negotiation branch and a second build
output, not a platform feature we rent.

*Blocked by:* a Cloudflare feature on this account, where the repo could do it
directly given a real origin.

### 3. DNS for AI Discovery (DNS-AID)

SVCB/HTTPS records under `_index._agents.reversegitops.dev` pointing at the
discovery documents, with DNSSEC on the zone so validating resolvers get
authenticated answers.

*Blocked by:* nothing expensive — this is DNS, and it is achievable wherever the
zone lives. It is parked because the spec is still an IETF draft
(`draft-mozleywilliams-dnsop-dnsaid`) and it is the lowest-value item here. Pick
it up once the zone has moved and settled.

### 4. Check what the edge blocks

Independently of `robots.txt`: if any managed AI-bot blocking is still active in
Cloudflare's AI Crawl Control, it overrides our permissive rules at the edge. A
crawler never reaches the origin to read the welcome. Re-verify after any change
to the proxy setup.

## Not applicable

Several agent-readiness checks assume a site with an API behind it. This domain
serves documentation only, so these are deliberately absent rather than missing:

- `/.well-known/api-catalog` (RFC 9727)
- `/.well-known/openid-configuration`, `/.well-known/oauth-authorization-server`
- `/.well-known/oauth-protected-resource` (RFC 9728)
- `auth.md`
- `/.well-known/mcp/server-card.json`
- `/.well-known/agent-skills/index.json` — no skills to publish
- WebMCP tools

Publishing empty versions of these would satisfy a checker while pointing agents
at nothing, which is worse than not publishing them.

## The direction

The intent is to move the public sites onto our own cluster, and to stop
depending on GitHub Pages. Cloudflare may stay as a proxy, or go entirely. Either
way, once there is an origin we control:

- `Link` headers become a few lines of server config.
- Markdown content negotiation becomes part of the build, using markdown we
  already have.
- Nothing about discovery is gated behind someone else's pricing tier or their
  default opinion about who may read this.

There is a certain symmetry in a project about owning your own control plane
being blocked by someone else's defaults. Worth finishing.

## How to verify

```sh
curl -sS https://reversegitops.dev/robots.txt
curl -sS https://reversegitops.dev/sitemap.xml
curl -sS https://reversegitops.dev/llms.txt
curl -sS https://reversegitops.dev/.well-known/ai-catalog.json | python3 -m json.tool
curl -sS -D - -o /dev/null https://reversegitops.dev/ | grep -i '^link:'
curl -sS -D - -o /dev/null -H 'Accept: text/markdown' https://reversegitops.dev/ | grep -i '^content-type:'
```

The last two are the open items: today they return nothing and `text/html`.
