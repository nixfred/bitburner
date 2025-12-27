/**
 * pai-xp-boost.js - MAXIMUM XP GAIN
 * Agent: PAI-XPBoost
 * RAM: ~2.5GB
 *
 * Weaken gives the MOST XP per operation.
 * Targets n00dles first (level 1), then joesguns (level 10).
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-XPBoost";

    ns.disableLog("ALL");
    ns.ui.openTail();

    const startLevel = ns.getHackingLevel();
    const startTime = Date.now();
    let operations = 0;

    ns.print(`[${AGENT}] ════════════════════════════════════`);
    ns.print(`[${AGENT}] XP BOOST MODE - Level up FAST!`);
    ns.print(`[${AGENT}] Starting Level: ${startLevel}`);
    ns.print(`[${AGENT}] ════════════════════════════════════`);

    while (true) {
        const currentLevel = ns.getHackingLevel();
        const levelsGained = currentLevel - startLevel;
        const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
        const rate = elapsed > 0 ? levelsGained / elapsed : 0;

        // Pick target based on hack level
        let target;
        if (currentLevel >= 10) {
            target = "joesguns"; // Best XP, requires level 10
        } else {
            target = "n00dles"; // Available at level 1
        }

        // Get root access
        if (!ns.hasRootAccess(target)) {
            const reqLevel = ns.getServerRequiredHackingLevel(target);
            if (currentLevel >= reqLevel) {
                try {
                    ns.nuke(target);
                    ns.print(`[${AGENT}] ✅ Rooted ${target}!`);
                } catch (e) {
                    ns.print(`[${AGENT}] ❌ Can't nuke ${target}: ${e}`);
                }
            } else {
                ns.print(`[${AGENT}] ⏳ Need level ${reqLevel} for ${target}`);
            }
        }

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
        ns.print(`[${AGENT}] 🎯 Target: ${target}`);
        ns.print(`[${AGENT}] 💾 Free RAM: ${freeRam.toFixed(1)}GB`);
        ns.print(`[${AGENT}] 🧵 Threads: ${threads}`);
        ns.print(`[${AGENT}] ════════════════════════════════════`);

        if (currentLevel >= 10 && startLevel < 10) {
            ns.print(`[${AGENT}] 🎯 MILESTONE: Level 10 - joesguns unlocked!`);
        }

        if (ns.hasRootAccess(target) && threads > 0) {
            ns.print(`[${AGENT}] ACTION: Weakening ${target} x${threads} for XP...`);
            ns.exec("weaken.js", "home", threads, target);

            // Wait for completion
            while (ns.ps("home").some(p => p.filename === "weaken.js")) {
                await ns.sleep(200);
            }
            operations++;
        } else if (!ns.hasRootAccess(target)) {
            ns.print(`[${AGENT}] ⏳ Waiting for root access to ${target}...`);
            await ns.sleep(1000);
        } else {
            ns.print(`[${AGENT}] Waiting for RAM...`);
            await ns.sleep(1000);
        }

        await ns.sleep(50);
    }
}
