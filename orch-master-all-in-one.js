/**
 * orch-master-all-in-one.js
 *
 * Unified hacking orchestrator and server management script:
 * - Dynamically distributes hack/grow/weaken actions across all available servers.
 * - Purchases new servers every 90 seconds (price and affordability checked).
 * - Provides real-time status reports directly in the log view.
 * - Optimizes resource usage by prioritizing servers with higher available RAM.
 * - Automatically switches targets for maximum profits.
 *
 * Usage:
 * run orch-master-all-in-one.js
 * 
 * Requirements:
 * - Place `hack.js`, `grow.js`, and `weaken.js` in your home directory.
 *
 * Features in This Version:
 * 1. **Dynamic Hacking Logic**:
 *    - Automatically selects the best target for hacking.
 *    - Adapts to the server's money, security, and growth rates.
 *
 * 2. **Efficient Server Management**:
 *    - Purchases new servers every 90 seconds if affordable.
 *    - Automatically deploys required scripts to all servers.
 *
 * 3. **Real-Time Status Reports**:
 *    - Logs earnings, server status, and next server cost directly in the terminal.
 *    - Clears logs between updates for a clean display.
 *
 * 4. **Configurable Parameters**:
 *    - Thresholds for hacking, growing, weakening, and server purchases.
 *    - Adjustable RAM usage for the home server.
 *
 * 5. **Error Handling and Stability**:
 *    - Handles script deployment errors.
 *    - Reports warnings for insufficient RAM or unsuitable targets.
 */

export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail(); // Automatically open the log window for real-time output

    // ======== User-Adjustable Configuration (Positionally NSFW) ========
    const hackUpdateInterval = 30000;     // Time between hack cycles (ms)
    const buyCheckInterval = 90000;       // Time between server purchase checks (ms)
    const hackThreshold = 0.75;           // Hack if money >= 75% of max
    const growThreshold = 0.90;           // Grow if money < 90% of max
    const weakenOffset = 10;              // Weaken if security > minSec + 10
    const homeRamUsageFraction = 0.6;     // Use only 60% of home RAM for hacking actions
    const moneyThreshold = 0.25;          // Buy server if cost < 25% of current money
    const baseRam = 4096;                 // Minimum RAM for purchased servers
    const scripts = ["hack.js", "grow.js", "weaken.js"]; // Required scripts
    // ==============================================

    let currentTarget = null;            // Current hacking target
    let totalEarnings = 0;               // Tracks total earnings
    let targetSwitches = 0;              // Tracks target changes
    let lastBuyCheck = 0;                // Tracks last server purchase check

    const maxServers = ns.getPurchasedServerLimit(); // Max servers allowed
    const maxRam = ns.getPurchasedServerMaxRam();    // Max RAM purchasable

    while (true) {
        // ======= SCRIPT DEPLOYMENT (Positionally NSFW) =======
        try {
            await ensureScriptsOnAllServers(ns, scripts);
        } catch (err) {
            ns.print(`[ERROR] Failed to deploy scripts: ${err}`);
        }

        // ======= HACKING LOGIC (Positionally NSFW) =======
        const newTarget = findBestTarget(ns);
        if (newTarget !== currentTarget) {
            targetSwitches++;
            currentTarget = newTarget;
            ns.print(`[INFO] Switching hacking target to: ${currentTarget}`);
        }

        if (currentTarget) {
            const earnings = await executeHackingCycle(ns, currentTarget, hackThreshold, growThreshold, weakenOffset, homeRamUsageFraction);
            if (earnings > 0) {
                totalEarnings += earnings;
                ns.print(`[INFO] Earned ${ns.nFormat(earnings, "$0.00a")}. Total: ${ns.nFormat(totalEarnings, "$0.00a")}`);
            }
        } else {
            ns.print(`[WARN] No suitable hacking targets found.`);
        }

        // ======= SERVER PURCHASE LOGIC (Positionally NSFW) =======
        if (Date.now() - lastBuyCheck > buyCheckInterval) {
            lastBuyCheck = Date.now();
            const purchaseResult = attemptToBuyServer(ns, baseRam, moneyThreshold, maxServers, maxRam);
            if (purchaseResult && purchaseResult.purchased) {
                ns.print(`[INFO] Purchased new server: ${purchaseResult.name} (${ns.nFormat(purchaseResult.ram, "0.0")} GB RAM)`);
                await ensureScriptsOnServer(ns, purchaseResult.name, scripts);
                ns.print(`[INFO] Server ${purchaseResult.name} is ready and added to the swarm.`);
            } else {
                ns.print(`[INFO] No server purchased. Monitoring finances.`);
            }
        }

        // ======= REAL-TIME STATUS REPORT (Positionally NSFW) =======
        await reportStatus(ns, baseRam, moneyThreshold, maxRam, totalEarnings, currentTarget);

        // ======= WAIT BETWEEN CYCLES =======
        await ns.sleep(hackUpdateInterval);
    }
}

