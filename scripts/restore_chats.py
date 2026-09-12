#!/usr/bin/env python3
"""
Complete Chat & Workspace Restore Script for Antigravity IDE
Restores legacy conversations and workspace summaries into Antigravity IDE's state.vscdb.
"""

import sqlite3
import base64
import os
import sys
import json
import shutil
from datetime import datetime

OLD_CONFIG_DIR = "/home/allen20306/.config/Antigravity/User/globalStorage"
NEW_CONFIG_DIR = "/home/allen20306/.config/Antigravity IDE/User/globalStorage"

OLD_DB_PATH = os.path.join(OLD_CONFIG_DIR, "state.vscdb")
NEW_DB_PATH = os.path.join(NEW_CONFIG_DIR, "state.vscdb")

OLD_STORAGE_PATH = os.path.join(OLD_CONFIG_DIR, "storage.json")
NEW_STORAGE_PATH = os.path.join(NEW_CONFIG_DIR, "storage.json")

def parse_map(raw_bytes):
    entries = {}
    idx = 0
    while idx < len(raw_bytes):
        tag = raw_bytes[idx]
        idx += 1
        length = 0
        shift = 0
        while True:
            b = raw_bytes[idx]
            idx += 1
            length |= (b & 0x7f) << shift
            if not (b & 0x80):
                break
            shift += 7
        entry_data = raw_bytes[idx:idx+length]
        idx += length

        # parse entry key (field 1, string)
        e_idx = 0
        key = None
        while e_idx < len(entry_data):
            e_tag = entry_data[e_idx]
            e_idx += 1
            field_num = e_tag >> 3
            wire_type = e_tag & 7
            if wire_type == 2:
                e_len = 0
                e_shift = 0
                while True:
                    b = entry_data[e_idx]
                    e_idx += 1
                    e_len |= (b & 0x7f) << e_shift
                    if not (b & 0x80):
                        break
                    e_shift += 7
                val = entry_data[e_idx:e_idx+e_len]
                e_idx += e_len
                if field_num == 1:
                    key = val.decode('utf-8', errors='ignore')
            elif wire_type == 0:
                while entry_data[e_idx] & 0x80:
                    e_idx += 1
                e_idx += 1
            elif wire_type == 1:
                e_idx += 8
            elif wire_type == 5:
                e_idx += 4
        if key:
            entries[key] = entry_data
    return entries

def serialize_map(entries_dict):
    out = bytearray()
    for entry_data in entries_dict.values():
        out.append(0x0a)
        length = len(entry_data)
        while length >= 0x80:
            out.append((length & 0x7f) | 0x80)
            length >>= 7
        out.append(length)
        out.extend(entry_data)
    return bytes(out)

