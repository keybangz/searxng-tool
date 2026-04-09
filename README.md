# searxng-tool

SearXNG-backed web search for OpenCode AI agents. Self-hosted, no API keys, no rate limits.

This repository supports two integration paths:

- **MCP server (recommended):** OpenCode connects to `mcp-searxng` over stdio, backed by a local self-hosted SearXNG instance running in Docker.
- **Legacy custom tool (still functional):** A TypeScript OpenCode plugin file (`.opencode/tool/searxng-search.ts`) for direct embedding in a project.

---

## What this project does

Gives AI agents a web search tool that aggregates results from 20+ search engines (Google, Bing, DuckDuckGo, Brave, GitHub, arXiv, StackOverflow, Wikipedia, and more) via a local SearXNG instance. Returns structured JSON — title, URL, snippet, engine, publish date — with no external API dependencies.

---

## Integration options

### 1. MCP approach (recommended)

For new setups, use OpenCode MCP config + `mcp-searxng@0.10.1`.

**Components:**

- `docker-compose.yml` — runs SearXNG locally, bound to `127.0.0.1:7790`, with Valkey as a rate-limiting backend
- `searxng/limiter.toml` — **must exist** for rate limiting to function; see [SearXNG limiter docs](https://docs.searxng.dev/admin/limiter.html)
- `npx -y mcp-searxng@0.10.1` — stdio MCP server process
- OpenCode MCP config in `opencode.json`

**OpenCode MCP block:**

```json
"searxng": {
  "type": "local",
  "command": ["npx", "-y", "mcp-searxng@0.10.1"],
  "environment": { "SEARXNG_URL": "http://localhost:7790" },
  "enabled": true
}
```

**First-run requirement:** Generate a SearXNG secret key before starting:

```bash
openssl rand -hex 32
```

Paste the output into `searxng/settings.yml` under `server.secret_key`.

---

### 2. Legacy custom tool approach

Still supported. Provides the `searxng-search` tool directly inside OpenCode without MCP.

**Tool file:** `.opencode/tool/searxng-search.ts`

**Install modes:**

- **Project-level:** place in `<project-root>/.opencode/tool/` — tool is available only in that project
- **Global:** copy to `~/.config/opencode/tools/` (plural `tools` is required)

Install dependencies:

```bash
cd .opencode
npm install
```

> [!IMPORTANT]
> The tool defaults to `http://localhost:7790` (your local SearXNG instance). Set `SEARXNG_URL` in your environment to override. Do **not** point it at a public SearXNG instance — public instances apply aggressive rate limits that will break agent search workflows.

---

## Tool interface

### `searxng-search` (legacy tool) parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | string | Yes | — | Search query |
| `num_results` | number | No | 20 | Results to return (1–50) |
| `categories` | string | No | general | Comma-separated: `general`, `it`, `science`, `news`, `social media`, `map` |
| `engines` | string | No | all | Comma-separated engine override (e.g., `google,bing`) |
| `language` | string | No | en | Language code |
| `pageno` | number | No | 1 | Page number — use higher values for more unique results |
| `time_range` | enum | No | — | `day`, `week`, `month`, `year` — filter by recency |
| `freshness_bias` | boolean | No | false | Auto-applies `month` time range when no `time_range` set |
| `safesearch` | number | No | 0 | `0` off, `1` moderate, `2` strict |

### MCP tools (via `mcp-searxng` + `reader-mcp`)

| Tool | Source | Purpose |
|---|---|---|
| `searxng_web_search` | `mcp-searxng` | Keyword web search via local SearXNG |
| `web_url_read` | `mcp-searxng` | URL fetch — see security note below |
| `crawling_exa` | `reader-mcp` | SSRF-hardened URL-to-markdown extraction |

> [!WARNING]
> `web_url_read` from `mcp-searxng` has known SSRF vulnerabilities (DNS rebinding bypass, unbounded response buffering). For URL content fetching, use `crawling_exa` from `reader-mcp` instead. See [docs/architecture-proposal.md](docs/architecture-proposal.md) §8 for the full security audit.

---

## URL-to-Markdown extraction

`reader-mcp` adds the `crawling_exa` tool so agents can fetch a URL and get clean markdown — filling the gap that keyword search alone cannot cover.

- Accepts 1–5 URLs per call
- Mozilla Readability extraction (Firefox Reader View engine)
- SSRF protection: post-DNS IP checks block all RFC-1918/loopback/link-local/metadata ranges
- 2MB response cap, 10s timeout
- Limitation: no JavaScript rendering — SPA-heavy pages return incomplete content

Full setup and API: [docs/reader-mcp.md](docs/reader-mcp.md)

---

## Example response structure

```json
{
  "query": "opencode mcp configuration",
  "resultsFound": 237,
  "results": [
    {
      "title": "OpenCode MCP docs",
      "url": "https://example.com/docs/opencode/mcp",
      "snippet": "How to configure local MCP servers in OpenCode...",
      "engine": "google",
      "publishedDate": "2025-03-15"
    }
  ],
  "answers": [],
  "formattedResults": "1. OpenCode MCP docs [2025-03-15] (via google)\n   URL: https://example.com/docs/opencode/mcp\n   How to configure local MCP servers in OpenCode..."
}
```

**Response fields:**

| Field | Description |
|---|---|
| `query` | The executed query |
| `resultsFound` | Total result count reported by SearXNG |
| `results` | Array of up to `num_results` structured results |
| `results[].publishedDate` | ISO date string when available |
| `answers` | Direct answers from SearXNG (e.g., instant answer boxes) |
| `formattedResults` | Plain-text rendering with index, date, engine |

---

## Autostart (systemd)

Run SearXNG automatically on login with no manual `docker compose` steps:

```bash
mkdir -p ~/.config/systemd/user
cp searxng.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now searxng
```

The service handles clean shutdown/reboot without hanging the system. See [docs/autostart.md](docs/autostart.md) for full details and troubleshooting.

---

## Troubleshooting

### Tool not showing in OpenCode

- Confirm config location: `~/.config/opencode/opencode.json`
- Restart OpenCode after config changes
- For legacy mode, confirm path is `~/.config/opencode/tools/` (plural)

### Valkey warning: vm.overcommit_memory

Valkey logs may show:

```
WARNING: The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.
WARNING overcommit_memory is set to 0! Background save may fail under low memory condition.
```

This is advisory only — Valkey will function normally. To silence it permanently:

```bash
echo "vm.overcommit_memory = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### MCP server starts but searches fail

```bash
docker compose ps          # Is SearXNG running?
docker compose logs -f     # Any errors?
curl "http://localhost:7790/search?q=test&format=json"  # Direct test
```

### Search returns empty results

- Try `time_range` without a value — some engines ignore time filtering
- Check `categories` — `it` only queries tech engines, `general` queries all
- Try `pageno=2` for a second page of results

### System hangs on shutdown

Re-deploy the updated unit file — the old version had a `Restart=on-failure` that caused respawning during shutdown:

```bash
cp searxng.service ~/.config/systemd/user/
systemctl --user daemon-reload
```

See [docs/autostart.md](docs/autostart.md) for the full shutdown fix explanation.

---

## Documentation map

| Document | Description |
|---|---|
| [QUICKSTART.md](QUICKSTART.md) | 5-minute setup guide |
| [OPENCODE_INSTALLATION.md](OPENCODE_INSTALLATION.md) | Full OpenCode install + configuration |
| [docs/autostart.md](docs/autostart.md) | Systemd autostart + shutdown fix |
| [docs/architecture-proposal.md](docs/architecture-proposal.md) | MCP architecture + security audit |
| [docs/reader-mcp.md](docs/reader-mcp.md) | reader-mcp reference: URL-to-markdown |

---

## License

MIT
