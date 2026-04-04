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

4. *(Optional but recommended)* Enable autostart so SearXNG starts on login:

   ```bash
   # Copy the unit file and enable it
   mkdir -p ~/.config/systemd/user
   cp searxng.service ~/.config/systemd/user/
   systemctl --user daemon-reload
   systemctl --user enable --now searxng
   ```

   SearXNG will now start automatically when you log in. No need to `docker compose up` manually again.
   See `docs/autostart.md` for full details and troubleshooting.

5. Add this MCP block to `~/.config/opencode/opencode.json`:

   ```json
   "searxng": {
     "type": "local",
     "command": ["npx", "-y", "mcp-searxng@0.10.1"],
     "environment": { "SEARXNG_URL": "http://localhost:7790" },
     "enabled": true
   }
   ```

6. *(Optional)* Add reader-mcp for URL-to-markdown extraction:

   ```bash
   # Build the reader-mcp image (only needed once)
   docker compose build reader-mcp
   ```

   Then add this MCP entry to `opencode.json`:

   ```json
   "reader": {
     "type": "local",
     "command": ["docker", "compose", "--project-directory", "/path/to/searxng-tool", "run", "--rm", "-i", "reader-mcp"],
     "enabled": true
   }
   ```

   Run `pwd` in the repo root to get the correct absolute path.
   See [`docs/reader-mcp.md`](docs/reader-mcp.md) for full details.

7. Restart OpenCode. Test `searxng-search` and (if installed) `crawling_exa`.

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

To verify `crawling_exa` (if reader-mcp was set up):

Ask: "Use crawling_exa to fetch the content of https://example.com"

Success: returns clean markdown of the example.com page.
