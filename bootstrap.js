/**
 * bootstrap.js - PAI Quick Restart System
 * Agent: PAI-Bootstrap
 * RAM: ~3GB
 *
 * Run this after installing augmentations or starting fresh.
 * Automatically detects your resources and launches appropriate scripts.
 *
 * Usage: run bootstrap.js
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Bootstrap";

    ns.tprint("═".repeat(60));
    ns.tprint(`[${AGENT}] PAI BOOTSTRAP SYSTEM`);
    ns.tprint("═".repeat(60));

    // Gather system info
    const ram = ns.getServerMaxRam("home");
    const money = ns.getServerMoneyAvailable("home");
    const hackLevel = ns.getHackingLevel();
    const ownedServers = ns.getPurchasedServers().length;

    ns.tprint("");
    ns.tprint(`[${AGENT}] SYSTEM SCAN:`);
    ns.tprint(`  • RAM: ${ram}GB`);
    ns.tprint(`  • Money: $${ns.formatNumber(money)}`);
    ns.tprint(`  • Hack Level: ${hackLevel}`);
    ns.tprint(`  • Owned Servers: ${ownedServers}`);
    ns.tprint("");

    // Detect available scripts
    const scripts = {
        master: ns.fileExists("pai-master.js", "home"),
        early: ns.fileExists("pai-early.js", "home"),
        startup: ns.fileExists("pai-startup.js", "home"),
        stocks: ns.fileExists("stock-trader.js", "home"),
        hack: ns.fileExists("hack.js", "home"),
        grow: ns.fileExists("grow.js", "home"),
        weaken: ns.fileExists("weaken.js", "home"),
    };

    const missingCore = !scripts.hack || !scripts.grow || !scripts.weaken;
    if (missingCore) {
        ns.tprint(`[${AGENT}] ERROR: Missing core scripts (hack/grow/weaken)`);
        ns.tprint(`[${AGENT}] Run 'npx bitburner-filesync' and reconnect Remote API`);
        return;
    }

    // Kill existing PAI processes
    const paiScripts = ["pai-master.js", "pai-early.js", "pai-startup.js", "stock-trader.js"];
    for (const script of paiScripts) {
        if (ns.isRunning(script, "home")) {
            ns.kill(script, "home");
        }
    }
    await ns.sleep(500);

    // Decide which script to run based on resources
    let selectedScript = null;
    let reason = "";

    const masterRam = scripts.master ? ns.getScriptRam("pai-master.js") : 999;
    const earlyRam = scripts.early ? ns.getScriptRam("pai-early.js") : 999;
    const startupRam = scripts.startup ? ns.getScriptRam("pai-startup.js") : 999;

    if (ram >= 64 && scripts.startup) {
        selectedScript = "pai-startup.js";
        reason = "RAM >= 64GB, using full automation";
    } else if (ram >= 32 && scripts.master && ram >= masterRam + 10) {
        selectedScript = "pai-master.js";
        reason = "RAM >= 32GB, using master controller";
    } else if (ram >= 8 && scripts.early && ram >= earlyRam + 2) {
        selectedScript = "pai-early.js";
        reason = "Limited RAM, using early game script";
    } else {
        ns.tprint(`[${AGENT}] ERROR: Not enough RAM for any PAI script`);
        ns.tprint(`[${AGENT}] Minimum required: 8GB, you have: ${ram}GB`);
        return;
    }

    ns.tprint(`[${AGENT}] DECISION: ${reason}`);
    ns.tprint(`[${AGENT}] LAUNCHING: ${selectedScript}`);
    ns.tprint("");

    // Launch the selected script
    const pid = ns.exec(selectedScript, "home");
    if (pid > 0) {
        ns.tprint(`[${AGENT}] SUCCESS: ${selectedScript} running (PID: ${pid})`);
    } else {
        ns.tprint(`[${AGENT}] ERROR: Failed to launch ${selectedScript}`);
        return;
    }

    // Check for stock trading capability
    if (ram >= 40 && scripts.stocks) {
        try {
            ns.stock.getSymbols();
            await ns.sleep(1000);
            const stockPid = ns.exec("stock-trader.js", "home");
            if (stockPid > 0) {
                ns.tprint(`[${AGENT}] BONUS: Stock trader launched (PID: ${stockPid})`);
            }
        } catch {
            ns.tprint(`[${AGENT}] INFO: TIX API not available, skipping stocks`);
        }
    }

    // Provide next steps
    ns.tprint("");
    ns.tprint("═".repeat(60));
    ns.tprint(`[${AGENT}] BOOTSTRAP COMPLETE`);
    ns.tprint("═".repeat(60));
    ns.tprint("");
    ns.tprint(`[${AGENT}] NEXT STEPS:`);

    if (ram < 32) {
        ns.tprint(`  1. Earn money with current script`);
        ns.tprint(`  2. Buy RAM upgrade at Alpha Enterprises`);
        ns.tprint(`  3. Run 'run bootstrap.js' again for better script`);
    } else if (ram < 64) {
        ns.tprint(`  1. Script is running, monitor progress`);
        ns.tprint(`  2. Consider more RAM for parallel operations`);
    } else {
        ns.tprint(`  1. Full automation active`);
        ns.tprint(`  2. Monitor progress toward $1 TRILLION`);
    }

    ns.tprint("");
    ns.tprint(`[${AGENT}] Monitor: Check the script's log window (click on it)`);
}
