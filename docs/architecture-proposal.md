# Self-Hosted SearXNG via MCP for OpenCode

## Purpose

This document proposes replacing the current project-local OpenCode tool (`.opencode/tools/searxng-search.ts`) with a Model Context Protocol (MCP) integration backed by a self-hosted SearXNG instance.

**Recommendation:** adopt **Option A** first — use the existing `mcp-searxng` package over **stdio**. It delivers the architectural benefits of MCP with the lowest implementation cost. Keep **Option B** as the upgrade path if we later need custom features, stricter control, or extended tooling.

---

## 1. Component Overview

### Components

1. **SearXNG container** — Self-hosted metasearch engine, exposes HTTP on port `8080`, must have JSON format enabled.
2. **MCP server process** — Runs locally as a stdio subprocess started by OpenCode. Translates MCP tool calls into HTTP requests to SearXNG.
3. **OpenCode client** — Reads MCP config from `opencode.json` under the `"mcp"` key. Connects to the MCP server over stdio. Makes search tools available inside OpenCode.

### High-Level Flow

```text
+------------------+        stdio         +--------------------+     HTTP JSON      +-------------------+
|     OpenCode     | <------------------> |     MCP Server     | <----------------> |  SearXNG Docker   |
|  (MCP client)    |                      | (Option A or B)    |                    |   port 8080       |
+------------------+                      +--------------------+                    +-------------------+
                                                                                            |
                                                                                            v
                                                                                   External search engines
```

### Why MCP Over the Custom Tool Approach

- Search becomes available to **all MCP-compatible AI clients**, not just OpenCode
- No per-project file copy needed
- Cleaner separation of concerns: SearXNG = backend, MCP server = protocol adapter, OpenCode = client
- Easier to maintain, version, and extend

---

## 2. Deployment Options

### Option A — Use `mcp-searxng` npm package (Recommended)

Use the published TypeScript MCP server package (`mcp-searxng` by Ihor Sokoliuk) as a local stdio subprocess.

**Pros:**
- Zero custom server code
- Fastest path to production
- Exposes `searxng_web_search` and `web_url_read` tools out of the box
- Easy to reuse across projects and AI clients

**Cons:**
- Dependent on upstream release cadence
- Limited to package behavior

**Best fit:** Get stable SearXNG-backed search into OpenCode quickly.

---

### Option B — Build a Custom TypeScript MCP Server

Implement an internal MCP server using `@modelcontextprotocol/sdk` that wraps the SearXNG JSON API directly.

**Pros:**
- Full control over tool names, schemas, and descriptions
- Can add caching, retries, query filtering, ranking, observability
- Can expose multiple tools from one server

**Cons:**
- More code to own and maintain
- Requires packaging, testing, and versioning

**Best fit:** If product-specific behavior or richer controls are required. Upgrade from Option A later.

---

## 3. Docker Compose Setup for SearXNG

### `docker-compose.yml`

```yaml
services:
  valkey:
    image: valkey/valkey:latest
    container_name: valkey
    ports:
      - "127.0.0.1:7791:6379"
    volumes:
      - valkey-data:/data
    command: valkey-server --save "" --appendonly no
    restart: unless-stopped
    cap_drop:
      - ALL
    cap_add:
      - SETGID
      - SETUID
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD", "valkey-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 64M

  searxng:
    image: searxng/searxng:latest
    container_name: searxng
    ports:
      - "127.0.0.1:7790:8080"
    volumes:
      - ./searxng/settings.yml:/etc/searxng/settings.yml:ro
      - ./searxng/uwsgi.ini:/etc/searxng/uwsgi.ini:ro
      - ./searxng/limiter.toml:/etc/searxng/limiter.toml:ro
      - searxng-data:/etc/searxng
    environment:
      - SEARXNG_BASE_URL=http://localhost:7790
    restart: unless-stopped
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
    depends_on:
      valkey:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  reader-mcp:
    build: ./reader-mcp
    container_name: reader-mcp
    restart: "no"
    stdin_open: true
    tty: false
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true

volumes:
  valkey-data:
  searxng-data:
```

### `searxng/settings.yml`

```yaml
use_default_settings: true

server:
  secret_key: "replace-with-a-random-secret"
  limiter: true
  image_proxy: false
  method: "POST"

valkey:
  url: valkey://valkey:6379/0

search:
  formats:
    - html
    - json
```

**Key settings:**
- `search.formats: [html, json]` — **required** for JSON API access (MCP server calls `?format=json`)
- `server.limiter: true` — enables rate limiting via Valkey for concurrent session tracking
- `server.secret_key` — generate with `openssl rand -hex 32`
- `valkey.url` — connection string for the Valkey rate limiting backend

### Verify it works

```bash
docker compose up -d
curl "http://localhost:7790/search?q=test&format=json" | jq '.results[0]'
```

---

## 4. OpenCode MCP Configuration

Add the `"mcp"` block to `~/.config/opencode/opencode.json` (global) or your project `opencode.json`.

### Option A — `mcp-searxng` package (stdio)

