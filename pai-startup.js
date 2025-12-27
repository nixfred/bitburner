/**
 * pai-startup.js - PAI System Launcher
 * Agent: PAI-Launcher
 *
 * Run this script to start the complete PAI automation suite.
 * It launches all subsystems in the correct order.
 *
 * Usage: run pai-startup.js
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Launcher";

    ns.tprint("═".repeat(60));
    ns.tprint(`[${AGENT}] PURPOSE: Initialize PAI Automation Suite`);
    ns.tprint(`[${AGENT}] GOAL: Reach $1 TRILLION`);
    ns.tprint("═".repeat(60));

    // Kill any existing PAI processes
    ns.tprint(`[${AGENT}] ACTION: Cleaning up existing processes...`);
    const scripts = ["pai-master.js", "stock-trader.js", "auto-nuker.js"];
    for (const script of scripts) {
        if (ns.isRunning(script, "home")) {
            ns.kill(script, "home");
            ns.tprint(`[${AGENT}] Killed existing ${script}`);
        }
    }

    await ns.sleep(1000);

    // Verify required scripts exist
    ns.tprint(`[${AGENT}] ACTION: Verifying required scripts...`);
    const required = ["hack.js", "grow.js", "weaken.js", "pai-master.js"];
    const missing = required.filter(s => !ns.fileExists(s, "home"));

    if (missing.length > 0) {
        ns.tprint(`[${AGENT}] ERROR: Missing scripts: ${missing.join(", ")}`);
        ns.tprint(`[${AGENT}] Please ensure all PAI scripts are synced to the game.`);
        return;
    }
    ns.tprint(`[${AGENT}] RESULT: All ${required.length} core scripts verified`);

    // Get system info
    const homeRam = ns.getServerMaxRam("home");
    const currentMoney = ns.getServerMoneyAvailable("home");
    const hackLevel = ns.getHackingLevel();

    ns.tprint("");
    ns.tprint(`[${AGENT}] ┌─ SYSTEM STATUS ─────────────────────────────────┐`);
    ns.tprint(`[${AGENT}] │ Home RAM:     ${homeRam} GB`.padEnd(55) + "│");
    ns.tprint(`[${AGENT}] │ Money:        $${ns.formatNumber(currentMoney)}`.padEnd(55) + "│");
    ns.tprint(`[${AGENT}] │ Hack Level:   ${hackLevel}`.padEnd(55) + "│");
    ns.tprint(`[${AGENT}] └─────────────────────────────────────────────────┘`);
    ns.tprint("");

    // Launch PAI Master Controller
    ns.tprint(`[${AGENT}] ACTION: Launching PAI Master Controller...`);
    const masterRam = ns.getScriptRam("pai-master.js");
    if (masterRam > homeRam - 10) {
        ns.tprint(`[${AGENT}] ERROR: Not enough RAM for pai-master.js (needs ${masterRam}GB)`);
        return;
    }

    const masterPid = ns.exec("pai-master.js", "home");
    if (masterPid > 0) {
        ns.tprint(`[${AGENT}] RESULT: pai-master.js launched (PID: ${masterPid})`);
    } else {
        ns.tprint(`[${AGENT}] ERROR: Failed to launch pai-master.js`);
        return;
    }

    await ns.sleep(500);

    // Try to launch stock trader if we have TIX API
    ns.tprint(`[${AGENT}] ACTION: Checking stock market access...`);
    try {
        ns.stock.getSymbols();
        const traderRam = ns.getScriptRam("stock-trader.js");
        const availableRam = homeRam - ns.getServerUsedRam("home") - 10;

        if (traderRam <= availableRam) {
            const traderPid = ns.exec("stock-trader.js", "home");
            if (traderPid > 0) {
                ns.tprint(`[${AGENT}] RESULT: stock-trader.js launched (PID: ${traderPid})`);
            }
        } else {
            ns.tprint(`[${AGENT}] INFO: Not enough RAM for stock trader`);
        }
    } catch (e) {
        ns.tprint(`[${AGENT}] INFO: No TIX API access yet - stock trader skipped`);
        ns.tprint(`[${AGENT}] TIP: Purchase TIX API when you have $200m+`);
    }

    ns.tprint("");
    ns.tprint("═".repeat(60));
    ns.tprint(`[${AGENT}] PAI AUTOMATION SUITE INITIALIZED`);
    ns.tprint("═".repeat(60));
    ns.tprint(`[${AGENT}] Monitor progress in the pai-master.js log window`);
    ns.tprint(`[${AGENT}] Target: $1,000,000,000,000 ($1 TRILLION)`);
    ns.tprint("═".repeat(60));
}
