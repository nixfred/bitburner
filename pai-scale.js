/** @param {NS} ns */
export async function main(ns) {
    // PAI-SCALE: Uses all available RAM for maximum hacking
    // PURPOSE: Scale up farming when more RAM available
    const target = ns.getHackingLevel() >= 10 ? "joesguns" : "n00dles";

    ns.disableLog("ALL");
    ns.ui.openTail();

    if (!ns.hasRootAccess(target)) ns.nuke(target);

    const scriptRam = 1.75; // RAM per hack/grow/weaken
    const homeRam = ns.getServerMaxRam("home");
    const usedRam = ns.getServerUsedRam("home");
    const availRam = homeRam - usedRam - 2; // Reserve 2GB
    const threads = Math.floor(availRam / scriptRam);

    ns.print(`PAI-SCALE: ${threads} threads on ${target}`);
    ns.print(`RAM: ${homeRam}GB total, ${availRam.toFixed(1)}GB available`);

    let cycles = 0;
    while (true) {
        const sec = ns.getServerSecurityLevel(target);
        const minSec = ns.getServerMinSecurityLevel(target);
        const money = ns.getServerMoneyAvailable(target);
        const maxMoney = ns.getServerMaxMoney(target);

        cycles++;
        ns.print(`[${cycles}] Sec:${sec.toFixed(1)}/${minSec} Money:${ns.formatNumber(money)}/${ns.formatNumber(maxMoney)}`);

        if (sec > minSec + 5) {
            await ns.weaken(target);
        } else if (money < maxMoney * 0.75) {
            await ns.grow(target);
        } else {
            const stolen = await ns.hack(target);
            if (stolen > 0) ns.print(`STOLE: $${ns.formatNumber(stolen)}`);
        }
    }
}