```json
{
  "mcp": {
    "searxng": {
      "type": "local",
      "command": ["npx", "-y", "mcp-searxng@0.10.1"],
      "environment": {
        "SEARXNG_URL": "http://localhost:7790"
      },
      "enabled": true
    }
  }
}
```

> Requires Node.js >= 20. Uses `npx` to auto-fetch and run the package on first use.

### Option B — Custom server (stdio)

```json
{
  "mcp": {
    "searxng": {
      "type": "local",
      "command": ["node", "./mcp-server/dist/index.js"],
      "env": {
        "SEARXNG_URL": "http://localhost:7790"
      },
      "enabled": true
    }
  }
}
```

### Environment Variables (`mcp-searxng`)

| Variable            | Required | Description                                      |
|---------------------|:--------:|--------------------------------------------------|
| `SEARXNG_URL`       | **Yes**  | Base URL of your SearXNG instance                |
| `AUTH_USERNAME`     | No       | HTTP Basic Auth username (for protected instances)|
| `AUTH_PASSWORD`     | No       | HTTP Basic Auth password                         |
| `USER_AGENT`        | No       | Custom User-Agent header                         |
| `HTTP_PROXY`        | No       | Proxy for all outgoing requests                  |
| `MCP_HTTP_PORT`     | No       | Set to enable HTTP transport instead of stdio    |

---

## 5. Comparison: Current Tool vs MCP Approach

| Dimension              | Current custom tool (`searxng-search.ts`) | MCP approach                         |
|------------------------|------------------------------------------|--------------------------------------|
| Scope                  | OpenCode only                            | Any MCP-compatible client            |
| Reuse                  | Per-project file copy required           | Shared, centralized integration      |
| Separation of concerns | Tool code mixed into project             | Clear client / server / backend split|
| Maintenance            | Duplicated across repos                  | Single update point                  |
| Extensibility          | Limited to one project                   | Reusable platform capability         |
| Transport              | Direct HTTP from tool to SearXNG         | MCP stdio → HTTP to SearXNG          |
| Upgrade path           | Manual per repo                          | Upgrade package/server once          |
| Long-term fit          | Tactical                                 | Strategic                            |

---

## 6. Migration Path

### Phase 1 — Stand Up SearXNG

1. Add `docker-compose.yml` to the repo (includes Valkey service for rate limiting)
2. Add `searxng/settings.yml` with JSON format and `server.limiter: true`
3. Add `searxng/limiter.toml` for IP allowlisting and bot detection tuning
4. Start the service: `docker compose up -d`
5. Verify: `curl "http://localhost:7790/search?q=test&format=json"`

### Phase 2 — Wire OpenCode to MCP

1. Add the `"mcp"` → `"searxng"` block to `opencode.json`
2. Restart OpenCode
3. Confirm the `searxng_web_search` tool is listed
4. Run a test search through the MCP tool

### Phase 3 — Replace the Current Custom Tool

1. Confirm MCP search is stable
2. Remove `.opencode/tools/searxng-search.ts` from active projects
3. Update documentation to reference the MCP-based path

### Phase 4 — Clean Up

1. Delete the legacy tool file from the repo
2. Remove any `SEARXNG_URL` references in the old tool context
3. Document Docker and MCP startup as part of dev environment setup

### Rollback

If MCP integration fails at any phase, restore `.opencode/tools/searxng-search.ts` and set `SEARXNG_URL` to a reachable instance. The SearXNG container is unaffected — only the adapter layer changes.

---

## 7. Final Architecture Diagram

```text
Developer / AI Client
        |
        v
   OpenCode (MCP client)
        |
      stdio
        |
        v
 MCP Server
 (Option A: mcp-searxng via npx)
 (Option B: custom TypeScript server)
        |
     HTTP JSON (?format=json)
        |
        v
 Self-hosted SearXNG (Docker, :7790)
        |
        +-------- Valkey (:7791) --------+
        |   (Rate limiting & sessions)   |
        +--------------------------------+
        |
        v
 External search providers
 (DuckDuckGo, Google, Bing, Brave, etc.)
```

---

## 8. Security Audit: `mcp-searxng`

The `mcp-searxng` package was audited against its published source code at v1.0.2. The following findings apply.

### Findings

| Severity | Finding | Details |
|----------|---------|---------|
| **CRITICAL** | SSRF in `web_url_read` — DNS rebinding & redirect bypass | The `MCP_HTTP_HARDEN` flag attempts to block local IPs but is defeated by DNS rebinding (e.g., `http://127.0.0.1.nip.io`) and HTTP redirect chains. Node's `fetch` resolves and follows these after the initial check passes. |
| **HIGH** | Unbounded memory in `web_url_read` | Entire HTTP response bodies are buffered into memory via `await response.text()` with no `Content-Length` check or size cap. A large fetch can OOM-crash the MCP process. |
| **HIGH** | Unbounded cache growth | The internal URL cache (`SimpleCache`) has TTL expiry but no maximum key/size limit. Sustained unique-URL requests cause unbounded memory growth. |
| **LOW** | Incomplete input validation | Optional search params (`pageno`, `time_range`, etc.) are not type-validated. Unlikely to cause harm in practice. |
| **NONE** | Credentials & dependencies | `AUTH_USERNAME`/`AUTH_PASSWORD` are handled safely and not logged. All dependencies are up to date — `npm audit` reports 0 vulnerabilities. |

