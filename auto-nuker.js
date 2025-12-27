/**
 * auto-nuker.js - Automatically gains root access on all servers
 * Uses all available port openers and nukes servers
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();

    const portOpeners = [
        { file: "BruteSSH.exe", fn: ns.brutessh },
        { file: "FTPCrack.exe", fn: ns.ftpcrack },
        { file: "relaySMTP.exe", fn: ns.relaysmtp },
        { file: "HTTPWorm.exe", fn: ns.httpworm },
        { file: "SQLInject.exe", fn: ns.sqlinject }
    ];

    // Count available port openers
    const availableOpeners = portOpeners.filter(p => ns.fileExists(p.file, "home"));
    ns.print(`[INFO] Available port openers: ${availableOpeners.length}/5`);

    // Get all servers recursively
    const allServers = getAllServers(ns);
    ns.print(`[INFO] Found ${allServers.length} servers to check`);

    let nukedCount = 0;
    let alreadyRooted = 0;
    let cannotNuke = 0;

    for (const server of allServers) {
        if (server === "home") continue;

        if (ns.hasRootAccess(server)) {
            alreadyRooted++;
            continue;
        }

        const requiredPorts = ns.getServerNumPortsRequired(server);
        const hackLevel = ns.getServerRequiredHackingLevel(server);
        const myHackLevel = ns.getHackingLevel();

        if (hackLevel > myHackLevel) {
            ns.print(`[SKIP] ${server}: Need hack level ${hackLevel} (have ${myHackLevel})`);
            cannotNuke++;
            continue;
        }

        if (requiredPorts > availableOpeners.length) {
            ns.print(`[SKIP] ${server}: Need ${requiredPorts} ports (have ${availableOpeners.length})`);
            cannotNuke++;
            continue;
        }

        // Open ports
        for (let i = 0; i < requiredPorts; i++) {
            try {
                availableOpeners[i].fn(server);
            } catch (e) {}
        }

        // Nuke!
        try {
            ns.nuke(server);
            nukedCount++;
            const maxMoney = ns.getServerMaxMoney(server);
            const ram = ns.getServerMaxRam(server);
            ns.print(`[NUKED] ${server} - RAM: ${ram}GB, MaxMoney: ${ns.formatNumber(maxMoney)}`);
        } catch (e) {
            ns.print(`[ERROR] Failed to nuke ${server}: ${e}`);
        }
    }

    ns.print("=".repeat(50));
    ns.print(`[SUMMARY] Nuked: ${nukedCount}, Already Rooted: ${alreadyRooted}, Cannot Nuke: ${cannotNuke}`);
    ns.print("=".repeat(50));
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
