/**
 * pai-simple.js - SIMPLE WORKING SCRIPT
 * NO DEPENDENCIES. Does everything directly.
 *
 * Based on proven community script that WORKS.
 * @param {NS} ns
 */
export async function main(ns) {
    const target = "n00dles"; // Easiest target, level 1

    ns.disableLog("ALL");
    ns.ui.openTail();

    // Get root if needed
    if (!ns.hasRootAccess(target)) {
        ns.nuke(target);
    }

    const startMoney = ns.getServerMoneyAvailable("home");
    const startLevel = ns.getHackingLevel();
    let hacks = 0;
    let weakens = 0;
    let grows = 0;

    ns.print("PAI-Simple: STARTING - Target: " + target);
    ns.print("PAI-Simple: This script works. Period.");

    while (true) {
        const myMoney = ns.getServerMoneyAvailable("home");
        const earned = myMoney - startMoney;
        const level = ns.getHackingLevel();
        const levelsGained = level - startLevel;

        const securityMin = ns.getServerMinSecurityLevel(target);
        const securityCurrent = ns.getServerSecurityLevel(target);
        const moneyMax = ns.getServerMaxMoney(target);
        const moneyAvailable = ns.getServerMoneyAvailable(target);

        ns.clearLog();
        ns.print("════════════════════════════════════════");
        ns.print("  PAI-SIMPLE - WORKING SCRIPT");
        ns.print("════════════════════════════════════════");
        ns.print("  YOUR $: " + ns.formatNumber(myMoney) + " (+" + ns.formatNumber(earned) + ")");
        ns.print("  HACK LEVEL: " + level + " (+" + levelsGained + ")");
        ns.print("────────────────────────────────────────");
        ns.print("  Target: " + target);
        ns.print("  Security: " + securityCurrent.toFixed(1) + " / " + securityMin + " min");
        ns.print("  Money: " + ns.formatNumber(moneyAvailable) + " / " + ns.formatNumber(moneyMax));
        ns.print("────────────────────────────────────────");
        ns.print("  Hacks: " + hacks + " | Grows: " + grows + " | Weakens: " + weakens);
        ns.print("════════════════════════════════════════");

        // WEAKEN if security too high
        if (securityCurrent > securityMin + 5) {
            ns.print("  ACTION: Weakening...");
            await ns.weaken(target);
            weakens++;
        }
        // GROW if money too low
        else if (moneyAvailable < moneyMax * 0.75) {
            ns.print("  ACTION: Growing...");
            await ns.grow(target);
            grows++;
        }
        // HACK!
        else {
            ns.print("  ACTION: HACKING!");
            const stolen = await ns.hack(target);
            hacks++;
            if (stolen > 0) {
                ns.print("  STOLE: $" + ns.formatNumber(stolen));
            }
        }
    }
}
