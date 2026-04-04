# Autostart: Running SearXNG on Login

This guide sets up SearXNG as a user-level systemd service so it starts automatically when you log in. Once enabled, OpenCode's MCP search tool works immediately without any manual `docker compose` steps.

## Prerequisites

- Linux with systemd (most modern distros)
- Docker installed and your user added to the `docker` group
- The project cloned to `~/Github/searxng-tool` (or adjust `WorkingDirectory` in the unit file)

> **Not on Linux?** macOS users can use a Launch Agent instead — see the macOS section at the bottom.

---

## Setup

### 1. Copy the unit file

```bash
mkdir -p ~/.config/systemd/user
cp /path/to/searxng-tool/searxng.service ~/.config/systemd/user/
```

### 2. Reload systemd and enable the service

```bash
systemctl --user daemon-reload
systemctl --user enable --now searxng
```

`--now` starts it immediately in addition to enabling it at login.

### 3. Verify it's running

```bash
systemctl --user status searxng
```

You should see `Active: active (exited)` — this is correct for a `Type=oneshot` service. It means the `docker compose up -d` command completed successfully and the containers are running in the background.

Confirm Docker has the container up:

```bash
docker ps | grep searxng
```

---

## Managing the service

| Task | Command |
|------|---------|
| Start manually | `systemctl --user start searxng` |
| Stop SearXNG | `systemctl --user stop searxng` |
| Restart | `systemctl --user restart searxng` |
| Disable autostart | `systemctl --user disable searxng` |
| View logs | `journalctl --user -u searxng` |

---

## Updating the project path

The unit file uses `WorkingDirectory=%h/Github/searxng-tool` where `%h` expands to your home directory at runtime. If you cloned the repo elsewhere, edit the unit file before copying:

```bash
# Example: cloned to ~/projects/searxng-tool
sed -i 's|%h/Github/searxng-tool|%h/projects/searxng-tool|' searxng.service

# Example: cloned outside $HOME (e.g. a separate drive)
sed -i 's|%h/Github/searxng-tool|/mnt/data/searxng-tool|' searxng.service
```

Then re-copy and reload:

```bash
cp searxng.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user restart searxng
```

---

## Troubleshooting

### `docker compose` not found

The unit file calls `/usr/bin/docker compose` (Docker Compose v2 plugin). If your system uses the standalone `docker-compose` binary:

```bash
which docker-compose
```

Edit the `ExecStart`/`ExecStop` lines in the unit file to match your path.

### Service fails to start

Check logs:

```bash
journalctl --user -u searxng --no-pager -n 50
```

Common causes:
- Docker daemon not running — start it with `sudo systemctl start docker`
- Your user is not in the `docker` group — fix with `sudo usermod -aG docker $USER` then log out/in
- Wrong `WorkingDirectory` — check the path exists and contains `docker-compose.yml`
- Repo cloned outside your home directory — `%h` expands to `$HOME`, so if the repo lives elsewhere (e.g. a separate drive), edit `WorkingDirectory` to an absolute path before copying the unit file, then re-run `daemon-reload`

### lingering (service doesn't start on boot, only on login)

By default, user systemd services only run after you log in. To make the service start at boot even without a login session:

```bash
sudo loginctl enable-linger $USER
```

This is optional — for most desktop use cases, login-triggered autostart is sufficient.

---

## macOS (Launch Agent alternative)

systemd is not available on macOS. Use a Launch Agent instead:

```bash
mkdir -p ~/Library/LaunchAgents
```

Create `~/Library/LaunchAgents/com.searxng.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.searxng</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/docker</string>
    <string>compose</string>
    <string>-f</string>
    <string>/Users/YOUR_USER/Github/searxng-tool/docker-compose.yml</string>
    <string>up</string>
    <string>-d</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/searxng-launchagent.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/searxng-launchagent-error.log</string>
</dict>
</plist>
```

Replace `YOUR_USER` with your macOS username and adjust the Docker path (`which docker`).

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.searxng.plist
```
