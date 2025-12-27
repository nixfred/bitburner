/**
 * pai-dashboard.js - Rich Status Dashboard for PAI
 * Agent: PAI-Dashboard
 * RAM: ~4GB
 *
 * Comprehensive real-time status reporting.
 * Shows everything an info-hungry user wants to know!
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Dashboard";
    const GOAL = 10_000_000_000_000; // $10 TRILLION
    const UPDATE_INTERVAL = 2000;

    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.resizeTail(600, 800);

    const startTime = Date.now();
    const startMoney = ns.getServerMoneyAvailable("home");
    const startHackLevel = ns.getHackingLevel();

    // Track history for rate calculations
    const moneyHistory = [];
    const xpHistory = [];

    while (true) {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const current = ns.getServerMoneyAvailable("home");
        const hackLevel = ns.getHackingLevel();

        // Track for rate calculations
        moneyHistory.push({ time: now, value: current });
        xpHistory.push({ time: now, value: hackLevel });

        // Keep last 30 samples for rate calculation
        if (moneyHistory.length > 30) moneyHistory.shift();
        if (xpHistory.length > 30) xpHistory.shift();

        // Calculate rates
        const moneyRate = calculateRate(moneyHistory);
        const xpRate = calculateRate(xpHistory);
        const eta = moneyRate > 0 ? (GOAL - current) / moneyRate : Infinity;

        // Get system info
        const ram = ns.getServerMaxRam("home");
        const usedRam = ns.getServerUsedRam("home");
        const freeRam = ram - usedRam;
        const scripts = ns.ps("home");
        const servers = ns.getPurchasedServers();
        const hacknetNodes = ns.hacknet.numNodes();

        // Get all servers info
        const allServers = getAllServers(ns);
        const rootedServers = allServers.filter(s => ns.hasRootAccess(s) && s !== "home");
        const hackableServers = rootedServers.filter(s =>
            ns.getServerMaxMoney(s) > 0 &&
            ns.getServerRequiredHackingLevel(s) <= hackLevel
        );

        // Progress
        const progress = Math.min(100, (current / GOAL) * 100);
        const progressBar = "█".repeat(Math.floor(progress / 2.5)) + "░".repeat(40 - Math.floor(progress / 2.5));

        // Clear and render
        ns.clearLog();

        // Header
        ns.print("╔══════════════════════════════════════════════════════════╗");
        ns.print("║         PAI DASHBOARD - MISSION: $10 TRILLION            ║");
        ns.print("╠══════════════════════════════════════════════════════════╣");

        // Progress bar
        ns.print(`║ [${progressBar}] ${progress.toFixed(4)}%`);
        ns.print("╠══════════════════════════════════════════════════════════╣");

        // Finances
        ns.print("║ 💰 FINANCES                                               ║");
        ns.print(`║   Current:      $${ns.formatNumber(current).padEnd(20)}          ║`);
        ns.print(`║   Earned:       $${ns.formatNumber(current - startMoney).padEnd(20)}          ║`);
        ns.print(`║   Rate:         $${ns.formatNumber(moneyRate * 3600).padEnd(15)}/hour       ║`);
        ns.print(`║   ETA to $10T:  ${formatTime(eta).padEnd(25)}        ║`);

        // Player
        ns.print("╠══════════════════════════════════════════════════════════╣");
        ns.print("║ 🧠 PLAYER                                                 ║");
        ns.print(`║   Hack Level:   ${hackLevel.toString().padEnd(10)} (+${(hackLevel - startHackLevel)}/session)     ║`);
        ns.print(`║   XP Rate:      ${xpRate.toFixed(2).padEnd(10)} levels/min              ║`);

        // Resources
        ns.print("╠══════════════════════════════════════════════════════════╣");
        ns.print("║ 🖥️  RESOURCES                                             ║");
        ns.print(`║   Home RAM:     ${usedRam.toFixed(1)}GB / ${ram}GB (${freeRam.toFixed(1)}GB free)`.padEnd(60) + "║");
        ns.print(`║   Servers:      ${servers.length} / ${ns.getPurchasedServerLimit()}`.padEnd(60) + "║");
        ns.print(`║   Hacknet:      ${hacknetNodes} nodes`.padEnd(60) + "║");

        // Network
        ns.print("╠══════════════════════════════════════════════════════════╣");
        ns.print("║ 🌐 NETWORK                                                ║");
        ns.print(`║   Total:        ${allServers.length} servers discovered`.padEnd(60) + "║");
        ns.print(`║   Rooted:       ${rootedServers.length} servers pwned`.padEnd(60) + "║");
        ns.print(`║   Hackable:     ${hackableServers.length} targets available`.padEnd(60) + "║");

        // Running Scripts
        ns.print("╠══════════════════════════════════════════════════════════╣");
        ns.print("║ 📜 ACTIVE SCRIPTS                                         ║");
        const paiScripts = scripts.filter(s => s.filename.startsWith("pai-"));
        for (const s of paiScripts.slice(0, 5)) {
            ns.print(`║   • ${s.filename.padEnd(25)} (PID: ${s.pid})`.padEnd(60) + "║");
        }
        if (paiScripts.length === 0) {
            ns.print("║   (no PAI scripts running)                                ║");
        }

        // Top Targets
        ns.print("╠══════════════════════════════════════════════════════════╣");
        ns.print("║ 🎯 TOP TARGETS                                            ║");
        const targets = hackableServers
            .map(s => ({
                name: s,
                money: ns.getServerMoneyAvailable(s),
                maxMoney: ns.getServerMaxMoney(s),
                sec: ns.getServerSecurityLevel(s),
                minSec: ns.getServerMinSecurityLevel(s)
            }))
            .sort((a, b) => b.maxMoney - a.maxMoney)
            .slice(0, 3);

        for (const t of targets) {
            const pct = ((t.money / t.maxMoney) * 100).toFixed(0);
            ns.print(`║   ${t.name.padEnd(15)} $${ns.formatNumber(t.money).padEnd(10)} (${pct}%)`.padEnd(60) + "║");
        }

        // Footer
        ns.print("╠══════════════════════════════════════════════════════════╣");
        ns.print(`║ ⏱️  Runtime: ${formatTime(elapsed).padEnd(20)} Cycle: ${UPDATE_INTERVAL/1000}s`.padEnd(61) + "║");
        ns.print("╚══════════════════════════════════════════════════════════╝");

        // Victory check
        if (current >= GOAL) {
            ns.print("");
            ns.print("🎉🎉🎉 GOAL REACHED: $10 TRILLION! 🎉🎉🎉");
            ns.tprint("SUCCESS: PAI reached $10 TRILLION!");
            return;
        }

        await ns.sleep(UPDATE_INTERVAL);
    }
}

function calculateRate(history) {
    if (history.length < 2) return 0;
    const first = history[0];
    const last = history[history.length - 1];
    const timeDiff = (last.time - first.time) / 1000; // seconds
    if (timeDiff === 0) return 0;
    return (last.value - first.value) / timeDiff;
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
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

