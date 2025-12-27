/**
 * pai-network.js - Network Expansion Agent
 * Agent: PAI-Network
 * RAM: ~3GB
 *
 * Scans and roots all available servers.
 * Runs periodically to expand the network.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Network";

    ns.disableLog("ALL");
    ns.ui.openTail();

    ns.print(`[${AGENT}] Network Expansion Agent`);
    ns.print(`[${AGENT}] Scanning for new targets...`);

    while (true) {
        const hackLevel = ns.getHackingLevel();
        const allServers = getAllServers(ns);
        let rooted = 0;
        let newRoots = [];

        for (const server of allServers) {
            if (server === "home") continue;
            if (ns.hasRootAccess(server)) continue;

            const reqHack = ns.getServerRequiredHackingLevel(server);
            if (reqHack > hackLevel) continue;

            const portsNeeded = ns.getServerNumPortsRequired(server);
            const portsAvailable = countPorts(ns);

            if (portsAvailable >= portsNeeded) {
                openPorts(ns, server);
                try {
                    ns.nuke(server);
                    rooted++;
                    newRoots.push(server);
                } catch {}
            }
        }

        const rootedServers = allServers.filter(s => s !== "home" && ns.hasRootAccess(s));
        const hackable = rootedServers.filter(s =>
            ns.getServerMaxMoney(s) > 0 &&
            ns.getServerRequiredHackingLevel(s) <= hackLevel
        );

        ns.clearLog();
        ns.print(`[${AGENT}] ════════════════════════════════════`);
        ns.print(`[${AGENT}] 🌐 NETWORK STATUS`);
        ns.print(`[${AGENT}] ────────────────────────────────────`);
        ns.print(`[${AGENT}] Discovered: ${allServers.length} servers`);
        ns.print(`[${AGENT}] Rooted: ${rootedServers.length}`);
        ns.print(`[${AGENT}] Hackable: ${hackable.length}`);
        ns.print(`[${AGENT}] Port Openers: ${countPorts(ns)}/5`);
        ns.print(`[${AGENT}] ────────────────────────────────────`);

        if (newRoots.length > 0) {
            ns.print(`[${AGENT}] 🆕 Rooted: ${newRoots.join(", ")}`);
        }

        // Show top targets
        ns.print(`[${AGENT}] 🎯 TOP TARGETS:`);
        const targets = hackable
            .map(s => ({ name: s, money: ns.getServerMaxMoney(s) }))
            .sort((a, b) => b.money - a.money)
            .slice(0, 5);

        for (const t of targets) {
            ns.print(`[${AGENT}]   ${t.name}: $${ns.formatNumber(t.money)}`);
        }

        ns.print(`[${AGENT}] ════════════════════════════════════`);
        ns.print(`[${AGENT}] Next scan in 60s...`);

        await ns.sleep(60000);
    }
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

function countPorts(ns) {
    let count = 0;
    if (ns.fileExists("BruteSSH.exe", "home")) count++;
    if (ns.fileExists("FTPCrack.exe", "home")) count++;
    if (ns.fileExists("relaySMTP.exe", "home")) count++;
    if (ns.fileExists("HTTPWorm.exe", "home")) count++;
    if (ns.fileExists("SQLInject.exe", "home")) count++;
    return count;
}

function openPorts(ns, server) {
    if (ns.fileExists("BruteSSH.exe", "home")) ns.brutessh(server);
    if (ns.fileExists("FTPCrack.exe", "home")) ns.ftpcrack(server);
    if (ns.fileExists("relaySMTP.exe", "home")) ns.relaysmtp(server);
    if (ns.fileExists("HTTPWorm.exe", "home")) ns.httpworm(server);
    if (ns.fileExists("SQLInject.exe", "home")) ns.sqlinject(server);
}
