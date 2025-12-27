/** @param {NS} ns */
export async function main(ns) {
    const t = ns.args[0] || "n00dles";
    while (true) {
        if (ns.getServerSecurityLevel(t) > ns.getServerMinSecurityLevel(t) + 5) await ns.weaken(t);
        else if (ns.getServerMoneyAvailable(t) < ns.getServerMaxMoney(t) * 0.75) await ns.grow(t);
        else await ns.hack(t);
    }
}