### Risk in This Deployment

All **CRITICAL** and **HIGH** findings affect the `web_url_read` tool and the optional HTTP transport mode — **neither of which are used in the proposed local stdio deployment**. With stdio transport and `web_url_read` disabled or unused, the attack surface is limited to the search functionality itself, which is clean.

### Required Mitigations

1. **Use stdio transport only** — do not set `MCP_HTTP_PORT`. The proposed `opencode.json` config already does this.
2. **Disable `web_url_read`** if URL fetching is not needed — eliminates the entire SSRF surface. Instruct agents to use only `searxng_web_search`.
3. **Do not expose the MCP process or SearXNG port** to any external network interface.

### When to Move to Option B

If this project ever requires any of the following, build a custom MCP server (Option B) instead:

- Multi-user or network-exposed deployment
- Strict memory/resource constraints
- Response streaming or large-payload handling
- Audit logging or query policy enforcement

The audit confirms `mcp-searxng` is a **tactical choice for local dev** — well-implemented, actively maintained, and safe within its intended scope.

---

## 9. Conclusion

The MCP approach is the correct target architecture. It replaces a project-specific custom tool with a reusable integration layer that works across OpenCode and any other MCP-capable AI client.

**Recommended implementation sequence:**

1. Self-host SearXNG via Docker Compose
2. Connect OpenCode via stdio MCP using `mcp-searxng` (Option A)
3. Upgrade to a custom MCP server (Option B) only if feature pressure justifies it

## §10 — Exa Gap: URL-to-Markdown Extraction

### Gap analysis
SearXNG provides keyword-based web search but cannot fetch and clean page content. Exa's `crawling_exa` tool fills this gap by returning LLM-ready markdown from a given URL. The self-hosted equivalent is `reader-mcp`.

### Architecture
`reader-mcp` is a single-container Node.js MCP server. It uses Mozilla Readability (Firefox Reader View engine) for article extraction and Turndown for HTML→markdown conversion. It runs as a stdio MCP subprocess launched by `docker compose run`.

### SSRF threat model vs mcp-searxng §8

| Threat | mcp-searxng web_url_read | reader-mcp crawling_exa |
|--------|--------------------------|-------------------------|
| DNS rebinding bypass | ❌ Vulnerable | ✅ Post-DNS IP check |
| RFC-1918 access | ❌ Not blocked | ✅ Blocked |
| 169.254.169.254 (metadata) | ❌ Not blocked | ✅ Blocked |
| Unbounded memory | ❌ No cap | ✅ 2MB hard cap |
| Redirect to internal | ❌ Not checked | ✅ Final URL re-validated |
| Open redirect chain | ❌ Vulnerable | ✅ Blocked |

### Residual risk
A TOCTOU window exists between `dns.lookup()` and Node's internal resolver used by `fetch()`. This is inherent to application-layer SSRF mitigation. Defense-in-depth recommendation: add an egress firewall rule blocking RFC-1918 on the Docker bridge network.

### Limitations
- No JavaScript rendering — SPAs return incomplete content
- No subpage crawling
- Firecrawl (self-hosted) is the documented upgrade path if JS rendering is required

## §11 — Full Local MCP Stack

The current OpenCode MCP setup is local-first and self-hostable where possible.

| MCP name | Package / runtime | Purpose | Notes |
|---|---|---|---|
| `searxng` | `mcp-searxng@0.10.1` | Web search via local SearXNG | Runs over stdio; points to local SearXNG URL |
| `reader` | Docker `reader-mcp` (this repo) | URL-to-markdown extraction | Exposes `crawling_exa`-compatible tool; SSRF-hardened design |
| `docs-mcp-server` | `@arabold/docs-mcp-server@latest` | Library docs search/retrieval | Local scrape-first docs index; replaces cloud docs lookup workflows |
| `github` | Remote (GitHub Copilot MCP) | GitHub operations | Managed remote MCP integration |
| `playwright` | `@playwright/mcp@latest` | Browser automation | Interactive browser/task automation tools |
| `memory` | `@modelcontextprotocol/server-memory` | Persistent knowledge graph | Writes local JSONL store (for example `~/.config/opencode/memory.jsonl`) |
| `filesystem` | `@modelcontextprotocol/server-filesystem` | Scoped file read/write | Startup fails if any configured directory path is missing |

### Why `exa` and `context7` were removed

- Both were cloud-dependent MCP integrations that required API keys.
- The stack now prioritizes local/self-hosted components for privacy, portability, and lower external dependency.
- `docs-mcp-server` provides an offline scrape/index path for library docs, reducing need for cloud docs MCPs.

### What `memory` and `filesystem` add

- `memory` adds cross-session continuity through a local knowledge graph store.
- `filesystem` adds controlled local file operations across explicitly scoped directories (workspace/config paths).
