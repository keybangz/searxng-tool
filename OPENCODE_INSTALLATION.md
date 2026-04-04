# OpenCode Installation & Setup Guide (with SearXNG custom search tool)

OpenCode is a terminal coding assistant you run inside your project. This guide shows how to install OpenCode, connect a model provider, configure it, and set up this repository’s SearXNG-based custom search tool so you can do web search without Exa/API keys.

## Prerequisites

Before starting, make sure you have:

- A terminal emulator (macOS Terminal/iTerm2, Windows Terminal, Linux terminal)
- **Node.js or Bun** (needed to install custom tool dependencies)
- API access for at least one provider (for example OpenCode Zen, Anthropic, OpenAI, Gemini, Bedrock), unless you are using a local OpenAI-compatible endpoint (Ollama/llama.cpp)

---

## 1) Install OpenCode

### Linux / macOS / WSL

Choose one method:

```bash
# Homebrew (recommended, usually most up-to-date)
brew install anomalyco/tap/opencode
```

```bash
# Install script
curl -fsSL https://opencode.ai/install | bash
```

```bash
# npm global install
npm install -g opencode-ai
```

```bash
# Arch Linux stable repo package
sudo pacman -S opencode
```

```bash
# Arch Linux latest from AUR
paru -S opencode-bin
```

### Windows

Choose one method:

```powershell
# Chocolatey
choco install opencode
```

```powershell
# Scoop
scoop install opencode
```

### Docker (optional)

```bash
docker run -it --rm ghcr.io/anomalyco/opencode
```

### Verify install

```bash
opencode --version
```

If you see a version string, OpenCode is installed correctly.

---

## 2) Connect a model provider

You have two supported paths.

### Path A: Interactive TUI (recommended for first setup)

```bash
opencode
```

Then run:

```text
/connect
```

Follow the UI flow.

### Path B: CLI auth flow

```bash
opencode auth login
```

Credentials are stored at:

```text
~/.local/share/opencode/auth.json
```

### Provider choice notes

- **OpenCode Zen** is the easiest starting point (curated/tested models): `opencode.ai/auth`
- Also supported: Anthropic, OpenAI, Google Gemini, Amazon Bedrock
- Local options: Ollama / llama.cpp or any OpenAI-compatible endpoint

---

## 3) Configure OpenCode

OpenCode merges config from multiple locations (it does not replace one with another).

### Config files

- **Global config:** `~/.config/opencode/opencode.json`
- **Project config:** `opencode.json` in project root (**highest practical precedence** and safe to commit)
- **Schema:** `https://opencode.ai/config.json`
- **TUI config:** `tui.json` or `~/.config/opencode/tui.json` (separate from core config)

### Precedence (low → high)

1. Remote org config
2. Global config (`~/.config/opencode/opencode.json`)
3. Custom config file (`OPENCODE_CONFIG`)
4. Project config (`opencode.json`)
5. `.opencode` directory
6. Inline config (`OPENCODE_CONFIG_CONTENT`)

### Minimal working `opencode.json`

Create this in your project root:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",

  // Default model (provider/model)
  "model": "opencode/gpt-5",

  // Smaller model used for lightweight tasks (titles, etc.)
  "small_model": "opencode/gpt-5-mini",

  // Auto-update behavior: true, false, or "notify"
  "autoupdate": "notify",

  // Tool permissions: allow, deny, ask
  "permission": {
    "bash": "ask",
    "edit": "ask",
    "write": "ask",
    "webfetch": "allow"
  },

  // Disable snapshots if repo is large
  "snapshot": false
}
```

Most useful options to tune first:

- `model`
- `permission`
- `autoupdate`
- `snapshot`
- (Optional) `instructions` for project instruction files
- (Optional) `compaction.auto` (defaults to `true`)

---

## 4) First run in a project

From your project directory:

```bash
cd /path/to/project
opencode
```

Inside OpenCode:

```text
/init
```

`/init` analyzes the repo and creates `AGENTS.md`, which captures project instructions/context. In most teams, this file is worth committing.

---

## 5) Install this project’s SearXNG search tool (key step)

This repository contains a custom OpenCode tool at:

```text
.opencode/tool/searxng-search.ts
```

### What this tool does

- Adds web search via a SearXNG instance
- Works as a practical alternative to OpenCode’s built-in Exa-backed `websearch`
- **No API key required**
- More privacy-friendly / self-hostable workflow
- Does **not** require `OPENCODE_ENABLE_EXA=1`

> Built-in `websearch` uses Exa AI and may require `OPENCODE_ENABLE_EXA=1` or OpenCode provider setup. This SearXNG tool is independent of that.

### A) Project-level install (recommended for this repo)

Use this when you want the tool available only in one project.

1. Ensure the project has:
   - `.opencode/tool/searxng-search.ts`
   - `.opencode/package.json` with `@opencode-ai/plugin`
2. Install tool dependencies in the `.opencode/` directory.

```bash
cd /path/to/your/project/.opencode
npm install
# or: bun install
```

That’s it. OpenCode auto-loads tools from `.opencode/tool/`.

### B) Global install (available in all projects)

Use this when you want the tool everywhere.

1. Create global tool directory:

```bash
mkdir -p ~/.config/opencode/tools
```

2. Copy the tool file there:

```bash
cp /path/to/searxng-tool/.opencode/tool/searxng-search.ts ~/.config/opencode/tools/
```

3. Ensure a dependency file exists in `~/.config/opencode/` and install deps there:

```bash
cat > ~/.config/opencode/package.json <<'JSON'
{
  "dependencies": {
    "@opencode-ai/plugin": "latest"
  }
}
JSON

