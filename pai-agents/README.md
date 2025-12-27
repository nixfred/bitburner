# PAI Agent System

## Agent Architecture

Each agent handles one responsibility. The Master coordinates them all.

### Agents

| Agent | Purpose | RAM |
|-------|---------|-----|
| `pai-master-v2.js` | Orchestrator - runs other agents | ~4GB |
| `pai-xp-boost.js` | Level up hacking skill | ~2.5GB |
| `pai-money.js` | Hack for money | ~2.5GB |
| `pai-upgrade.js` | Buy RAM, servers, programs | ~3GB |
| `pai-network.js` | Root new servers | ~2GB |
| `pai-hacknet.js` | Manage hacknet nodes | ~2GB |

### Strategy Phases

1. **PHASE 1: XP Rush** (Level 1-50)
   - Run pai-xp-boost.js
   - Target: joesguns (best XP)
   - Goal: Reach level 50

2. **PHASE 2: Money Rush** (Level 50+)
   - Run pai-money.js
   - Target: Best $/sec server
   - Goal: $1M for upgrades

3. **PHASE 3: Infrastructure** ($1M+)
   - Buy RAM upgrades
   - Buy port openers
   - Purchase servers

4. **PHASE 4: Scale** ($100M+)
   - Max out servers
   - Distributed hacking
   - Target high-value servers

5. **PHASE 5: Endgame** ($1B+)
   - Stock market
   - Corporation
   - Path to $10T
