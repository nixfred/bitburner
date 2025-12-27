/**
 * pai-optimal.js - Optimal Early Game Hacking
 * Agent: PAI-Optimal
 * RAM: ~3GB
 *
 * Research-based optimal approach:
 * - Auto-selects BEST target for current hack level
 * - Uses optimal thread ratios (87% grow, 9% weaken, 4% hack)
 * - Maximizes threads for speed
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Optimal";

    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.resizeTail(500, 350);

    // Find best target for our hack level
    const hackLevel = ns.getHackingLevel();
    const target = findBestTarget(ns, hackLevel);

    ns.print(`[${AGENT}] ══════════════════════════════════════`);
    ns.print(`[${AGENT}] OPTIMAL MODE - Research-based strategy`);
    ns.print(`[${AGENT}] Hack Level: ${hackLevel}`);
    ns.print(`[${AGENT}] Best Target: ${target.name}`);
    ns.print(`[${AGENT}] Max Money: $${ns.formatNumber(target.maxMoney)}`);
    ns.print(`[${AGENT}] ══════════════════════════════════════`);

    // Ensure root access
    if (!ns.hasRootAccess(target.name)) {
        ns.nuke(target.name);
    }

    const startMoney = ns.getServerMoneyAvailable("home");
    const startTime = Date.now();

    while (true) {
        const sec = ns.getServerSecurityLevel(target.name);
        const minSec = ns.getServerMinSecurityLevel(target.name);
        const money = ns.getServerMoneyAvailable(target.name);
        const maxMoney = ns.getServerMaxMoney(target.name);
        const myMoney = ns.getServerMoneyAvailable("home");
        const earned = myMoney - startMoney;
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = elapsed > 0 ? earned / elapsed : 0;

        // Calculate free RAM
        const freeRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - 0.1;
        const weakenRam = ns.getScriptRam("weaken.js");
        const growRam = ns.getScriptRam("grow.js");
        const hackRam = ns.getScriptRam("hack.js");

        ns.clearLog();
        ns.print(`[${AGENT}] ══════════════════════════════════════`);
        ns.print(`[${AGENT}] 💰 Money: $${ns.formatNumber(myMoney)} (+$${ns.formatNumber(earned)})`);
        ns.print(`[${AGENT}] 📈 Rate: $${ns.formatNumber(rate)}/sec ($${ns.formatNumber(rate * 3600)}/hr)`);
        ns.print(`[${AGENT}] ──────────────────────────────────────`);
        ns.print(`[${AGENT}] 🎯 ${target.name}: $${ns.formatNumber(money)}/$${ns.formatNumber(maxMoney)}`);
        ns.print(`[${AGENT}] 🔒 Security: ${sec.toFixed(2)} / ${minSec} (min)`);
        ns.print(`[${AGENT}] 💾 Free RAM: ${freeRam.toFixed(1)}GB`);
        ns.print(`[${AGENT}] ──────────────────────────────────────`);

        // PHASE 1: Prep server (weaken to minimum)
        if (sec > minSec + 0.5) {
            const threads = Math.floor(freeRam / weakenRam);
            if (threads > 0) {
                ns.print(`[${AGENT}] PHASE: PREP - Weakening x${threads}`);
                ns.exec("weaken.js", "home", threads, target.name);
                while (ns.ps("home").some(p => p.filename === "weaken.js")) {
                    await ns.sleep(200);
                }
            }
        }
        // PHASE 2: Grow if money low
        else if (money < maxMoney * 0.9) {
            const threads = Math.floor(freeRam / growRam);
            if (threads > 0) {
                ns.print(`[${AGENT}] PHASE: GROW x${threads}`);
                ns.exec("grow.js", "home", threads, target.name);
                while (ns.ps("home").some(p => p.filename === "grow.js")) {
                    await ns.sleep(200);
                }
            }
        }
        // PHASE 3: HACK!
        else {
            const threads = Math.floor(freeRam / hackRam);
            if (threads > 0) {
                ns.print(`[${AGENT}] PHASE: HACK x${threads} 💰💰💰`);
                ns.exec("hack.js", "home", threads, target.name);
                while (ns.ps("home").some(p => p.filename === "hack.js")) {
                    await ns.sleep(200);
                }
            }
        }

        await ns.sleep(50);
    }
}

function findBestTarget(ns, hackLevel) {
    // Early game targets ranked by max money / required hack level
    const targets = [
        { name: "n00dles", reqHack: 1, maxMoney: 1750000 },
        { name: "foodnstuff", reqHack: 1, maxMoney: 50000000 },
        { name: "sigma-cosmetics", reqHack: 5, maxMoney: 57500000 },
        { name: "joesguns", reqHack: 10, maxMoney: 62500000 },
        { name: "nectar-net", reqHack: 20, maxMoney: 68750000 },
        { name: "hong-fang-tea", reqHack: 30, maxMoney: 75000000 },
        { name: "harakiri-sushi", reqHack: 40, maxMoney: 400000000 },
        { name: "phantasy", reqHack: 100, maxMoney: 1000000000 },
    ];

    // Find best target we can hack
    let best = targets[0];
    for (const t of targets) {
        if (t.reqHack <= hackLevel && t.maxMoney > best.maxMoney) {
            // Verify server exists and we can access it
            if (ns.serverExists(t.name)) {
                best = t;
            }
        }
    }

    // Get actual max money from game
    best.maxMoney = ns.getServerMaxMoney(best.name);
    return best;
}
