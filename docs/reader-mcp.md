# reader-mcp: URL-to-Markdown Extraction

`reader-mcp` is a self-hosted MCP server that fetches a URL and returns clean, LLM-ready markdown. It is the self-hosted equivalent of Exa's `crawling_exa` tool — the tool name is intentionally identical for agent compatibility.

## What it does

- Accepts 1–5 URLs per call
- Fetches each URL with a 10-second timeout and 2MB response cap
- Extracts article content using [Mozilla Readability](https://github.com/mozilla/readability) (the same engine as Firefox Reader View)
- Converts HTML to clean markdown via [Turndown](https://github.com/mixmark-io/turndown)
- Strips noise: `<script>`, `<style>`, `<nav>`, `<footer>`, `<aside>`, `<iframe>`
- Returns truncated output at `maxCharacters` (default 3000, max 50000)

## What it does NOT do

- **No JavaScript rendering** — SPAs and heavily dynamic pages (React/Vue apps, Twitter, GitHub PR diffs) will return incomplete or empty content. For JS-rendered pages, Firecrawl (self-hosted) is the upgrade path.
- No subpage crawling — one URL = one fetch

## Architecture

```
OpenCode agent
    │
    │ stdio (MCP protocol)
    ▼
docker compose run --rm -i reader-mcp
    │
    │ SSRF-guarded HTTP fetch
    ▼
Public internet (RFC-1918, loopback, link-local blocked)
```

`reader-mcp` does not bind any network ports. It communicates exclusively over stdio — no network exposure whatsoever.

## SSRF security model

reader-mcp implements post-DNS SSRF protection:

1. URL is parsed — only `http:` and `https:` protocols accepted
2. Hostname is resolved via `dns.lookup({ all: true })` — **all returned IPs are checked**
3. Any IP in the following ranges causes an immediate error: loopback (127.0.0.0/8, ::1), RFC-1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), link-local (169.254.0.0/16, fe80::/10), unique-local IPv6 (fc00::/7), multicast
4. After `fetch()` follows redirects, the final URL is re-validated — prevents open-redirect chaining

This closes the DNS-rebinding bypass that affects `mcp-searxng`'s `web_url_read` (documented in `docs/architecture-proposal.md §8`).

**Residual risk:** There is a small TOCTOU window between `dns.lookup` and Node's internal resolver used by `fetch`. This is a known limitation of application-layer SSRF mitigations. For defense-in-depth, add an egress firewall rule blocking RFC-1918 on the Docker network interface.

## Installation

### 1. Build the Docker image

From the repo root:

```bash
docker compose build reader-mcp
```

This only needs to be run once (or after updating the repo).

### 2. Add to opencode.json

Add the following to the `mcp` object in `~/.config/opencode/opencode.json`. Replace `/path/to/searxng-tool` with the absolute path to your cloned repo (run `pwd` from the repo root to get it):

```json
"reader": {
  "type": "local",
  "command": ["docker", "compose", "--project-directory", "/path/to/searxng-tool", "run", "--rm", "-i", "reader-mcp"],
  "enabled": true
}
```

### 3. Restart OpenCode

The `crawling_exa` tool will be available immediately.

> **Note:** `reader-mcp` is invoked on-demand — there is no persistent container to manage. Each call to `crawling_exa` spins up a short-lived container, fetches the URL, and exits.

## Tool reference

### `crawling_exa`

Fetch URLs and return clean markdown.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `urls` | `string[]` | required | 1–5 URLs to fetch |
| `maxCharacters` | `number` | `3000` | Max chars per URL (500–50000) |

Returns an array of `{ url, markdown, characters }` objects, or `{ url, error }` on failure.

## Troubleshooting

### `SSRF: blocked IP address` or `resolves to blocked address`
The URL resolves to a private/internal IP. This is intentional SSRF protection.

### `Response exceeds 2MB size cap`
The page is too large. Increase is not recommended — large pages indicate non-article content (e.g., data dumps). Use a more specific URL.

### `HTTP 4xx / 5xx`
The target server rejected the request. Check the URL or try in a browser.

### `docker compose run` is slow on first call
The image is already built, but container startup adds ~200-400ms. This is expected for stdio-based Docker MCP servers.

### Empty or poor markdown output
The page likely requires JavaScript rendering. reader-mcp cannot help here — see Firecrawl for JS-heavy sites.
