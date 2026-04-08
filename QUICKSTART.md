# Quickstart

Set up SearXNG-backed search in OpenCode in under 5 minutes.

---

## Option A: MCP (recommended)

### 1. Install Docker

[https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

### 2. Generate a SearXNG secret key

```bash
openssl rand -hex 32
```

Paste the output into `searxng/settings.yml` under `server.secret_key`:

```yaml
server:
  secret_key: "paste-your-key-here"
```

### 3. Start SearXNG

```bash
docker compose up -d
```

Verify it works:

```bash
curl "http://localhost:7790/search?q=test&format=json" | head -c 200
```

### 4. Enable autostart (recommended)

So SearXNG starts on login without manual intervention:

```bash
mkdir -p ~/.config/systemd/user
cp searxng.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now searxng
```

> [!TIP]
> The service handles clean shutdown and reboot without hanging the system. See [docs/autostart.md](docs/autostart.md) for details and troubleshooting.

### 5. Add MCP config to OpenCode

Add to `~/.config/opencode/opencode.json` under the `"mcp"` key:

```json
"searxng": {
  "type": "local",
  "command": ["npx", "-y", "mcp-searxng@0.10.1"],
  "environment": { "SEARXNG_URL": "http://localhost:7790" },
  "enabled": true
}
```

### 6. (Optional) Add reader-mcp for URL-to-markdown

Build the image once:

```bash
docker compose build reader-mcp
```

Add to `opencode.json`:

```json
"reader": {
  "type": "local",
  "command": ["docker", "compose", "--project-directory", "/absolute/path/to/searxng-tool", "run", "--rm", "-i", "reader-mcp"],
  "enabled": true
}
```

Run `pwd` in the repo root to get the absolute path.

See [docs/reader-mcp.md](docs/reader-mcp.md) for full details.

### 7. Restart OpenCode

Test with:

```
Search for "SearXNG documentation" using searxng-search.
```

---

## Option B: Legacy custom tool

### 1. Copy the tool file

```bash
# Global (available in all projects)
cp .opencode/tool/searxng-search.ts ~/.config/opencode/tools/

# Or project-level (copy to .opencode/tool/ in your project)
```

### 2. Install dependencies

```bash
cd ~/.config/opencode
npm install
```

### 3. Restart OpenCode

> [!IMPORTANT]
> The tool defaults to `http://localhost:7790`. It requires a local SearXNG instance running (`docker compose up -d`). Do **not** point it at a public SearXNG instance — public instances rate-limit aggressively and will break agent workflows.

---

## Verify it works

Ask an OpenCode agent:

```
Search for "SearXNG documentation" using searxng-search.
```

**Expected response:**
- Tool call to `searxng-search` or `searxng_web_search`
- JSON with `query`, `results` array, `formattedResults`
- At least one result with `title`, `url`, and `snippet`

**Verify `crawling_exa`** (if reader-mcp was set up):

```
Use crawling_exa to fetch the content of https://example.com
```

Expected: clean markdown of the page.

---

## Troubleshooting quick reference

| Problem | Fix |
|---|---|
| No search results | Check `docker compose ps` — is SearXNG running? |
| Rate limit errors | Ensure `SEARXNG_URL=http://localhost:7790` — never use a public instance |
| Tool not in OpenCode | Check `~/.config/opencode/tools/` (plural), restart OpenCode |
| Shutdown hang | Re-deploy updated `searxng.service` — see [docs/autostart.md](docs/autostart.md) |
| `crawling_exa` slow | Expected ~200-400ms container startup per call |
```
