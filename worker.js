/**
 * worker.js - Lightweight parallel worker
 * Agent: PAI-Worker
 * RAM: ~1.7GB per instance
 *
 * Run multiple instances to speed up hacking.
 * Usage: run worker.js [target]
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const target = ns.args[0] || "n00dles";
    const id = ns.pid;

    while (true) {
        const sec = ns.getServerSecurityLevel(target);
        const minSec = ns.getServerMinSecurityLevel(target);
        const money = ns.getServerMoneyAvailable(target);
        const maxMoney = ns.getServerMaxMoney(target);

        if (sec > minSec + 5) {
            await ns.weaken(target);
        } else if (money < maxMoney * 0.5) {
            await ns.grow(target);
        } else {
            const stolen = await ns.hack(target);
            if (stolen > 0) {
                ns.print(`[Worker-${id}] Stole $${ns.formatNumber(stolen)}`);
            }
        }
    }
}
