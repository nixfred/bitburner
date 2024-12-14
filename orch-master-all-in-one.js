/**
 * orch-master-all-in-one.js
 *
 * Unified hacking orchestrator and server management script:
 * - Dynamically distributes hack/grow/weaken actions across all available servers.
 * - Purchases new servers and integrates them into the swarm.
 * - Provides 5-minute status reports including current finances, shortfalls, and time estimates.
 *
 * Usage:
 * run orch-master-all-in-one.js
 */

export async function main(ns) {
    ns.disableLog("ALL");

    // ======== User-Adjustable Configuration ========
    const hackUpdateInterval = 30000;     // Time between hack cycles (ms)
    const cyclesPerBuyCheck = 10;         // Every 10 cycles * 30s = 5 min for buy checks
    const hackThreshold = 0.75;           // Hack if money >= 75% of max
    const growThreshold = 0.90;           // Grow if money < 90% of max
    const weakenOffset = 10;              // Weaken if security > minSec + 10
    const homeRamUsageFraction = 0.6;     // Use only 60% of home RAM for hacking actions
    const moneyThreshold = 0.25;          // Buy server if cost < 25% of current money
    const baseRam = 4096;                 // Minimum RAM for purchased servers
    const scripts = ["hack.js", "grow.js", "weaken.js"]; // Required scripts
    // ==============================================

    let currentTarget = null;
    let totalEarnings = 0;
    let targetSwitches = 0;

    const maxServers = ns.getPurchasedServerLimit();
    const maxRam = ns.getPurchasedServerMaxRam();

    ns.tprint("=====================================================");
    ns.tprint(" orch-master-all-in-one.js: Unified Hack & Buy Script ");
    ns.tprint("-----------------------------------------------------");
    ns.tprint("Automatically configures new servers and integrates them into the swarm.");
    ns.tprint("=====================================================");

    let cycleCount = 0;

    while (true) {
        cycleCount++;

        // 1. Ensure all purchased servers have required scripts
        try {
            await ensureScriptsOnAllServers(ns, scripts);
        } catch (err) {
            ns.tprint(`[ERROR] Failed to deploy scripts: ${err}`);
        }

        // 2. HACKING LOGIC
        const newTarget = findBestTarget(ns);

        if (newTarget !== currentTarget) {
            targetSwitches++;
            currentTarget = newTarget;
            ns.tprint(`[INFO] Switching hacking target to: ${currentTarget}`);
        }

        if (currentTarget) {
            const earnings = await executeHackingCycle(ns, currentTarget, hackThreshold, growThreshold, weakenOffset, homeRamUsageFraction);
            if (earnings > 0) {
                totalEarnings += earnings;
                ns.tprint(`[INFO] Earned ${ns.nFormat(earnings, "$0.00a")}. Total: ${ns.nFormat(totalEarnings, "$0.00a")}`);
            }
        } else {
            ns.tprint(`[WARN] No suitable hacking targets found.`);
        }

        // 3. SERVER BUYING LOGIC every 5 minutes
        if (cycleCount >= cyclesPerBuyCheck) {
            cycleCount = 0;
            const purchaseResult = attemptToBuyServer(ns, baseRam, moneyThreshold, maxServers, maxRam);
            if (purchaseResult && purchaseResult.purchased) {
                ns.tprint(`[INFO] Purchased new server: ${purchaseResult.name} (${ns.nFormat(purchaseResult.ram, "0.0")} GB RAM)`);
                // Copy scripts to the newly purchased server
                await ensureScriptsOnServer(ns, purchaseResult.name, scripts);
                ns.tprint(`[INFO] Server ${purchaseResult.name} is ready and added to the swarm.`);
            } else {
                // If no purchase was made, report status
                await reportStatus(ns, baseRam, moneyThreshold, maxRam);
            }
        }

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
 * Reports current status and finances.
 */
async function reportStatus(ns, baseRam, moneyThreshold, maxRam) {
    ns.tprint(`[STATUS] Total earnings: ${ns.nFormat(totalEarnings, "$0.00a")}`);
    ns.tprint(`[STATUS] Servers owned: ${ns.getPurchasedServers().length}/${maxServers}`);
    ns.tprint(`[STATUS] Next server cost: ${ns.nFormat(ns.getPurchasedServerCost(baseRam), "$0.00a")}`);
}