def restore():
    print(f"[{datetime.now()}] Starting Antigravity Chat & Workspace Restore...")

    if not os.path.exists(OLD_DB_PATH):
        print(f"ERROR: Old database not found at {OLD_DB_PATH}")
        sys.exit(1)

    if not os.path.exists(NEW_DB_PATH):
        print(f"ERROR: Target database not found at {NEW_DB_PATH}")
        sys.exit(1)

    # Backup new DB before modifying
    bak_path = NEW_DB_PATH + ".bak"
    shutil.copyfile(NEW_DB_PATH, bak_path)
    print(f"Created backup at {bak_path}")

    conn_old = sqlite3.connect(OLD_DB_PATH)
    conn_new = sqlite3.connect(NEW_DB_PATH)

    cur_old = conn_old.cursor()
    cur_new = conn_new.cursor()

    # 1. Merge trajectorySummaries
    print("--- Merging Trajectory Summaries ---")
    row_old = cur_old.execute("SELECT value FROM ItemTable WHERE key = 'antigravityUnifiedStateSync.trajectorySummaries'").fetchone()
    row_new = cur_new.execute("SELECT value FROM ItemTable WHERE key = 'antigravityUnifiedStateSync.trajectorySummaries'").fetchone()

    map_old = parse_map(base64.b64decode(row_old[0])) if row_old else {}
    map_new = parse_map(base64.b64decode(row_new[0])) if row_new else {}

    print(f"Existing in Antigravity IDE: {len(map_new)} conversations")
    print(f"Found in legacy backup:      {len(map_old)} conversations")

    merged_ts = dict(map_old)
    merged_ts.update(map_new)  # Preserve newest entries
    print(f"Total merged conversations:  {len(merged_ts)}")

    raw_ts = serialize_map(merged_ts)
    b64_ts = base64.b64encode(raw_ts).decode('ascii')
    cur_new.execute("INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('antigravityUnifiedStateSync.trajectorySummaries', ?)", (b64_ts,))

    # 2. Merge sidebarWorkspaces
    print("--- Merging Sidebar Workspaces ---")
    row_old_sw = cur_old.execute("SELECT value FROM ItemTable WHERE key = 'antigravityUnifiedStateSync.sidebarWorkspaces'").fetchone()
    row_new_sw = cur_new.execute("SELECT value FROM ItemTable WHERE key = 'antigravityUnifiedStateSync.sidebarWorkspaces'").fetchone()

    map_old_sw = parse_map(base64.b64decode(row_old_sw[0])) if row_old_sw else {}
    map_new_sw = parse_map(base64.b64decode(row_new_sw[0])) if row_new_sw else {}

    print(f"Existing in Antigravity IDE: {len(map_new_sw)} workspaces")
    print(f"Found in legacy backup:      {len(map_old_sw)} workspaces")

    merged_sw = dict(map_old_sw)
    merged_sw.update(map_new_sw)
    print(f"Total merged workspaces:     {len(merged_sw)}")

    raw_sw = serialize_map(merged_sw)
    b64_sw = base64.b64encode(raw_sw).decode('ascii')
    cur_new.execute("INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('antigravityUnifiedStateSync.sidebarWorkspaces', ?)", (b64_sw,))

    # 3. Sync all missing keys from legacy ItemTable
    print("--- Syncing Missing State Keys ---")
    all_old_rows = cur_old.execute("SELECT key, value FROM ItemTable").fetchall()
    inserted_keys = 0
    for k, v in all_old_rows:
        if not cur_new.execute("SELECT 1 FROM ItemTable WHERE key = ?", (k,)).fetchone():
            cur_new.execute("INSERT INTO ItemTable (key, value) VALUES (?, ?)", (k, v))
            inserted_keys += 1
    print(f"Inserted {inserted_keys} missing metadata keys")

    conn_new.commit()

    # Verify
    verify_row = cur_new.execute("SELECT value FROM ItemTable WHERE key = 'antigravityUnifiedStateSync.trajectorySummaries'").fetchone()
    verify_count = len(parse_map(base64.b64decode(verify_row[0])))
    print(f"Verification: Successfully verified {verify_count} trajectories in target database.")

    conn_old.close()
    conn_new.close()

    # 4. Sync storage.json
    print("--- Syncing storage.json ---")
    if os.path.exists(OLD_STORAGE_PATH) and os.path.exists(NEW_STORAGE_PATH):
        try:
            with open(OLD_STORAGE_PATH, 'r') as f:
                old_storage = json.load(f)
            with open(NEW_STORAGE_PATH, 'r') as f:
                new_storage = json.load(f)

            added = 0
            for k, v in old_storage.items():
                if k not in new_storage:
                    new_storage[k] = v
                    added += 1

            with open(NEW_STORAGE_PATH, 'w') as f:
                json.dump(new_storage, f, indent=2)
            print(f"Merged {added} configuration flags into storage.json")
        except Exception as e:
            print(f"Warning: Failed to merge storage.json: {e}")

    print(f"[{datetime.now()}] Restore completed successfully!")

if __name__ == "__main__":
    restore()
