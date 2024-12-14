/**
 * orch-master-all-in-one.js
 *
 * Unified hacking orchestrator and server management script:
 * - Dynamically distributes hack/grow/weaken actions across all available servers.
 * - Purchases new servers every 90 seconds (price and affordability checked).
 * - Automatically detects and integrates manually purchased servers.
 * - Provides real-time status reports directly in the log view.
 * - Optimizes resource usage by prioritizing servers with higher available RAM.
 * - Automatically switches targets for maximum profits.
 *
 * Usage:
 * run orch-master-all-in-one.js
 */

export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail(); // Automatically open the log window for real-time output

    // ======== User-Adjustable Configuration ========
    const hackUpdateInterval = 30000;     // Time between hack cycles (ms)
    const buyCheckInterval = 90000;       // Time between server purchase checks (ms)
    const hackThreshold = 0.75;           // Hack if money >= 75% of max
    const growThreshold = 0.90;           // Grow if money < 90% of max
    const weakenOffset = 10;              // Weaken if security > minSec + 10
    const homeRamUsageFraction = 0.6;     // Use only 60% of home RAM for hacking actions
    const moneyThreshold = 0.25;          // Buy server if cost < 25% of current money
    const baseRam = 1024;                 // Minimum RAM for purchased servers (1 TB)
    const scripts = ["hack.js", "grow.js", "weaken.js"]; // Required scripts
    const prioritizeTarget = "iron-gym";  // Set this to force-prioritize a target
    // ==============================================

    let currentTarget = null;
    let totalEarnings = 0;
    let targetSwitches = 0;
    let lastBuyCheck = 0;

    const maxServers = ns.getPurchasedServerLimit();
    const maxRam = ns.getPurchasedServerMaxRam();

    // Keep track of initialized servers
    const trackedServers = new Set();

    while (true) {
        // ======= DETECT & INITIALIZE NEW SERVERS =======
        await detectAndInitializeNewServers(ns, scripts, trackedServers);

        // ======= HACKING LOGIC =======
        let newTarget = findBestTarget(ns, prioritizeTarget);
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

        // ======= SERVER PURCHASE LOGIC =======
        if (Date.now() - lastBuyCheck > buyCheckInterval) {
            lastBuyCheck = Date.now();
            const purchaseResult = attemptToBuyServer(ns, baseRam, moneyThreshold, maxServers, maxRam);
            if (purchaseResult && purchaseResult.purchased) {
                ns.print(`[INFO] Purchased new server: ${purchaseResult.name} (${ns.nFormat(purchaseResult.ram, "0.0")} GB RAM)`);
            } else {
                ns.print(`[INFO] No server purchased. Monitoring finances.`);
            }
        }

        // ======= REAL-TIME STATUS REPORT =======
        await reportStatus(ns, baseRam, moneyThreshold, maxRam, totalEarnings, currentTarget);

        // ======= WAIT BETWEEN CYCLES =======
        await ns.sleep(hackUpdateInterval);
    }
}

/**
 * Executes weaken/grow/hack on a target using appropriate thresholds.
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
 * Detects and initializes all purchased servers, including manually added ones.
 */
async function detectAndInitializeNewServers(ns, scripts, trackedServers) {
    const allServers = ns.getPurchasedServers();
    for (const server of allServers) {
        if (!trackedServers.has(server)) {
            ns.print(`[INFO] Found untracked server: ${server}. Initializing...`);
            trackedServers.add(server);
            await ensureScriptsOnServer(ns, server, scripts);
            ns.print(`[INFO] Initialized server: ${server} with required scripts.`);
        } else {
            // Ensure scripts are still present on tracked servers
            for (const script of scripts) {
                if (!ns.fileExists(script, server)) {
                    ns.print(`[WARN] Missing script ${script} on server: ${server}. Re-deploying.`);
                    await ns.scp(script, server, "home");
                }
            }
        }
    }
}

/**
 * Ensures a specific server has the required scripts and deploys them.
 */
async function ensureScriptsOnServer(ns, server, scripts) {
    for (const script of scripts) {
        if (!ns.fileExists(script, server)) {
            await ns.scp(script, server, "home"); // Corrected argument order
        }
    }
}

/**
 * Attempts to buy a server if conditions allow it.
 */
function attemptToBuyServer(ns, baseRam, moneyThreshold, maxServers, maxRam) {
    const currentMoney = ns.getServerMoneyAvailable("home");
    const cost = ns.getPurchasedServerCost(baseRam);
    const ownedServers = ns.getPurchasedServers();

    ns.print(`[DEBUG] Current Money: ${ns.nFormat(currentMoney, "$0.00a")}`);
    ns.print(`[DEBUG] Server Cost: ${ns.nFormat(cost, "$0.00a")}`);
    ns.print(`[DEBUG] Money Threshold: ${moneyThreshold * 100}%`);
    ns.print(`[DEBUG] Owned Servers: ${ownedServers.length}/${maxServers}`);

    if (ownedServers.length < maxServers && cost < currentMoney * moneyThreshold) {
        const hostname = ns.purchaseServer(`pserv-${ownedServers.length}`, baseRam);
        if (hostname) {
            return { purchased: true, name: hostname, ram: baseRam };
        }
    } else {
        ns.print(`[INFO] Skipping server purchase. Cost: ${ns.nFormat(cost, "$0.00a")}, Money: ${ns.nFormat(currentMoney, "$0.00a")}`);
    }
    return { purchased: false };
}

/**
 * Finds the best target based on max money and min sec ratio.
 */
function findBestTarget(ns, prioritizeTarget = null) {
    const servers = ns.scan("home").filter(s => ns.hasRootAccess(s));
    const validTargets = servers.filter(s => ns.getServerMaxMoney(s) > 0);

    ns.print(`[DEBUG] Valid Targets:`);
    for (const target of validTargets) {
        const maxMoney = ns.getServerMaxMoney(target);
        const minSec = ns.getServerMinSecurityLevel(target);
        ns.print(`  ${target}: Max Money: ${ns.nFormat(maxMoney, "$0.00a")}, Min Sec: ${minSec}`);
    }

    if (prioritizeTarget && validTargets.includes(prioritizeTarget)) {
        ns.print(`[DEBUG] Prioritizing target: ${prioritizeTarget}`);
        return prioritizeTarget;
    }

    return validTargets
        .sort((a, b) => (ns.getServerMaxMoney(b) / ns.getServerMinSecurityLevel(b)) -
                        (ns.getServerMaxMoney(a) / ns.getServerMinSecurityLevel(a)))[0];
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
