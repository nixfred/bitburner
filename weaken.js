/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    const agent = "PAI-Weakener";

    if (!target) {
        ns.tprint(`[${agent}] ERROR: No target specified`);
        return;
    }

    ns.print(`[${agent}] PURPOSE: Lower security on ${target}`);
    ns.print(`[${agent}] ACTION: Executing weaken...`);

    const secBefore = ns.getServerSecurityLevel(target);
    const reduction = await ns.weaken(target);
    const secAfter = ns.getServerSecurityLevel(target);
    const minSec = ns.getServerMinSecurityLevel(target);

    ns.print(`[${agent}] RESULT: Reduced security by ${reduction.toFixed(2)}`);
    ns.print(`[${agent}] TARGET: ${target} security ${secAfter.toFixed(1)}/${minSec} (min)`);
}
