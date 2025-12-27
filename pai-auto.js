/** @param {NS} ns */
export async function main(ns) {
    // PAI-AUTO: Fully autonomous hacking - no intervention needed
    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.print("PAI-AUTO: Taking over completely");

    const crackers = [
        { file: "BruteSSH.exe", fn: ns.brutessh },
        { file: "FTPCrack.exe", fn: ns.ftpcrack },
        { file: "relaySMTP.exe", fn: ns.relaysmtp },
        { file: "HTTPWorm.exe", fn: ns.httpworm },
        { file: "SQLInject.exe", fn: ns.sqlinject }
    ];

    function getServers() {
        const found = ["home"];
        const queue = ["home"];
        while (queue.length) {
            const s = queue.shift();
            for (const next of ns.scan(s)) {
                if (!found.includes(next)) {
                    found.push(next);
                    queue.push(next);
                }
            }
        }
        return found.filter(s => s !== "home");
    }

    function crackServer(server) {
        let opened = 0;
        for (const c of crackers) {
            if (ns.fileExists(c.file, "home")) {
                try { c.fn(server); opened++; } catch {}
            }
        }
        const needed = ns.getServerNumPortsRequired(server);
        if (opened >= needed && !ns.hasRootAccess(server)) {
            try { ns.nuke(server); return true; } catch { return false; }
        }
        return ns.hasRootAccess(server);
    }

    function getBestTarget(servers) {
        const hackLevel = ns.getHackingLevel();
        let best = null;
        let bestScore = 0;
        for (const s of servers) {
            if (!ns.hasRootAccess(s)) continue;
            if (ns.getServerRequiredHackingLevel(s) > hackLevel) continue;
            const maxMoney = ns.getServerMaxMoney(s);
            if (maxMoney === 0) continue;
            const score = maxMoney / ns.getServerMinSecurityLevel(s);
            if (score > bestScore) {
                bestScore = score;
                best = s;
            }
        }
        return best || "n00dles";
    }

    let cycle = 0;
    while (true) {
        cycle++;
        const servers = getServers();

        // Crack everything we can
        let rooted = 0;
        for (const s of servers) {
            if (crackServer(s)) rooted++;
        }

        // Find best target
        const target = getBestTarget(servers);
        const money = ns.getServerMoneyAvailable("home");
        const hackLvl = ns.getHackingLevel();

        ns.print(`[${cycle}] $${ns.formatNumber(money)} | Hack:${hackLvl} | Rooted:${rooted}/${servers.length} | Target:${target}`);

        // Check darkweb purchases
        if (ns.hasTorRouter()) {
            const programs = [
                { name: "BruteSSH.exe", cost: 500000 },
                { name: "FTPCrack.exe", cost: 1500000 },
                { name: "relaySMTP.exe", cost: 5000000 },
                { name: "HTTPWorm.exe", cost: 30000000 },
                { name: "SQLInject.exe", cost: 250000000 }
            ];
            for (const p of programs) {
                if (!ns.fileExists(p.name, "home") && money >= p.cost) {
                    ns.print(`>>> BUY ${p.name} - run: buy ${p.name}`);
                }
            }
        }

        // Hack the best target
        const sec = ns.getServerSecurityLevel(target);
        const minSec = ns.getServerMinSecurityLevel(target);
        const tMoney = ns.getServerMoneyAvailable(target);
        const maxMoney = ns.getServerMaxMoney(target);

        if (sec > minSec + 5) {
            await ns.weaken(target);
        } else if (tMoney < maxMoney * 0.75) {
            await ns.grow(target);
        } else {
            const stolen = await ns.hack(target);
            if (stolen > 0) ns.print(`STOLE $${ns.formatNumber(stolen)} from ${target}`);
        }
    }
}