cd ~/.config/opencode
npm install
# or: bun install
```

OpenCode auto-loads from `~/.config/opencode/tools/`.

### C) Point to a different SearXNG instance

By default, this tool uses:

```text
https://search.rhscz.eu
```

Override it with `SEARXNG_URL`:

```bash
export SEARXNG_URL="https://your-searxng.example.com"
```

To persist it, add that `export` to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) and restart the shell.

### D) Verify the tool works

1. Start OpenCode in a project where tool is installed:

```bash
cd /path/to/project
opencode
```

2. Ask it to perform a web search, for example:

```text
Use the searxng-search tool to search: "OpenCode /init command"
```

If you get search results (titles/URLs/snippets), setup is successful.

---

## 5b) MCP-based SearXNG (recommended for new setups)

The project also ships a fully self-hosted MCP architecture using Docker Compose + the `mcp-searxng` MCP server. This approach is more portable, reusable across projects, and doesn't require copying tool files.

See [docs/architecture-proposal.md](docs/architecture-proposal.md) for the full design and setup instructions.

## 6) Quick reference

### TUI commands

| Command | What it does |
|---|---|
| `/connect` | Connect or switch provider |
| `/init` | Analyze project, generate `AGENTS.md` |
| `/share` | Share current session |
| `/undo` | Undo last change |
| `/redo` | Redo change |
| `/help` | Show command help and shortcuts |
| `Tab` | Toggle Plan mode ↔ Build mode |

### Common CLI commands

| Command | What it does |
|---|---|
| `opencode --version` | Check installed version |
| `opencode` | Launch TUI in current directory |
| `opencode auth login` | Authenticate provider from CLI |

### Useful environment variables

| Variable | Purpose |
|---|---|
| `SEARXNG_URL` | Override SearXNG base URL for this custom tool |
| `OPENCODE_CONFIG` | Use an explicit custom config file |
| `OPENCODE_CONFIG_DIR` | Use an explicit custom config directory |
| `OPENCODE_ENABLE_EXA=1` | Enables built-in Exa websearch (not needed for SearXNG tool) |

---

## 7) Troubleshooting

### 1) `opencode: command not found`

- Re-open terminal after install
- Check your package manager path setup
- Re-run install using another method (Homebrew/npm/choco/scoop)
- Verify with `opencode --version`

### 2) Provider login works, but model calls fail

- Re-run `/connect` or `opencode auth login`
- Confirm credentials in `~/.local/share/opencode/auth.json`
- Verify `model` in `opencode.json` matches an actually available provider/model

### 3) Custom SearXNG tool not appearing

- Confirm file path is exactly:
  - Project: `.opencode/tool/searxng-search.ts`, or
  - Global: `~/.config/opencode/tool/searxng-search.ts`
- Confirm dependency install happened in the matching `.opencode`/config directory:
  - `npm install` or `bun install`
- Restart OpenCode after adding files/dependencies

### 4) Search tool loads, but requests fail

- Check your `SEARXNG_URL`
- Try curl manually:

```bash
curl -I "$SEARXNG_URL"
```

- If using a private/self-hosted instance, verify network access and TLS certs

### 5) Settings don’t seem to apply

- Remember config is merged by precedence
- Project `opencode.json` overrides global
- `OPENCODE_CONFIG` / `OPENCODE_CONFIG_CONTENT` can override both
- Inspect shell env for unexpected overrides

### 6) Exa websearch confusion

- Built-in `websearch` uses Exa AI and may need `OPENCODE_ENABLE_EXA=1`
- This SearXNG custom tool is separate and does **not** need Exa env vars or API keys
- If you only want SearXNG, just install the custom tool and use it explicitly

---

You now have OpenCode installed, connected, configured, and extended with this project’s SearXNG search tool.
