/**
 * pai-master.js - PAI's Master Control Script
 * Agent: PAI-MasterController
 *
 * Coordinates all money-making activities toward $1 TRILLION goal.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();

    const AGENT = "PAI-MasterController";
    const GOAL = 1_000_000_000_000; // $1 trillion
    const CYCLE_TIME = 5000; // 5 seconds between cycles

    const config = {
        homeRamReserve: 64,
        serverPurchaseThreshold: 0.15,
        hacknetBudgetPercent: 5,
        minServerRam: 128,
    };

    let startMoney = ns.getServerMoneyAvailable("home");
    let startTime = Date.now();
    let cycleCount = 0;
    let totalHacked = 0;
    let serversNuked = 0;
    let serversPurchased = 0;

    ns.print("═".repeat(65));
    ns.print(`[${AGENT}] PURPOSE: Reach $1 TRILLION through automated gameplay`);
    ns.print(`[${AGENT}] GOAL: $${ns.formatNumber(GOAL)}`);
    ns.print(`[${AGENT}] STARTING: $${ns.formatNumber(startMoney)}`);
    ns.print("═".repeat(65));

    while (true) {
        cycleCount++;
        const currentMoney = ns.getServerMoneyAvailable("home");

        // === VICTORY CHECK ===
        if (currentMoney >= GOAL) {
            ns.print("═".repeat(65));
            ns.print(`[${AGENT}] ★★★ GOAL REACHED: $1 TRILLION! ★★★`);
            ns.print("═".repeat(65));
            const elapsed = (Date.now() - startTime) / 1000 / 60;
            ns.print(`[${AGENT}] RESULT: Won in ${elapsed.toFixed(1)} minutes`);
            ns.print(`[${AGENT}] EARNED: $${ns.formatNumber(currentMoney - startMoney)}`);
            ns.print(`[${AGENT}] HACKED: $${ns.formatNumber(totalHacked)}`);
            ns.print(`[${AGENT}] SERVERS: ${serversPurchased} purchased, ${serversNuked} nuked`);
            ns.tprint(`[${AGENT}] SUCCESS: PAI reached $1 trillion!`);
            return;
        }

        // === PHASE 1: NUKE SERVERS ===
        const nukeResult = await nukeAll(ns, AGENT);
        serversNuked += nukeResult.newNukes;

        // === PHASE 2: DISTRIBUTED HACKING ===
        const hackResult = await executeHacking(ns, config, AGENT);
        totalHacked += hackResult.launched;

        // === PHASE 3: SERVER MANAGEMENT ===
        const serverResult = await manageServers(ns, config, AGENT);
        serversPurchased += serverResult.purchased;

        // === PHASE 4: HACKNET MANAGEMENT ===
        await manageHacknet(ns, config, AGENT);

        // === STATUS REPORT ===
        reportStatus(ns, AGENT, startMoney, startTime, cycleCount, GOAL, totalHacked, serversNuked, serversPurchased);

        await ns.sleep(CYCLE_TIME);
    }
}

async function nukeAll(ns, AGENT) {
    const portOpeners = [
        { file: "BruteSSH.exe", fn: ns.brutessh },
        { file: "FTPCrack.exe", fn: ns.ftpcrack },
        { file: "relaySMTP.exe", fn: ns.relaysmtp },
        { file: "HTTPWorm.exe", fn: ns.httpworm },
        { file: "SQLInject.exe", fn: ns.sqlinject }
    ];

    const available = portOpeners.filter(p => ns.fileExists(p.file, "home"));
    const servers = getAllServers(ns);
    let newNukes = 0;

    for (const server of servers) {
        if (server === "home" || ns.hasRootAccess(server)) continue;

        const reqPorts = ns.getServerNumPortsRequired(server);
        const reqHack = ns.getServerRequiredHackingLevel(server);

        if (reqHack > ns.getHackingLevel() || reqPorts > available.length) continue;

        for (let i = 0; i < reqPorts; i++) {
            try { available[i].fn(server); } catch {}
        }

        try {
            ns.nuke(server);
            newNukes++;
            const maxMoney = ns.getServerMaxMoney(server);
            const ram = ns.getServerMaxRam(server);
            ns.print(`[PAI-Nuker] PURPOSE: Gain root access on ${server}`);
            ns.print(`[PAI-Nuker] ACTION: Opened ${reqPorts} ports, executed NUKE`);
            ns.print(`[PAI-Nuker] RESULT: SUCCESS - RAM: ${ram}GB, MaxMoney: $${ns.formatNumber(maxMoney)}`);
        } catch {}
    }

    return { newNukes };
}

async function executeHacking(ns, config, AGENT) {
    const target = findBestTarget(ns);
    if (!target) {
        ns.print(`[PAI-Coordinator] WARN: No valid hacking target found`);
        return { launched: 0 };
    }

    const servers = getHackableServers(ns);
    const scripts = ["hack.js", "grow.js", "weaken.js"];

    // Deploy scripts
    for (const server of servers) {
        for (const script of scripts) {
            if (!ns.fileExists(script, server) && ns.fileExists(script, "home")) {
                await ns.scp(script, server, "home");
            }
        }
    }

    // Determine action
    const security = ns.getServerSecurityLevel(target);
    const minSecurity = ns.getServerMinSecurityLevel(target);
    const money = ns.getServerMoneyAvailable(target);
    const maxMoney = ns.getServerMaxMoney(target);

    let action, script;
    if (security > minSecurity + 5) {
        action = "weaken";
        script = "weaken.js";
    } else if (money < maxMoney * 0.75) {
        action = "grow";
        script = "grow.js";
    } else {
        action = "hack";
        script = "hack.js";
    }

    const scriptRam = ns.getScriptRam(script, "home");
    if (scriptRam === 0) return { launched: 0 };

    let totalThreads = 0;
    let serversUsed = 0;

    for (const server of servers) {
        const maxRam = ns.getServerMaxRam(server);
        const usedRam = ns.getServerUsedRam(server);
        const reserve = server === "home" ? config.homeRamReserve : 0;
        const available = maxRam - usedRam - reserve;
        const threads = Math.floor(available / scriptRam);

        if (threads > 0) {
            const pid = ns.exec(script, server, threads, target);
            if (pid > 0) {
                totalThreads += threads;
                serversUsed++;
            }
        }
    }

    if (totalThreads > 0) {
        ns.print(`[PAI-Coordinator] PURPOSE: Execute ${action.toUpperCase()} on ${target}`);
        ns.print(`[PAI-Coordinator] ACTION: Deployed ${script} across ${serversUsed} servers`);
        ns.print(`[PAI-Coordinator] RESULT: ${totalThreads} threads launched`);
        ns.print(`[PAI-Coordinator] TARGET: ${target} (Sec: ${security.toFixed(1)}, Money: $${ns.formatNumber(money)})`);
    }

    return { launched: totalThreads };
}

async function manageServers(ns, config, AGENT) {
    const money = ns.getServerMoneyAvailable("home");
    const owned = ns.getPurchasedServers();
    const maxServers = ns.getPurchasedServerLimit();
    let purchased = 0;

    if (owned.length >= maxServers) {
        // Upgrade existing servers
        const upgraded = await upgradeServers(ns, config);
        return { purchased: 0, upgraded };
    }

    // Find optimal RAM
    let targetRam = config.minServerRam;
    while (targetRam * 2 <= ns.getPurchasedServerMaxRam()) {
        const cost = ns.getPurchasedServerCost(targetRam * 2);
        if (cost < money * config.serverPurchaseThreshold) {
            targetRam *= 2;
        } else {
            break;
        }
    }

    const cost = ns.getPurchasedServerCost(targetRam);
    if (cost < money * config.serverPurchaseThreshold) {
        const name = ns.purchaseServer(`pai-${owned.length}`, targetRam);
        if (name) {
            purchased = 1;
            ns.print(`[PAI-ServerManager] PURPOSE: Expand compute capacity`);
            ns.print(`[PAI-ServerManager] ACTION: Purchased server ${name}`);
            ns.print(`[PAI-ServerManager] RESULT: +${targetRam}GB RAM for $${ns.formatNumber(cost)}`);
        }
    }

    return { purchased };
}

async function upgradeServers(ns, config) {
    const money = ns.getServerMoneyAvailable("home");
    const servers = ns.getPurchasedServers();
    const maxRam = ns.getPurchasedServerMaxRam();

    let lowestRam = Infinity;
    let lowestServer = null;

    for (const server of servers) {
        const ram = ns.getServerMaxRam(server);
        if (ram < maxRam && ram < lowestRam) {
            lowestRam = ram;
            lowestServer = server;
        }
    }

    if (!lowestServer) return 0;

    const newRam = lowestRam * 2;
    if (newRam > maxRam) return 0;

    const cost = ns.getPurchasedServerCost(newRam);
    if (cost < money * config.serverPurchaseThreshold) {
        ns.killall(lowestServer);
        ns.deleteServer(lowestServer);
        const name = ns.purchaseServer(lowestServer, newRam);
        if (name) {
            ns.print(`[PAI-ServerManager] PURPOSE: Upgrade server capacity`);
            ns.print(`[PAI-ServerManager] ACTION: Upgraded ${lowestServer}`);
            ns.print(`[PAI-ServerManager] RESULT: ${lowestRam}GB → ${newRam}GB for $${ns.formatNumber(cost)}`);
            return 1;
        }
    }
    return 0;
}

async function manageHacknet(ns, config, AGENT) {
    const money = ns.getServerMoneyAvailable("home");
    const budget = money * (config.hacknetBudgetPercent / 100);
    const hacknet = ns.hacknet;
    let actions = 0;

    // Buy new node if affordable
    const nodeCost = hacknet.getPurchaseNodeCost();
    if (nodeCost < budget && hacknet.numNodes() < hacknet.maxNumNodes()) {
        const idx = hacknet.purchaseNode();
        if (idx !== -1) {
            actions++;
            ns.print(`[PAI-HacknetManager] PURPOSE: Expand passive income`);
            ns.print(`[PAI-HacknetManager] ACTION: Purchased Hacknet node ${idx}`);
            ns.print(`[PAI-HacknetManager] RESULT: +1 node for $${ns.formatNumber(nodeCost)}`);
        }
    }

    // Upgrade existing nodes
    for (let i = 0; i < hacknet.numNodes(); i++) {
        const levelCost = hacknet.getLevelUpgradeCost(i, 1);
        if (levelCost < budget * 0.2) {
            hacknet.upgradeLevel(i, 1);
            actions++;
        }

        const ramCost = hacknet.getRamUpgradeCost(i, 1);
        if (ramCost < budget * 0.2) {
            hacknet.upgradeRam(i, 1);
            actions++;
        }

        const coreCost = hacknet.getCoreUpgradeCost(i, 1);
        if (coreCost < budget * 0.2) {
            hacknet.upgradeCore(i, 1);
            actions++;
        }
    }

    return actions;
}

function findBestTarget(ns) {
    const servers = getAllServers(ns);
    const myHackLevel = ns.getHackingLevel();

    const validTargets = servers.filter(s => {
        if (s === "home" || s.startsWith("pai-") || s.startsWith("pserv-")) return false;
        if (!ns.hasRootAccess(s)) return false;
        if (ns.getServerMaxMoney(s) <= 0) return false;
        if (ns.getServerRequiredHackingLevel(s) > myHackLevel) return false;
        return true;
    });

    if (validTargets.length === 0) return null;

    return validTargets.sort((a, b) => {
        const scoreA = (ns.getServerMaxMoney(a) / ns.getServerMinSecurityLevel(a)) * ns.hackAnalyzeChance(a);
        const scoreB = (ns.getServerMaxMoney(b) / ns.getServerMinSecurityLevel(b)) * ns.hackAnalyzeChance(b);
        return scoreB - scoreA;
    })[0];
}

function getHackableServers(ns) {
    return getAllServers(ns).filter(s => ns.hasRootAccess(s) && ns.getServerMaxRam(s) > 0);
}

function getAllServers(ns) {
    const visited = new Set();
    const queue = ["home"];
    const servers = [];

    while (queue.length > 0) {
        const server = queue.pop();
        if (!visited.has(server)) {
            visited.add(server);
            servers.push(server);
            queue.push(...ns.scan(server));
        }
    }
    return servers;
}

function reportStatus(ns, AGENT, startMoney, startTime, cycleCount, goal, totalHacked, serversNuked, serversPurchased) {
    ns.clearLog();
    const current = ns.getServerMoneyAvailable("home");
    const earned = current - startMoney;
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = earned / (elapsed / 3600);
    const remaining = goal - current;
    const eta = rate > 0 ? remaining / rate : Infinity;

    const progress = Math.min(100, (current / goal) * 100);
    const progressBar = "█".repeat(Math.floor(progress / 5)) + "░".repeat(20 - Math.floor(progress / 5));

    const target = findBestTarget(ns);

    ns.print("═".repeat(65));
    ns.print(`  [${AGENT}] MISSION: $1 TRILLION`);
    ns.print("═".repeat(65));
    ns.print("");
    ns.print(`  PROGRESS: [${progressBar}] ${progress.toFixed(2)}%`);
    ns.print("");
    ns.print(`  ┌─ FINANCES ─────────────────────────────────────────────┐`);
    ns.print(`  │ Current:     $${ns.formatNumber(current).padEnd(20)} │`);
    ns.print(`  │ Earned:      $${ns.formatNumber(earned).padEnd(20)} │`);
    ns.print(`  │ Rate:        $${ns.formatNumber(rate).padEnd(17)}/hr │`);
    ns.print(`  │ ETA:         ${formatTime(eta * 3600).padEnd(21)} │`);
    ns.print(`  └────────────────────────────────────────────────────────┘`);
    ns.print("");
    ns.print(`  ┌─ RESOURCES ────────────────────────────────────────────┐`);
    ns.print(`  │ Servers:     ${ns.getPurchasedServers().length}/${ns.getPurchasedServerLimit()} (${serversPurchased} bought)`.padEnd(57) + "│");
    ns.print(`  │ Hacknet:     ${ns.hacknet.numNodes()} nodes`.padEnd(57) + "│");
    ns.print(`  │ Nuked:       ${serversNuked} servers`.padEnd(57) + "│");
    ns.print(`  │ Target:      ${target || "None"}`.padEnd(57) + "│");
    ns.print(`  └────────────────────────────────────────────────────────┘`);
    ns.print("");
    ns.print(`  Cycle: ${cycleCount} | Runtime: ${formatTime(elapsed)}`);
    ns.print("═".repeat(65));
}

function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "∞";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}
