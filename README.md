# Bitburner PAI Automation Suite

Automated scripts to reach **$1 TRILLION** in Bitburner using PAI (Personal AI Infrastructure).

## Quick Start

### One Command Restart
After any restart (augmentations, new game):
```
run bootstrap.js
```
This auto-detects your RAM and launches the right script.

---

### 1. Set Up File Sync (VSCode → Game)

The game needs to receive scripts from your computer. We use `bitburner-filesync`:

```bash
# In terminal, from this project directory:
npx bitburner-filesync
```

This starts a WebSocket server on port **12525**.

### 2. Connect the Game

In Bitburner:
1. Go to **Options** → **Remote API**
2. Set **Port** to `12525`
3. Set **Hostname** to `localhost`
4. Leave **wss** OFF
5. Click **Connect**

Status should show **Online**.

### 3. Run the Scripts

**Fresh Game (8GB RAM):**
```
run pai-early.js
```

**After upgrading RAM (32GB+):**
```
run pai-startup.js
```

---

## Script Overview

### Core Scripts (PAI Suite)

| Script | RAM | Agent | Purpose |
|--------|-----|-------|---------|
| `bootstrap.js` | ~3GB | PAI-Bootstrap | **Auto-detects RAM, launches best script** |
| `pai-startup.js` | ~4GB | PAI-Launcher | Main launcher, starts all subsystems |
| `pai-master.js` | ~16GB | PAI-MasterController | Full orchestration toward $1T |
| `pai-early.js` | ~2.5GB | PAI-EarlyGame | Lightweight for fresh starts |

### Worker Scripts

| Script | RAM | Agent | Purpose |
|--------|-----|-------|---------|
| `hack.js` | ~1.7GB | PAI-Hacker | Steals money from target |
| `grow.js` | ~1.7GB | PAI-Grower | Grows money on target |
| `weaken.js` | ~1.75GB | PAI-Weakener | Lowers security on target |
| `worker.js` | ~1.7GB | PAI-Worker | Parallel hack/grow/weaken worker |

### Utility Scripts

| Script | RAM | Agent | Purpose |
|--------|-----|-------|---------|
| `auto-nuker.js` | ~2.8GB | PAI-Nuker | Gains root on all accessible servers |
| `stock-trader.js` | ~7.5GB | PAI-StockTrader | Automated stock trading (needs TIX API) |

### Legacy Scripts (Pre-PAI)

| Script | Purpose |
|--------|---------|
| `orch-master-all-in-one.js` | Original orchestrator |
| `GodFarm.js` | Distributed farming |
| `hacknetAutoUpgrader.js` | ROI-based hacknet upgrades |

---

## Game Progression Guide

### Phase 1: Fresh Start (0-30 minutes)
- RAM: 8GB, Money: ~$1k
- Run: `pai-early.js`
- Manual: Do crimes (Mug) in Slum for quick cash
- Goal: $200k for first RAM upgrade

### Phase 2: Early Game (30 min - 2 hours)
- RAM: 16-64GB
- Run: `pai-startup.js`
- Buy more RAM upgrades as affordable
- Hacknet nodes for passive income

### Phase 3: Mid Game (2-8 hours)
- RAM: 128GB+
- Multiple purchased servers
- Consider TIX API ($200m) for stock trading
- Join factions, work for reputation

### Phase 4: Late Game
- Augmentations installed
- Corporations
- Gangs (if BN)
- Goal: $1 TRILLION

---

## After Installing Augmentations (Restart)

When you install augmentations, you restart with:
- 8GB RAM (or more with certain augs)
- All purchased servers deleted
- All scripts remain on home

**Quick restart:**
```
run pai-early.js
```

Then upgrade RAM and switch to `pai-startup.js`.

---

## Agent Logging Format

All PAI scripts log with this format:
```
[AGENT-NAME] PURPOSE: What this operation will do
[AGENT-NAME] ACTION: What is being executed
[AGENT-NAME] RESULT: What happened, $ earned
```

Example:
```
[PAI-Hacker] PURPOSE: Steal money from joesguns
[PAI-Hacker] ACTION: Executing hack...
[PAI-Hacker] RESULT: Stole $45.2k
```

---

## File Sync Troubleshooting

### "Connection refused" or "isTrusted: true" error
1. Make sure `npx bitburner-filesync` is running in terminal
2. Check the port matches (default: 12525)
3. Try `127.0.0.1` instead of `localhost` (IPv6 issue)

### Scripts not appearing in game
1. Check filesync terminal - should show "pushed" messages
2. Verify files are in the correct folder (project root)
3. Only `.js`, `.script`, `.txt` files are synced

### Server shows "Offline"
1. Start filesync BEFORE clicking Connect in game
2. Game is the client, your terminal is the server

---

## Configuration

Edit `filesync.json` in project root:

```json
{
  "allowedFiletypes": [".js", ".script", ".txt"],
  "port": 12525,
  "scriptsFolder": ".",
  "pushAllOnConnection": true
}
```

---

## Contributing

This project is automated by PAI (Claude Code). Scripts are self-documenting with agent identifiers and structured logging.

---

*🤖 Generated with [Claude Code](https://claude.com/claude-code)*
