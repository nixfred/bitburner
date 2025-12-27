/**
 * pai-blitz.js - MAXIMUM THREADS Early Game
 * Agent: PAI-Blitz
 * RAM: ~2GB base
 *
 * Deploys ALL available RAM as worker threads.
 * This is how you actually make money fast.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Blitz";
    const TARGET = "n00dles"; // Easiest target, hack level 1

    ns.disableLog("ALL");
    ns.ui.openTail();

    // Ensure root access
    if (!ns.hasRootAccess(TARGET)) {
        ns.nuke(TARGET);
    }

    ns.print(`[${AGENT}] BLITZ MODE - Maximum threads!`);
    ns.print(`[${AGENT}] Target: ${TARGET}`);

    // Calculate available RAM
    const homeRam = ns.getServerMaxRam("home");
    const usedRam = ns.getServerUsedRam("home");
    const availableRam = homeRam - usedRam - 0.1; // Small buffer

    // Script RAM costs
    const hackRam = ns.getScriptRam("hack.js");
    const growRam = ns.getScriptRam("grow.js");
    const weakenRam = ns.getScriptRam("weaken.js");

    ns.print(`[${AGENT}] Available RAM: ${availableRam.toFixed(1)}GB`);
    ns.print(`[${AGENT}] Script costs: H=${hackRam} G=${growRam} W=${weakenRam}`);

    // Deploy workers based on server state
    while (true) {
        const sec = ns.getServerSecurityLevel(TARGET);
        const minSec = ns.getServerMinSecurityLevel(TARGET);
        const money = ns.getServerMoneyAvailable(TARGET);
        const maxMoney = ns.getServerMaxMoney(TARGET);
        const freeRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");

        ns.clearLog();
        ns.print(`[${AGENT}] ══════════════════════════════════`);
        ns.print(`[${AGENT}] 💰 Your money: $${ns.formatNumber(ns.getServerMoneyAvailable("home"))}`);
        ns.print(`[${AGENT}] 🎯 ${TARGET}: $${ns.formatNumber(money)}/$${ns.formatNumber(maxMoney)}`);
        ns.print(`[${AGENT}] 🔒 Security: ${sec.toFixed(1)}/${minSec}`);
        ns.print(`[${AGENT}] 💾 Free RAM: ${freeRam.toFixed(1)}GB`);
        ns.print(`[${AGENT}] ──────────────────────────────────`);

        // Determine action and thread count
        let script, scriptRam, action;

        if (sec > minSec + 5) {
            script = "weaken.js";
            scriptRam = weakenRam;
            action = "WEAKEN";
        } else if (money < maxMoney * 0.75) {
            script = "grow.js";
            scriptRam = growRam;
            action = "GROW";
        } else {
            script = "hack.js";
            scriptRam = hackRam;
            action = "HACK";
        }

        const threads = Math.floor((freeRam - 0.1) / scriptRam);

        if (threads > 0) {
            ns.print(`[${AGENT}] ACTION: ${action} x${threads} threads`);
            const pid = ns.exec(script, "home", threads, TARGET);
            if (pid > 0) {
                ns.print(`[${AGENT}] Launched ${script} with ${threads} threads`);
            }
        } else {
            ns.print(`[${AGENT}] Waiting for RAM...`);
        }

        // Wait for scripts to finish
        while (ns.ps("home").some(p => p.filename === script)) {
            await ns.sleep(500);
        }

        await ns.sleep(100);
    }
}
