# OpenCode Installation & Setup Guide

OpenCode is a terminal coding assistant you run inside your project. This guide covers installing OpenCode, connecting a model provider, configuring it, and setting up this repository's SearXNG-based search tool for web search without API keys.

---

## Prerequisites

- A terminal emulator (macOS Terminal/iTerm2, Windows Terminal, Linux terminal)
- **Node.js or Bun** — needed to install custom tool dependencies
- API access for at least one provider (Anthropic, OpenAI, Google Gemini, Bedrock, etc.), or a local OpenAI-compatible endpoint (Ollama/llama.cpp)

---

## 1. Install OpenCode

### Linux / macOS / WSL

```bash
# Homebrew (recommended)
brew install anomalyco/tap/opencode

# Install script
curl -fsSL https://opencode.ai/install | bash

# npm global
npm install -g opencode-ai

# Arch Linux (stable)
sudo pacman -S opencode

# Arch Linux (AUR, latest)
paru -S opencode-bin
```

### Windows

```powershell
# Chocolatey
choco install opencode

# Scoop
scoop install opencode
```

### Docker

```bash
docker run -it --rm ghcr.io/anomalyco/opencode
```

### Verify

```bash
opencode --version
```

---

## 2. Connect a model provider

### Interactive TUI (recommended)

```bash
opencode
```

Then run `/connect` and follow the UI flow.

### CLI auth

```bash
opencode auth login
```

Credentials stored at `~/.local/share/opencode/auth.json`.

**Provider options:**

- **OpenCode Zen** — easiest starting point: `opencode.ai/auth`
- Anthropic, OpenAI, Google Gemini, Amazon Bedrock
- Local: Ollama / llama.cpp or any OpenAI-compatible endpoint

---

## 3. Configure OpenCode

### Config file locations

| File | Scope |
|---|---|
| `~/.config/opencode/opencode.json` | Global defaults |
| `opencode.json` in project root | Project override (highest practical precedence, safe to commit) |
| `tui.json` or `~/.config/opencode/tui.json` | TUI-specific settings |

**Precedence (low → high):** remote org → global → `OPENCODE_CONFIG` → project → `.opencode` dir → `OPENCODE_CONFIG_CONTENT`

### Minimal `opencode.json`

```jsonc
{
  "$schema": "https://opencode.ai/config.json",

  // Default model (provider/model)
  "model": "opencode/gpt-5",

  // Lightweight model for titles and short tasks
  "small_model": "opencode/gpt-5-mini",

  // Auto-update: true, false, or "notify"
  "autoupdate": "notify",

  // Tool permissions: allow, deny, ask
  "permission": {
    "bash": "ask",
    "edit": "ask",
    "write": "ask",
    "webfetch": "allow"
  },

  "snapshot": false
}
```

---

## 4. First run in a project

```bash
cd /path/to/project
opencode
```

Then run `/init` — it analyses the repo and creates `AGENTS.md` with project instructions. Worth committing to your repo.

---

## 5. Install this project's SearXNG search tool

### What it does

Adds web search via a local SearXNG instance — a practical alternative to OpenCode's built-in Exa-backed `websearch`. No API key required. Queries 20+ search engines simultaneously.

> [!NOTE]
> The built-in `websearch` uses Exa AI and may require `OPENCODE_ENABLE_EXA=1`. This SearXNG tool is completely independent and does not need Exa env vars.

### A) Project-level install (recommended for this repo)

Ensure the project has:
- `.opencode/tool/searxng-search.ts`
- `.opencode/package.json` with `@opencode-ai/plugin`

Install dependencies:

```bash
cd /path/to/your/project/.opencode
npm install
# or: bun install
```

OpenCode auto-loads tools from `.opencode/tool/`.

### B) Global install (available in all projects)

```bash
# Create global tool directory
mkdir -p ~/.config/opencode/tools

# Copy the tool
cp /path/to/searxng-tool/.opencode/tool/searxng-search.ts ~/.config/opencode/tools/

# Create package.json and install deps
cat > ~/.config/opencode/package.json <<'JSON'
{
  "dependencies": {
    "@opencode-ai/plugin": "latest"
  }
}
JSON

cd ~/.config/opencode
npm install
```

### C) SearXNG URL configuration

> [!IMPORTANT]
> The tool defaults to `http://localhost:7790` (your local Docker instance). This requires the SearXNG container to be running (`docker compose up -d`).
>
> Do **not** point the tool at a public SearXNG instance — public instances apply aggressive rate limits that break agent workflows. The previous default (`search.rhscz.eu`) has been removed for this reason.

Override with `SEARXNG_URL`:

```bash
export SEARXNG_URL="http://localhost:7790"
```

Add to your shell profile to persist (`~/.bashrc`, `~/.zshrc`, etc.).

### D) Tool parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `query` | string | required | Search query |
| `num_results` | number | 20 | Results to return (1–50) |
| `categories` | string | general | `general`, `it`, `science`, `news`, `social media`, `map` |
| `engines` | string | all | Comma-separated engine override |
| `language` | string | en | Language code |
| `pageno` | number | 1 | Page number |
| `time_range` | enum | — | `day`, `week`, `month`, `year` |
| `freshness_bias` | boolean | false | Auto-applies `month` range when no `time_range` set |
| `safesearch` | number | 0 | `0` off, `1` moderate, `2` strict |

