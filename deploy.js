/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();
    
    const target = "joesguns";  // Best early target
    const worker = "worker.js";
    const workerRam = ns.getScriptRam(worker);
    
    // Get all servers
    const servers = ["home"];
    const queue = ["home"];
    while (queue.length) {
        const s = queue.shift();
        for (const next of ns.scan(s)) {
            if (!servers.includes(next)) {
                servers.push(next);
                queue.push(next);
            }
        }
    }
    
    let totalThreads = 0;
    
    for (const server of servers) {
        if (server === "home") continue;
        
        // Try to get root
        try { ns.brutessh(server); } catch {}
        try { ns.ftpcrack(server); } catch {}
        try { ns.nuke(server); } catch {}
        
        if (!ns.hasRootAccess(server)) continue;
        
        // Kill existing scripts, copy worker, run with max threads
        ns.killall(server);
        await ns.scp(worker, server);
        
        const ram = ns.getServerMaxRam(server);
        if (ram < workerRam) continue;
        
        const threads = Math.floor(ram / workerRam);
        if (threads > 0) {
            ns.exec(worker, server, threads, target);
            totalThreads += threads;
            ns.print(`${server}: ${threads} threads`);
        }
    }
    
    ns.print(`\n=== DEPLOYED ${totalThreads} THREADS on ${target} ===`);
    ns.print(`Let this run. Money will flow faster now.`);
}
