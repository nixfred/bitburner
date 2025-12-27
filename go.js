/** @param {NS} ns */
export async function main(ns) {
    const servers = ["n00dles", "foodnstuff", "sigma-cosmetics", "joesguns"];
    for (const s of servers) {
        try { ns.brutessh(s); } catch {}
        try { ns.nuke(s); } catch {}
        if (ns.hasRootAccess(s)) {
            ns.killall(s);
            await ns.scp("worker.js", s);
            const ram = ns.getServerMaxRam(s);
            const threads = Math.floor(ram / 1.7);
            if (threads > 0) ns.exec("worker.js", s, threads, "joesguns");
        }
    }
    ns.tprint("DEPLOYED - check servers");
}
