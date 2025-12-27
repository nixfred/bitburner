/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    const agent = "PAI-Grower";

    if (!target) {
        ns.tprint(`[${agent}] ERROR: No target specified`);
        return;
    }

    ns.print(`[${agent}] PURPOSE: Grow money on ${target}`);
    ns.print(`[${agent}] ACTION: Executing grow...`);

    const moneyBefore = ns.getServerMoneyAvailable(target);
    const multiplier = await ns.grow(target);
    const moneyAfter = ns.getServerMoneyAvailable(target);
    const gained = moneyAfter - moneyBefore;

    ns.print(`[${agent}] RESULT: Grew by ${multiplier.toFixed(2)}x (+$${ns.formatNumber(gained)})`);
    ns.print(`[${agent}] TARGET: ${target} now has $${ns.formatNumber(moneyAfter)}`);
}
