# Autostart: Running SearXNG on Login

Sets up SearXNG as a user-level systemd service so it starts automatically when you log in and **stops cleanly on shutdown or reboot**. Once enabled, OpenCode's MCP search tool works immediately without any manual `docker compose` steps.

> [!NOTE]
> Not on Linux? macOS users can use a Launch Agent instead — see the [[#macOS (Launch Agent alternative)|macOS section]] at the bottom.

---

## Prerequisites

- Linux with systemd (most modern distros)
- Docker installed and your user in the `docker` group
- The project cloned to `~/Github/searxng-tool` (or adjust `WorkingDirectory` — see [[#Updating the project path|below]])

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

### 3. Verify it is running

```bash
systemctl --user status searxng
```

You should see `Active: active (exited)` — this is correct for a `Type=oneshot` service. It means `docker compose up -d` completed and the containers are running in the background.

Confirm Docker has the container up:

```bash
docker ps | grep searxng
```

---

## Managing the service

| Task | Command |
|---|---|
| Start manually | `systemctl --user start searxng` |
| Stop SearXNG | `systemctl --user stop searxng` |
| Restart | `systemctl --user restart searxng` |
| Disable autostart | `systemctl --user disable searxng` |
| View logs | `journalctl --user -u searxng` |
| View recent logs | `journalctl --user -u searxng -n 50 --no-pager` |

---

## Shutdown and reboot behaviour

The service is designed to shut down cleanly without hanging the system.

**How it works:**

1. On shutdown or reboot, systemd calls `ExecStop`: `docker compose down --timeout 20`
2. Docker sends `SIGTERM` to each container, waits up to 20 seconds for graceful exit
3. Any container that has not exited after 20 seconds receives `SIGKILL`
4. `KillMode=process` ensures systemd only signals the `docker compose` process itself — it does not race with Docker's own container stop logic
5. `TimeoutStopSec=45` gives the full stop sequence (20s Docker + overhead) time to complete before systemd force-kills anything

> [!WARNING]
> **If you previously had the service installed**, re-copy the updated unit file and reload:
>
> ```bash
> cp searxng.service ~/.config/systemd/user/
> systemctl --user daemon-reload
> systemctl --user restart searxng
> ```
>
> The old unit had `Restart=on-failure` which could cause the service to respawn during shutdown, producing the hang. The updated unit removes this.

**What caused the shutdown hang (fixed):**

| Problem | Fix applied |
|---|---|
| `Restart=on-failure` on oneshot service — systemd respawned during stop | Removed entirely |
| `--timeout 10` too short — Docker fell back to SIGKILL mid-shutdown | Increased to `--timeout 20` |
| No `KillMode` — cgroup-level kill raced with Docker's own stop | Added `KillMode=process` |
| `TimeoutStopSec=30` too short for 20s Docker timeout + overhead | Increased to `TimeoutStopSec=45` |
| `Before=shutdown.target` on a user service — unreliable cross-level ordering | Removed |

---

## Updating the project path

The unit file uses `WorkingDirectory=%h/Github/searxng-tool` where `%h` expands to your home directory at runtime. If you cloned the repo elsewhere, edit before copying:

```bash
# Cloned to ~/projects/searxng-tool
sed -i 's|%h/Github/searxng-tool|%h/projects/searxng-tool|' searxng.service

# Cloned outside $HOME (e.g. a separate drive)
sed -i 's|%h/Github/searxng-tool|/mnt/extra_ssd/Github/searxng-tool|' searxng.service
```

Then re-copy and reload:

```bash
cp searxng.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user restart searxng
```

---

## Enabling linger (boot without login)

By default, user systemd services only run after you log in. To start at boot even without a login session:

```bash
sudo loginctl enable-linger $USER
```

> [!TIP]
> For desktop workstations this is usually not needed — login-triggered autostart is sufficient.
> For headless servers or setups where OpenCode runs before you log in, enable linger.

---

## Troubleshooting

### `docker compose` not found

The unit file calls `/usr/bin/docker compose` (Docker Compose v2 plugin). If your system uses the standalone `docker-compose` binary:

```bash
which docker-compose
# Example output: /usr/bin/docker-compose
```

Edit the `ExecStart` and `ExecStop` lines in the unit file to use `docker-compose` instead of `docker compose`, then re-copy and reload.

### Service fails to start

```bash
journalctl --user -u searxng --no-pager -n 50
```

Common causes:

| Symptom | Cause | Fix |
|---|---|---|
| `docker: command not found` | Docker not installed or not in PATH | Install Docker, verify `which docker` |
| `permission denied` | User not in `docker` group | `sudo usermod -aG docker $USER` then log out/in |
| `no such file or directory` | Wrong `WorkingDirectory` | Check path exists and contains `docker-compose.yml` |
| `Failed to connect to bus` | Systemd user session not started | Log out and back in |

### System hangs on shutdown or reboot

> [!IMPORTANT]
> This was a known issue with older versions of the unit file. The updated `searxng.service` in this repo is already fixed. If you are still seeing hangs:

1. Verify you have the updated unit file deployed:
   ```bash
   grep "KillMode" ~/.config/systemd/user/searxng.service
   # Should output: KillMode=process
   ```
2. If not, re-copy and reload:
   ```bash
   cp searxng.service ~/.config/systemd/user/
   systemctl --user daemon-reload
   ```
3. Force-stop any stuck containers now:
   ```bash
   docker compose -f ~/Github/searxng-tool/docker-compose.yml down --timeout 5
   ```

### Service shows `active (exited)` but container is not running

The oneshot service only tracks whether `docker compose up -d` succeeded, not whether the container is still running. Check directly:

```bash
docker ps | grep searxng
docker compose -f ~/Github/searxng-tool/docker-compose.yml ps
```

If the container stopped unexpectedly, restart it:

```bash
systemctl --user restart searxng
```

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

Replace `YOUR_USER` with your macOS username. Get the correct Docker path with `which docker`.

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.searxng.plist
```

> [!NOTE]
> macOS Launch Agents do not have a clean shutdown hook equivalent to `ExecStop`. Docker Desktop handles container lifecycle on macOS — containers are stopped when Docker Desktop quits, which happens on logout/shutdown automatically.
