/** @param {NS} ns - MINIMAL manager ~3.5GB */
export async function main(ns) {
    ns.disableLog("ALL");
    const servers = ["n00dles", "foodnstuff", "sigma-cosmetics", "joesguns", "hong-fang-tea", "harakiri-sushi", "iron-gym"];
    const target = "joesguns";
    let total = 0;
    for (const s of servers) {
        try { ns.brutessh(s); } catch {}
        try { ns.nuke(s); } catch {}
        if (!ns.hasRootAccess(s)) continue;
        ns.killall(s);
        await ns.scp("worker.js", s);
        const t = Math.floor(ns.getServerMaxRam(s) / 2.4);
        if (t > 0) { ns.exec("worker.js", s, t, target); total += t; }
    }
    ns.tprint("DEPLOYED " + total + " threads on " + target);
}
