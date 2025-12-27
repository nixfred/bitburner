/**
 * pai-orchestrator.js - Main Automation Driver for $10T Goal
 * Agent: PAI-Orchestrator
 * RAM: ~6GB
 *
 * The brain of the operation. Monitors progress, scales workers,
 * upgrades infrastructure, and drives toward $10 TRILLION.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Orchestrator";
    const GOAL = 10_000_000_000_000; // $10 TRILLION
    const CYCLE_TIME = 10000; // 10 seconds between decisions

    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.resizeTail(550, 400);

    const startTime = Date.now();
    const startMoney = ns.getServerMoneyAvailable("home");

    ns.print(`[${AGENT}] ════════════════════════════════════════════`);
    ns.print(`[${AGENT}] PURPOSE: Drive automation toward $10 TRILLION`);
    ns.print(`[${AGENT}] Starting with: $${ns.formatNumber(startMoney)}`);
    ns.print(`[${AGENT}] ════════════════════════════════════════════`);

    while (true) {
        const money = ns.getServerMoneyAvailable("home");
        const hackLevel = ns.getHackingLevel();
        const homeRam = ns.getServerMaxRam("home");
        const usedRam = ns.getServerUsedRam("home");
        const freeRam = homeRam - usedRam;

        ns.clearLog();
        printHeader(ns, AGENT, money, GOAL, startTime);

        // Check for victory
        if (money >= GOAL) {
            ns.print(`[${AGENT}] 🎉 VICTORY! $10 TRILLION REACHED! 🎉`);
            ns.tprint(`SUCCESS: PAI-Orchestrator reached $10 TRILLION goal!`);
            return;
        }

        // PHASE 1: Ensure farming is running
        const farmingScript = selectFarmingScript(ns, hackLevel, homeRam);
        if (!isScriptRunning(ns, farmingScript)) {
            ns.print(`[${AGENT}] ACTION: Starting ${farmingScript}`);
            launchScript(ns, farmingScript);
        } else {
            ns.print(`[${AGENT}] ✓ Farming: ${farmingScript}`);
        }

        // PHASE 2: Buy RAM upgrades when affordable
        const ramCost = ns.singularity?.getUpgradeHomeRamCost?.() || Infinity;
        if (money > ramCost * 2 && ramCost < Infinity) {
            ns.print(`[${AGENT}] ACTION: Upgrading home RAM ($${ns.formatNumber(ramCost)})`);
            ns.singularity.upgradeHomeRam();
        }

        // PHASE 3: Buy/upgrade servers when we have money
        const serverLimit = ns.getPurchasedServerLimit();
        const servers = ns.getPurchasedServers();
        if (servers.length < serverLimit && money > 50000000) {
            const maxRam = calculateAffordableRam(ns, money * 0.1);
            if (maxRam >= 8) {
                const name = `pai-worker-${servers.length}`;
                ns.print(`[${AGENT}] ACTION: Purchasing ${maxRam}GB server`);
                ns.purchaseServer(name, maxRam);
            }
        }

        // PHASE 4: Deploy workers to purchased servers
        for (const server of ns.getPurchasedServers()) {
            deployWorkerToServer(ns, server, hackLevel);
        }

        // PHASE 5: Root new servers as hack level increases
        const newRoots = rootNewServers(ns);
        if (newRoots > 0) {
            ns.print(`[${AGENT}] ACTION: Rooted ${newRoots} new servers`);
        }

        // PHASE 6: Hacknet investment (early game boost)
        if (money > 100000 && money < 10000000 && ns.hacknet.numNodes() < 6) {
            const cost = ns.hacknet.getPurchaseNodeCost();
            if (money > cost * 3) {
                ns.print(`[${AGENT}] ACTION: Buying hacknet node`);
                ns.hacknet.purchaseNode();
            }
        }

        // Status summary
        ns.print(`[${AGENT}] ────────────────────────────────────────────`);
        ns.print(`[${AGENT}] Home RAM: ${usedRam.toFixed(1)}/${homeRam}GB`);
        ns.print(`[${AGENT}] Servers: ${servers.length}/${serverLimit}`);
        ns.print(`[${AGENT}] Hacknet: ${ns.hacknet.numNodes()} nodes`);
        ns.print(`[${AGENT}] Hack Level: ${hackLevel}`);
        ns.print(`[${AGENT}] ════════════════════════════════════════════`);

        await ns.sleep(CYCLE_TIME);
    }
}

function printHeader(ns, agent, money, goal, startTime) {
    const progress = (money / goal) * 100;
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = money / elapsed;
    const eta = rate > 0 ? (goal - money) / rate : Infinity;

    ns.print(`[${agent}] ════════════════════════════════════════════`);
    ns.print(`[${agent}] 💰 $${ns.formatNumber(money)} / $10T (${progress.toFixed(4)}%)`);
    ns.print(`[${agent}] 📈 Rate: $${ns.formatNumber(rate * 3600)}/hr`);
    ns.print(`[${agent}] ⏱️  ETA: ${formatTime(eta)}`);
    ns.print(`[${agent}] ────────────────────────────────────────────`);
}

function selectFarmingScript(ns, hackLevel, ram) {
    // Use joesguns for best XP until higher levels
    if (hackLevel < 50) {
        return "pai-joesguns.js";
    }
    // Could add more sophisticated target selection here
    return "pai-joesguns.js";
}

function isScriptRunning(ns, script) {
    return ns.ps("home").some(p => p.filename === script);
}

function launchScript(ns, script) {
    if (ns.fileExists(script, "home")) {
        ns.exec(script, "home", 1);
    }
}

function calculateAffordableRam(ns, budget) {
    let ram = 8;
    while (ns.getPurchasedServerCost(ram * 2) <= budget && ram < 1048576) {
        ram *= 2;
    }
    return ram;
}

function deployWorkerToServer(ns, server, hackLevel) {
    const target = hackLevel < 50 ? "joesguns" : "joesguns"; // Could expand
    const workerScript = "worker.js";

    // Skip if already running
    if (ns.ps(server).length > 0) return;

    // Copy and run worker
    if (!ns.fileExists(workerScript, server)) {
        ns.scp(workerScript, server);
    }

    const ram = ns.getServerMaxRam(server);
    const scriptRam = ns.getScriptRam(workerScript, server);
    const threads = Math.floor(ram / scriptRam);

    if (threads > 0) {
        ns.exec(workerScript, server, threads, target);
    }
}

function rootNewServers(ns) {
    let rooted = 0;
    const allServers = getAllServers(ns);

    for (const server of allServers) {
        if (ns.hasRootAccess(server)) continue;

        const portsNeeded = ns.getServerNumPortsRequired(server);
        let portsOpened = 0;

        // Try to open ports
        if (ns.fileExists("BruteSSH.exe")) { try { ns.brutessh(server); portsOpened++; } catch {} }
        if (ns.fileExists("FTPCrack.exe")) { try { ns.ftpcrack(server); portsOpened++; } catch {} }
        if (ns.fileExists("relaySMTP.exe")) { try { ns.relaysmtp(server); portsOpened++; } catch {} }
        if (ns.fileExists("HTTPWorm.exe")) { try { ns.httpworm(server); portsOpened++; } catch {} }
        if (ns.fileExists("SQLInject.exe")) { try { ns.sqlinject(server); portsOpened++; } catch {} }

        if (portsOpened >= portsNeeded) {
            try {
                ns.nuke(server);
                rooted++;
            } catch {}
        }
    }

    return rooted;
}

function getAllServers(ns) {
    const visited = new Set();
    const queue = ["home"];
    while (queue.length > 0) {
        const server = queue.pop();
        if (!visited.has(server)) {
            visited.add(server);
            queue.push(...ns.scan(server));
        }
    }
    return Array.from(visited);
}

function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "∞";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}