/**
 * Finds the best target based on max money and minimum security ratio.
 */
function findBestTarget(ns) {
    const servers = ns.scan("home").filter(s => ns.hasRootAccess(s));
    return servers
        .filter(s => ns.getServerMaxMoney(s) > 0)
        .sort((a, b) => (ns.getServerMaxMoney(b) / ns.getServerMinSecurityLevel(b)) -
                        (ns.getServerMaxMoney(a) / ns.getServerMinSecurityLevel(a)))[0];
}

/**
 * Executes weaken/grow/hack using available servers with usage fraction on home.
 */
async function executeHackingCycle(ns, target, hackThreshold, growThreshold, weakenOffset, homeRamUsageFraction) {
    const security = ns.getServerSecurityLevel(target);
    const minSecurity = ns.getServerMinSecurityLevel(target);
    const money = ns.getServerMoneyAvailable(target);
    const maxMoney = ns.getServerMaxMoney(target);

    if (security > minSecurity + weakenOffset) {
        await executeActionDistributed(ns, "weaken", target, homeRamUsageFraction);
    } else if (money < maxMoney * growThreshold) {
        await executeActionDistributed(ns, "grow", target, homeRamUsageFraction);
    } else if (money >= maxMoney * hackThreshold) {
        return await executeActionDistributed(ns, "hack", target, homeRamUsageFraction);
    }
    return 0;
}

/**
 * Distributes an action (weaken, grow, hack) across all available servers.
 */
async function executeActionDistributed(ns, action, target, homeRamUsageFraction) {
    const scriptMap = { weaken: "weaken.js", grow: "grow.js", hack: "hack.js" };
    const script = scriptMap[action];
    const servers = [ns.getHostname(), ...ns.getPurchasedServers()]
        .filter(s => ns.hasRootAccess(s))
        .sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));

    const scriptRam = ns.getScriptRam(script, "home");
    if (scriptRam === 0) {
        ns.print(`[ERROR] ${script} not found or zero RAM usage.`);
        return 0;
    }

    let totalThreads = 0;
    for (const srv of servers) {
        const maxRam = ns.getServerMaxRam(srv);
        const usedRam = ns.getServerUsedRam(srv);
        const usageFraction = srv === "home" ? homeRamUsageFraction : 1.0;
        const usableRam = Math.max(0, maxRam * usageFraction - usedRam);
        const threads = Math.floor(usableRam / scriptRam);

        if (threads > 0) {
            ns.exec(script, srv, threads, target);
            totalThreads += threads;
        }
    }

    ns.print(`[INFO] Launched ${totalThreads} threads for ${action} on ${target}.`);
    return totalThreads;
}

/**
 * Ensures all servers have the required scripts.
 */
async function ensureScriptsOnAllServers(ns, scripts) {
    const servers = [ns.getHostname(), ...ns.getPurchasedServers()];
    for (const srv of servers) {
        await ensureScriptsOnServer(ns, srv, scripts);
    }
}

/**
 * Ensures a specific server has the required scripts.
 */
async function ensureScriptsOnServer(ns, server, scripts) {
    for (const script of scripts) {
        if (!ns.fileExists(script, server)) {
            await ns.scp(script, "home", server);
        }
    }
}

/**
 * Attempts to purchase a server if affordable.
 */
function attemptToBuyServer(ns, baseRam, moneyThreshold, maxServers, maxRam) {
    const servers = ns.getPurchasedServers();
    const cost = ns.getPurchasedServerCost(baseRam);

    if (servers.length < maxServers && ns.getServerMoneyAvailable("home") * moneyThreshold >= cost) {
        const name = `pserv-${servers.length}`;
        ns.purchaseServer(name, baseRam);
        return { purchased: true, name, ram: baseRam };
    }
    return { purchased: false };
}

/**
 * Reports current status and finances directly to the log window.
 */
async function reportStatus(ns, baseRam, moneyThreshold, maxRam, totalEarnings, currentTarget) {
    ns.clearLog(); // Clear the log for fresh output
    ns.print("=====================================================");
    ns.print(" orch-master-all-in-one.js: Status Report ");
    ns.print("-----------------------------------------------------");
    ns.print(`[INFO] Total Earnings: ${ns.nFormat(totalEarnings, "$0.00a")}`);
    ns.print(`[INFO] Hacking Target: ${currentTarget || "None"}`);
    ns.print(`[INFO] Servers Owned: ${ns.getPurchasedServers().length}/${ns.getPurchasedServerLimit()}`);
    ns.print(`[INFO] Next Server Cost: ${ns.nFormat(ns.getPurchasedServerCost(baseRam), "$0.00a")}`);
    ns.print(`[INFO] Max Server RAM: ${maxRam} GB`);
    ns.print("=====================================================");
}
