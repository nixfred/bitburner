/**
 * pai-singularity-check.js - Check Singularity API availability
 * Agent: PAI-SingularityCheck
 * RAM: ~2GB
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-SingCheck";

    ns.ui.openTail();
    ns.print(`[${AGENT}] Checking Singularity API...`);
    ns.print("");

    // Check if ns.singularity exists
    if (ns.singularity) {
        ns.print(`[${AGENT}] ✓ Singularity namespace EXISTS`);

        // List available functions
        const funcs = Object.keys(ns.singularity);
        ns.print(`[${AGENT}] Available functions: ${funcs.length}`);
        ns.print("");

        // Key functions we need
        const keyFuncs = [
            "purchaseProgram",
            "upgradeHomeRam",
            "getUpgradeHomeRamCost",
            "joinFaction",
            "purchaseAugmentation",
            "installAugmentations",
            "workForFaction",
            "travelToCity"
        ];

        for (const f of keyFuncs) {
            const exists = typeof ns.singularity[f] === "function";
            ns.print(`[${AGENT}] ${exists ? "✓" : "✗"} ${f}`);
        }

        ns.print("");

        // Check RAM cost
        const ramCost = ns.singularity.getUpgradeHomeRamCost?.() || "N/A";
        ns.print(`[${AGENT}] Home RAM upgrade cost: $${ns.formatNumber(ramCost)}`);

        const homeRam = ns.getServerMaxRam("home");
        ns.print(`[${AGENT}] Current home RAM: ${homeRam}GB`);

    } else {
        ns.print(`[${AGENT}] ✗ Singularity NOT available`);
        ns.print(`[${AGENT}] Need Source-File 4 or higher RAM`);
    }

    ns.print("");
    ns.print(`[${AGENT}] Check complete.`);
}
