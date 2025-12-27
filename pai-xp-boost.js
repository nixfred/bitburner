/**
 * pai-xp-boost.js - MAXIMUM XP GAIN
 * Agent: PAI-XPBoost
 * RAM: ~2.5GB
 *
 * Weaken gives the MOST XP per operation.
 * joesguns is the BEST XP server.
 * This script ONLY focuses on leveling up FAST.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-XPBoost";
    const TARGET = "joesguns"; // Best XP in game

    ns.disableLog("ALL");
    ns.ui.openTail();

    // Get root on joesguns
    if (!ns.hasRootAccess(TARGET)) {
        ns.nuke(TARGET);
    }

    const startLevel = ns.getHackingLevel();
    const startTime = Date.now();
    let operations = 0;

    ns.print(`[${AGENT}] ════════════════════════════════════`);
    ns.print(`[${AGENT}] XP BOOST MODE - Level up FAST!`);
    ns.print(`[${AGENT}] Target: ${TARGET} (best XP server)`);
    ns.print(`[${AGENT}] Starting Level: ${startLevel}`);
    ns.print(`[${AGENT}] ════════════════════════════════════`);

    while (true) {
        const currentLevel = ns.getHackingLevel();
        const levelsGained = currentLevel - startLevel;
        const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
        const rate = elapsed > 0 ? levelsGained / elapsed : 0;

        const freeRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - 0.1;
        const weakenRam = ns.getScriptRam("weaken.js");
        const threads = Math.floor(freeRam / weakenRam);

        ns.clearLog();
        ns.print(`[${AGENT}] ════════════════════════════════════`);
        ns.print(`[${AGENT}] 🧠 HACK LEVEL: ${currentLevel} (+${levelsGained})`);
        ns.print(`[${AGENT}] 📈 Rate: ${rate.toFixed(2)} levels/min`);
        ns.print(`[${AGENT}] ⏱️  Runtime: ${elapsed.toFixed(1)} min`);
        ns.print(`[${AGENT}] 🔄 Operations: ${operations}`);
        ns.print(`[${AGENT}] ────────────────────────────────────`);
        ns.print(`[${AGENT}] 💾 Free RAM: ${freeRam.toFixed(1)}GB`);
        ns.print(`[${AGENT}] 🧵 Threads: ${threads}`);
        ns.print(`[${AGENT}] ════════════════════════════════════`);

        // Milestones
        if (currentLevel >= 10 && startLevel < 10) {
            ns.print(`[${AGENT}] 🎯 MILESTONE: Level 10 - joesguns unlocked!`);
        }
        if (currentLevel >= 50 && startLevel < 50) {
            ns.print(`[${AGENT}] 🎯 MILESTONE: Level 50 - Better targets!`);
        }

        if (threads > 0) {
            ns.print(`[${AGENT}] ACTION: Weakening x${threads} for XP...`);
            ns.exec("weaken.js", "home", threads, TARGET);

            // Wait for completion
            while (ns.ps("home").some(p => p.filename === "weaken.js")) {
                await ns.sleep(200);
            }
            operations++;
        } else {
            ns.print(`[${AGENT}] Waiting for RAM...`);
            await ns.sleep(1000);
        }

        await ns.sleep(50);
    }
}
