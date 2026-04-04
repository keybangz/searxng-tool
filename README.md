# searxng-tool

SearXNG-backed web search for OpenCode AI agents.

This repository supports two integration paths:
- **MCP server (recommended):** OpenCode connects to `mcp-searxng` over stdio, usually backed by a local self-hosted SearXNG instance.
- **Legacy custom tool (still functional):** a TypeScript OpenCode tool file (`.opencode/tool/searxng-search.ts`) using `@opencode-ai/plugin@1.3.13`.

---

## What this project does

`searxng-tool` gives agents a search tool named **`searxng-search`** that returns web results as structured JSON (title, URL, snippet, engine, plus formatted text).

Use it when you want agent-accessible search with SearXNG rather than direct calls to commercial search APIs.

---

## Integration options

## 1) MCP approach (recommended)

For new setups, use OpenCode MCP config + `mcp-searxng@0.10.1`.

### Components
- `docker-compose.yml` at repository root: runs a local SearXNG service (bound to `127.0.0.1:7790`)
- `npx -y mcp-searxng@0.10.1`: stdio MCP server process
- OpenCode MCP config in `opencode.json`

### OpenCode MCP block

```json
"searxng": {
  "type": "local",
  "command": ["npx", "-y", "mcp-searxng@0.10.1"],
  "environment": { "SEARXNG_URL": "http://localhost:7790" },
  "enabled": true
}
```

### First-run requirement
Before starting SearXNG the first time, generate and set a secret:

```bash
openssl rand -hex 32
```

Paste it into `searxng/settings.yml` under `server.secret_key`.

---

## 2) Legacy custom tool approach

Still supported for existing OpenCode custom-tool setups.

### Tool file
- Path in this repo: `.opencode/tool/searxng-search.ts`

### Runtime dependency
- `@opencode-ai/plugin@1.3.13`

### Install modes
- **Global install:** copy `searxng-search.ts` to `~/.config/opencode/tools/` (**plural `tools` is required**)
- **Project install:** place it in `<project-root>/.opencode/tool/`

Then install dependencies inside `.opencode/`:

```bash
cd .opencode
npm install
```

### Default backend URL
If `SEARXNG_URL` is not set, the legacy tool defaults to:

```text
https://search.rhscz.eu
```

---

## Tool interface

Both approaches expose the same search parameters:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | Search query |
| `categories` | string | No | Comma-separated categories |
| `language` | string | No | Language code (for example `en`, `de`) |
| `pageno` | number | No | Page number (default: 1) |
| `time_range` | enum | No | `day`, `month`, or `year` |
| `safesearch` | number | No | `0` (off), `1` (moderate), `2` (strict) |

### MCP tool listing

| Tool | Source | Purpose |
|---|---|---|
| `searxng_web_search` | `mcp-searxng` | Keyword-based web search via SearXNG |
| `crawling_exa` | `reader-mcp` | URL-to-markdown extraction for LLM-ready page content |

## URL-to-Markdown Extraction

`reader-mcp` adds the `crawling_exa` tool so agents can fetch a URL and get cleaned markdown (the gap SearXNG search alone does not cover).

- SSRF protection: post-DNS IP checks block loopback/private/link-local/metadata ranges, with final-URL re-validation after redirects.
- Limitation: no JavaScript rendering, so SPA-heavy pages may return incomplete content.
- Full setup, threat model, and API details: [`docs/reader-mcp.md`](./docs/reader-mcp.md).

---

## Example response structure

Typical `searxng-search` output:

```json
{
  "query": "opencode mcp configuration",
  "resultsFound": 237,
  "results": [
    {
      "title": "OpenCode MCP docs",
      "url": "https://example.com/docs/opencode/mcp",
      "snippet": "How to configure local MCP servers in OpenCode...",
      "engine": "duckduckgo"
    }
  ],
  "formattedResults": "1. OpenCode MCP docs\\n   URL: https://example.com/docs/opencode/mcp\\n   How to configure local MCP servers in OpenCode..."
}
```

Fields:
- `query`: executed query
- `resultsFound`: total result count if available
- `results`: up to 10 structured results
- `formattedResults`: plain-text rendering useful for logs/debugging

---

## Security note

`mcp-searxng` includes additional MCP tools such as `web_url_read`.

- In this project, run MCP as a **local stdio-only** server from OpenCode.
- `web_url_read` can introduce **SSRF risk** if exposed in less-trusted networked deployments.
- For threat model, mitigations, and deployment guidance, read **`docs/architecture-proposal.md` §8**.

---

## Troubleshooting

### Tool not showing in OpenCode
- Confirm config location: `~/.config/opencode/opencode.json`
- Restart OpenCode after config changes
- For legacy mode, confirm path is `~/.config/opencode/tools/` (not `tool/`)

### MCP server starts but searches fail
- Check SearXNG is running: `docker compose ps`
- Verify URL in MCP environment: `SEARXNG_URL=http://localhost:7790`
- Check container logs: `docker compose logs -f`

### Legacy tool fails to execute
- Run dependency install in `.opencode/`: `npm install`
- Ensure your configured `SEARXNG_URL` is reachable
- If unset, it will use `https://search.rhscz.eu`

---

## Documentation map

- **5-minute setup:** [`QUICKSTART.md`](./QUICKSTART.md)
- **Full OpenCode setup:** [`OPENCODE_INSTALLATION.md`](./OPENCODE_INSTALLATION.md)
- **Architecture deep-dive:** [`docs/architecture-proposal.md`](./docs/architecture-proposal.md)

---

## License

Released under the **MIT License**.
