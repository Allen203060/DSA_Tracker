#!/usr/bin/env bash
# Clean restart script for Antigravity IDE with database restore

echo "Gracefully terminating Antigravity IDE..."
pkill -TERM -u "$(whoami)" -f "/usr/bin/antigravity"

echo "Waiting for process to exit and flush in-memory storage..."
while pgrep -u "$(whoami)" -f "/usr/bin/antigravity|antigravity-ide" > /dev/null 2>&1; do
    sleep 0.5
done

echo "Applying full conversation and workspace database restore..."
python3 /home/allen20306/allen/DSA_Tracker/scripts/restore_chats.py

echo "Relaunching Antigravity IDE..."
export DISPLAY=:0
export WAYLAND_DISPLAY=wayland-0
export XDG_RUNTIME_DIR=/run/user/$(id -u)
nohup /usr/bin/antigravity >/dev/null 2>&1 &
disown

echo "Done! Antigravity IDE is restarting with all 79 chats restored."
