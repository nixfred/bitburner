/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    const agent = "PAI-Hacker";

    if (!target) {
        ns.tprint(`[${agent}] ERROR: No target specified`);
        return;
    }

    ns.print(`[${agent}] PURPOSE: Steal money from ${target}`);
    ns.print(`[${agent}] ACTION: Executing hack...`);

    const moneyBefore = ns.getServerMoneyAvailable(target);
    const stolen = await ns.hack(target);
    const moneyAfter = ns.getServerMoneyAvailable(target);

    ns.print(`[${agent}] RESULT: Stole $${ns.formatNumber(stolen)}`);
    ns.print(`[${agent}] TARGET: ${target} now has $${ns.formatNumber(moneyAfter)}`);
}
