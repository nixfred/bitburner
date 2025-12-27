/**
 * pai-turbo.js - AGGRESSIVE Early Game Script
 * Agent: PAI-Turbo
 * RAM: ~2.5GB
 *
 * Hacks immediately regardless of target state.
 * Less efficient but MUCH faster money.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Turbo";
    const TARGET = "n00dles";

    ns.disableLog("ALL");
    ns.ui.openTail();

    if (!ns.hasRootAccess(TARGET)) {
        ns.nuke(TARGET);
    }

    let totalStolen = 0;
    let hacks = 0;
    let grows = 0;
    const startMoney = ns.getServerMoneyAvailable("home");

    ns.print(`[${AGENT}] TURBO MODE - Hack first, ask questions later!`);

    while (true) {
        const sec = ns.getServerSecurityLevel(TARGET);
        const minSec = ns.getServerMinSecurityLevel(TARGET);
        const money = ns.getServerMoneyAvailable(TARGET);

        ns.clearLog();
        const current = ns.getServerMoneyAvailable("home");
        const earned = current - startMoney;

        ns.print("═".repeat(50));
        ns.print(`[${AGENT}] TURBO MODE 🚀`);
        ns.print("═".repeat(50));
        ns.print(`Your Money: $${ns.formatNumber(current)}`);
        ns.print(`Earned: $${ns.formatNumber(earned)}`);
        ns.print(`Stolen: $${ns.formatNumber(totalStolen)}`);
        ns.print(`Hacks: ${hacks} | Grows: ${grows}`);
        ns.print(`Target: ${TARGET} ($${ns.formatNumber(money)})`);
        ns.print("═".repeat(50));

        // Weaken only if security is really high
        if (sec > minSec + 10) {
            ns.print(`[${AGENT}] Weakening (sec too high)...`);
            await ns.weaken(TARGET);
        }
        // Quick grow if target is nearly empty
        else if (money < 1000) {
            ns.print(`[${AGENT}] Quick grow (target empty)...`);
            await ns.grow(TARGET);
            grows++;
        }
        // Otherwise HACK!
        else {
            ns.print(`[${AGENT}] HACKING! 💰`);
            const stolen = await ns.hack(TARGET);
            totalStolen += stolen;
            hacks++;
            if (stolen > 0) {
                ns.print(`[${AGENT}] GOT $${ns.formatNumber(stolen)}!`);
            }
        }
    }
}
