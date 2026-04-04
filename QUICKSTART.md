# Quickstart

Set up SearXNG-backed search in OpenCode in a few minutes.

## Option A: MCP (recommended)

1. Install Docker and Docker Compose  
   https://docs.docker.com/get-docker/

2. Generate a SearXNG secret key:

   ```bash
   openssl rand -hex 32
   ```

   Paste the output into `searxng/settings.yml` under:

   ```yaml
   server:
     secret_key: "<paste-generated-key>"
   ```

3. Start SearXNG:

   ```bash
   docker compose up -d
   ```

4. Add this MCP block to `~/.config/opencode/opencode.json`:

   ```json
   "searxng": {
     "type": "local",
     "command": ["npx", "-y", "mcp-searxng@0.10.1"],
     "environment": { "SEARXNG_URL": "http://localhost:8080" },
     "enabled": true
   }
   ```

5. Restart OpenCode. The `searxng-search` tool should now be available.

---

## Option B: Legacy custom tool

1. Copy the tool file to global OpenCode tools directory (**plural**):

   ```bash
   cp .opencode/tool/searxng-search.ts ~/.config/opencode/tools/
   ```

2. Install dependencies:

   ```bash
   cd ~/.config/opencode
   npm install
   ```

3. Restart OpenCode.

4. Optional: point to a custom SearXNG instance by setting `SEARXNG_URL`.  
   Default if unset: `https://search.rhscz.eu`

---

## Verify it works

Ask an OpenCode agent:

```text
Search for "SearXNG documentation" using searxng-search.
```

Success looks like:
- Tool call to `searxng-search`
- JSON response with `query`, `results`, and `formattedResults`
- At least one result containing `title`, `url`, and `snippet`

If it fails, see `README.md` troubleshooting and `docs/architecture-proposal.md`.
