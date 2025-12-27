/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    let target = "n00dles";
    const lvl = ns.getHackingLevel();
    if (lvl >= 75) target = "phantasy";
    else if (lvl >= 50) target = "max-hardware";
    else if (lvl >= 25) target = "neo-net";
    else if (lvl >= 10) target = "joesguns";

    try { ns.brutessh(target); } catch {}
    try { ns.ftpcrack(target); } catch {}
    try { ns.nuke(target); } catch {}

    if (!ns.hasRootAccess(target)) {
        target = "n00dles";
        ns.nuke(target);
    }

    ns.print("TARGET: " + target);

    while (true) {
        const sec = ns.getServerSecurityLevel(target);
        const minSec = ns.getServerMinSecurityLevel(target);
        const money = ns.getServerMoneyAvailable(target);
        const maxMoney = ns.getServerMaxMoney(target);
        const myMoney = ns.getServerMoneyAvailable("home");

        ns.print("$" + ns.formatNumber(myMoney) + " | Hack:" + ns.getHackingLevel() + " | " + target);

        if (sec > minSec + 5) {
            await ns.weaken(target);
        } else if (money < maxMoney * 0.75) {
            await ns.grow(target);
        } else {
            await ns.hack(target);
        }
    }
}
