#!/usr/bin/env bash
# Watchdog script that executes chat restore immediately after Antigravity IDE closes.

LOG_FILE="/home/allen20306/allen/DSA_Tracker/restore.log"
RESTORE_SCRIPT="/home/allen20306/allen/DSA_Tracker/scripts/restore_chats.py"

echo "[$(date)] Watcher started. Monitoring for Antigravity IDE shutdown..." > "$LOG_FILE"

# Wait until all antigravity processes exit
while pgrep -u "$(whoami)" -f "/usr/bin/antigravity|antigravity-ide" > /dev/null 2>&1; do
    sleep 0.5
done

echo "[$(date)] Antigravity IDE closed. Starting database restore..." >> "$LOG_FILE"
python3 "$RESTORE_SCRIPT" >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] SUCCESS: Database restored cleanly! Relaunching Antigravity IDE..." >> "$LOG_FILE"
    # Optional auto-relaunch
    export DISPLAY=:0
    export WAYLAND_DISPLAY=wayland-0
    export XDG_RUNTIME_DIR=/run/user/$(id -u)
    nohup /usr/bin/antigravity >/dev/null 2>&1 &
    echo "[$(date)] Antigravity IDE relaunched with restored chats." >> "$LOG_FILE"
else
    echo "[$(date)] ERROR: Restore failed with code $EXIT_CODE." >> "$LOG_FILE"
fi
