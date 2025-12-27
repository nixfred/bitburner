/**
 * pai-early.js - PAI Early Game Script (LOW RAM)
 * Agent: PAI-EarlyGame
 * RAM: ~2.5GB
 *
 * Lightweight script for fresh starts with limited RAM.
 * Targets n00dles (easiest server) to build initial capital.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-EarlyGame";
    const TARGET = "n00dles"; // Easiest target in game

    ns.disableLog("ALL");
    ns.tail();

    ns.print(`[${AGENT}] PURPOSE: Build early game capital`);
    ns.print(`[${AGENT}] TARGET: ${TARGET}`);
    ns.print(`[${AGENT}] GOAL: Reach $1 TRILLION`);

    // Get root on n00dles (no ports needed)
    if (!ns.hasRootAccess(TARGET)) {
        ns.nuke(TARGET);
        ns.print(`[${AGENT}] ACTION: Nuked ${TARGET}`);
    }

    let totalEarned = 0;
    let cycles = 0;
    const startMoney = ns.getServerMoneyAvailable("home");

    while (true) {
        cycles++;
        const sec = ns.getServerSecurityLevel(TARGET);
        const minSec = ns.getServerMinSecurityLevel(TARGET);
        const money = ns.getServerMoneyAvailable(TARGET);
        const maxMoney = ns.getServerMaxMoney(TARGET);

        ns.clearLog();
        const current = ns.getServerMoneyAvailable("home");
        const earned = current - startMoney;

        ns.print("═".repeat(50));
        ns.print(`[${AGENT}] EARLY GAME MODE`);
        ns.print("═".repeat(50));
        ns.print(`Money: $${ns.formatNumber(current)}`);
        ns.print(`Earned: $${ns.formatNumber(earned)}`);
        ns.print(`Cycles: ${cycles}`);
        ns.print(`Target: ${TARGET}`);
        ns.print(`Security: ${sec.toFixed(1)}/${minSec}`);
        ns.print(`Target $: ${ns.formatNumber(money)}/${ns.formatNumber(maxMoney)}`);
        ns.print("═".repeat(50));

        if (sec > minSec + 5) {
            ns.print(`[${AGENT}] ACTION: Weakening...`);
            await ns.weaken(TARGET);
            ns.print(`[${AGENT}] RESULT: Security reduced`);
        } else if (money < maxMoney * 0.75) {
            ns.print(`[${AGENT}] ACTION: Growing...`);
            await ns.grow(TARGET);
            ns.print(`[${AGENT}] RESULT: Money grown`);
        } else {
            ns.print(`[${AGENT}] ACTION: Hacking...`);
            const stolen = await ns.hack(TARGET);
            totalEarned += stolen;
            ns.print(`[${AGENT}] RESULT: Stole $${ns.formatNumber(stolen)}`);
        }

        // Tip for upgrades
        if (current >= 200000 && cycles % 10 === 0) {
            ns.print(`[${AGENT}] TIP: Buy home RAM upgrade!`);
        }
    }
}