### E) Verify the tool works

```bash
cd /path/to/project
opencode
```

Ask:

```
Use the searxng-search tool to search for "OpenCode /init command"
```

Success: results with titles, URLs, and snippets.

---

## 5b. MCP-based SearXNG (recommended for new setups)

See [QUICKSTART.md](QUICKSTART.md) for the full MCP setup. Add to `opencode.json`:

```json
{
  "mcp": {
    "searxng": {
      "type": "local",
      "command": ["npx", "-y", "mcp-searxng@0.10.1"],
      "environment": { "SEARXNG_URL": "http://localhost:7790" },
      "enabled": true
    }
  }
}
```

---

## 5c. URL-to-Markdown MCP (reader-mcp)

Adds `crawling_exa` for fetching full page content as markdown. SSRF-hardened.

```json
"reader": {
  "type": "local",
  "command": ["docker", "compose", "--project-directory", "/path/to/searxng-tool", "run", "--rm", "-i", "reader-mcp"],
  "enabled": true
}
```

Full setup: [docs/reader-mcp.md](docs/reader-mcp.md)

---

## 5d. Additional recommended MCPs

### `memory` — Persistent knowledge graph

```json
"memory": {
  "type": "local",
  "command": ["bunx", "-y", "@modelcontextprotocol/server-memory"],
  "environment": {
    "MEMORY_FILE_PATH": "/home/<user>/.config/opencode/memory.jsonl"
  },
  "enabled": true
}
```

### `filesystem` — Scoped file access

```json
"filesystem": {
  "type": "local",
  "command": [
    "bunx", "-y", "@modelcontextprotocol/server-filesystem",
    "/mnt/extra_ssd/Github",
    "/home/<user>/.config/opencode"
  ],
  "enabled": true
}
```

> [!WARNING]
> `server-filesystem` exits immediately at startup if **any** declared directory does not exist. Verify all paths exist before launching OpenCode.

---

## 5e. Autostart with systemd

Run SearXNG automatically on login:

```bash
mkdir -p ~/.config/systemd/user
cp searxng.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now searxng
```

The service shuts down cleanly on reboot and shutdown without hanging the system. See [docs/autostart.md](docs/autostart.md) for full details.

> [!NOTE]
> If you previously installed an older version of the service, re-copy and reload — the old version had a `Restart=on-failure` setting that caused shutdown hangs.

---

## 6. Quick reference

### TUI commands

| Command | What it does |
|---|---|
| `/connect` | Connect or switch provider |
| `/init` | Analyse project, generate `AGENTS.md` |
| `/share` | Share current session |
| `/undo` | Undo last change |
| `/redo` | Redo change |
| `/help` | Show command help and shortcuts |
| `Tab` | Toggle Plan mode ↔ Build mode |

### CLI commands

| Command | What it does |
|---|---|
| `opencode --version` | Check installed version |
| `opencode` | Launch TUI in current directory |
| `opencode auth login` | Authenticate provider from CLI |

### Environment variables

| Variable | Purpose |
|---|---|
| `SEARXNG_URL` | Override SearXNG base URL (default: `http://localhost:7790`) |
| `OPENCODE_CONFIG` | Use an explicit custom config file |
| `OPENCODE_CONFIG_DIR` | Use an explicit custom config directory |
| `OPENCODE_ENABLE_EXA=1` | Enables built-in Exa websearch (not needed for this SearXNG tool) |

---

## 7. Troubleshooting

### `opencode: command not found`

Re-open terminal after install. Try a different install method. Verify with `opencode --version`.

### Provider login works but model calls fail

Re-run `/connect` or `opencode auth login`. Verify credentials at `~/.local/share/opencode/auth.json`. Confirm the `model` in `opencode.json` matches an available provider/model.

### Custom SearXNG tool not appearing

- Confirm file path is exactly `.opencode/tool/searxng-search.ts` (project) or `~/.config/opencode/tools/searxng-search.ts` (global)
- Run `npm install` or `bun install` in the matching directory
- Restart OpenCode

### Search tool loads but requests fail

```bash
curl "http://localhost:7790/search?q=test&format=json"
docker compose ps
docker compose logs -f
```

Ensure `SEARXNG_URL=http://localhost:7790`.

### System hangs on shutdown

Re-deploy the updated unit file:

```bash
cp searxng.service ~/.config/systemd/user/
systemctl --user daemon-reload
```

See [docs/autostart.md](docs/autostart.md) for the full explanation.

### MCP server connection closes immediately (`-32000`)

Most commonly caused by `@modelcontextprotocol/server-filesystem` failing at startup — exits if any declared directory path does not exist. Remove the missing path from the command args or create it, then restart OpenCode.

### Settings don't apply

Config is merged by precedence. Project `opencode.json` overrides global. Inspect shell env for unexpected `OPENCODE_CONFIG`/`OPENCODE_CONFIG_CONTENT` overrides.
