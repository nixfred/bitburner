/**
 * GodFarm.js - Unified Farming and Hacking Script
 * Scans servers, identifies the best target, and deploys hacking scripts to maximize profits.
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.clearLog();
    ns.tail();

    const targetFile = "currentTarget.txt";
    const scripts = ["hack.js", "grow.js", "weaken.js"];
    const homeRamFraction = 0.75; // Reserve 25% of home RAM
    const scanInterval = 10000; // 10 seconds between each run

    while (true) {
        // Step 1: Identify the best target
        const target = findBestTarget(ns);
        if (target) {
            ns.print(`[INFO] Best target identified: ${target}`);
            ns.write(targetFile, target, "w");
            ns.print(`[INFO] Target saved to ${targetFile}`);

            // Step 2: Deploy hacking scripts to all eligible servers
            await deployHackingScripts(ns, scripts, target, homeRamFraction);
        } else {
            ns.print(`[WARN] No valid target found. Retrying...`);
        }

        await ns.sleep(scanInterval);
    }
}

/**
 * Finds the best target server based on maximum money and minimum security.
 */
function findBestTarget(ns) {
    const servers = findAllServers(ns);
    const validTargets = servers.filter(server => {
        return (
            ns.hasRootAccess(server) &&
            ns.getServerMaxMoney(server) > 0 &&
            ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel()
        );
    });

    if (validTargets.length === 0) return null;

    return validTargets.sort((a, b) => {
        const ratioA = ns.getServerMaxMoney(a) / ns.getServerMinSecurityLevel(a);
        const ratioB = ns.getServerMaxMoney(b) / ns.getServerMinSecurityLevel(b);
        return ratioB - ratioA;
    })[0];
}

/**
 * Recursively finds all servers accessible from home.
 */
function findAllServers(ns) {
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

/**
 * Deploys hacking scripts to home, purchased servers, and hacked servers.
 */
async function deployHackingScripts(ns, scripts, target, homeRamFraction) {
    const allServers = findAllServers(ns);
    const purchasedServers = ns.getPurchasedServers();
    const hackedServers = allServers.filter(server => {
        return ns.hasRootAccess(server) && ns.getServerMaxRam(server) > 0 && !server.startsWith("pserv-");
    });

    const serversToUse = [...purchasedServers, "home", ...hackedServers];

    ns.print("=====================================================");
    ns.print("             Script Deployment Summary               ");
    ns.print("=====================================================");

    for (const server of serversToUse) {
        const maxRam = ns.getServerMaxRam(server);
        const usedRam = ns.getServerUsedRam(server);
        const reservedRam = server === "home" ? maxRam * (1 - homeRamFraction) : 0;
        const availableRam = maxRam - usedRam - reservedRam;

        if (availableRam <= 0) {
            ns.print(`[WARN] No available RAM on ${server}. Skipping deployment.`);
            continue;
        }

        // Ensure all required scripts are present on the server
        let scriptsCopied = true;
        for (const script of scripts) {
            if (!ns.fileExists(script, server)) {
                const success = await ns.scp(script, "home", server);
                if (!success) {
                    ns.print(`[ERROR] Failed to copy ${script} to ${server}.`);
                    scriptsCopied = false;
                }
            }
        }

        if (!scriptsCopied) continue;

        // Calculate thread allocation
        const weakenThreads = Math.floor((availableRam * 0.5) / ns.getScriptRam("weaken.js"));
        const growThreads = Math.floor((availableRam * 0.3) / ns.getScriptRam("grow.js"));
        const hackThreads = Math.floor((availableRam * 0.2) / ns.getScriptRam("hack.js"));

        // Deploy scripts
        let totalThreads = 0;
        if (weakenThreads > 0) {
            const pid = ns.exec("weaken.js", server, weakenThreads, target);
            if (pid > 0) {
                totalThreads += weakenThreads;
            } else {
                ns.print(`[ERROR] Failed to execute weaken.js on ${server}.`);
            }
        }

        if (growThreads > 0) {
            const pid = ns.exec("grow.js", server, growThreads, target);
            if (pid > 0) {
                totalThreads += growThreads;
            } else {
                ns.print(`[ERROR] Failed to execute grow.js on ${server}.`);
            }
        }

        if (hackThreads > 0) {
            const pid = ns.exec("hack.js", server, hackThreads, target);
            if (pid > 0) {
                totalThreads += hackThreads;
            } else {
                ns.print(`[ERROR] Failed to execute hack.js on ${server}.`);
            }
        }

        if (totalThreads > 0) {
            ns.print(`[INFO] Deployed ${totalThreads} threads on ${server} targeting ${target}.`);
        } else {
            ns.print(`[WARN] No threads deployed on ${server}.`);
        }
    }

    ns.print("=====================================================");
    ns.print("[SUMMARY] Script deployment complete.");
    ns.print("=====================================================");
}
