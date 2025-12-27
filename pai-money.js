/**
 * pai-money.js - Money Generation Agent
 * Agent: PAI-Money
 * RAM: ~2.5GB
 *
 * Pure money focus. Hacks the best $/sec target.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Money";

    ns.disableLog("ALL");
    ns.ui.openTail();

    const startMoney = ns.getServerMoneyAvailable("home");
    const startTime = Date.now();

    while (true) {
        const hackLevel = ns.getHackingLevel();
        const target = getBestMoneyTarget(ns, hackLevel);

        if (!ns.hasRootAccess(target.name)) {
            ns.nuke(target.name);
        }

        const sec = ns.getServerSecurityLevel(target.name);
        const minSec = ns.getServerMinSecurityLevel(target.name);
        const money = ns.getServerMoneyAvailable(target.name);
        const maxMoney = ns.getServerMaxMoney(target.name);

        const myMoney = ns.getServerMoneyAvailable("home");
        const earned = myMoney - startMoney;
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = elapsed > 0 ? earned / elapsed : 0;

        const freeRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - 0.1;

        ns.clearLog();
        ns.print(`[${AGENT}] ════════════════════════════════════`);
        ns.print(`[${AGENT}] 💰 $${ns.formatNumber(myMoney)} (+$${ns.formatNumber(earned)})`);
        ns.print(`[${AGENT}] 📈 $${ns.formatNumber(rate)}/sec | $${ns.formatNumber(rate * 3600)}/hr`);
        ns.print(`[${AGENT}] ────────────────────────────────────`);
        ns.print(`[${AGENT}] 🎯 Target: ${target.name}`);
        ns.print(`[${AGENT}] 💵 ${ns.formatNumber(money)}/${ns.formatNumber(maxMoney)}`);
        ns.print(`[${AGENT}] 🔒 Sec: ${sec.toFixed(1)}/${minSec}`);
        ns.print(`[${AGENT}] ════════════════════════════════════`);

        let script, threads;

        if (sec > minSec + 5) {
            script = "weaken.js";
            threads = Math.floor(freeRam / ns.getScriptRam("weaken.js"));
            ns.print(`[${AGENT}] Weakening x${threads}...`);
        } else if (money < maxMoney * 0.75) {
            script = "grow.js";
            threads = Math.floor(freeRam / ns.getScriptRam("grow.js"));
            ns.print(`[${AGENT}] Growing x${threads}...`);
        } else {
            script = "hack.js";
            threads = Math.floor(freeRam / ns.getScriptRam("hack.js"));
            ns.print(`[${AGENT}] HACKING x${threads}! 💰`);
        }

        if (threads > 0) {
            ns.exec(script, "home", threads, target.name);
            while (ns.ps("home").some(p => p.filename === script)) {
                await ns.sleep(200);
            }
        }

        await ns.sleep(50);
    }
}

function getBestMoneyTarget(ns, hackLevel) {
    const targets = [
        { name: "n00dles", reqHack: 1 },
        { name: "foodnstuff", reqHack: 1 },
        { name: "sigma-cosmetics", reqHack: 5 },
        { name: "joesguns", reqHack: 10 },
        { name: "hong-fang-tea", reqHack: 30 },
        { name: "harakiri-sushi", reqHack: 40 },
        { name: "iron-gym", reqHack: 100 },
        { name: "phantasy", reqHack: 100 },
        { name: "max-hardware", reqHack: 80 },
        { name: "omega-net", reqHack: 200 },
    ];

    let best = null;
    let bestScore = 0;

    for (const t of targets) {
        if (t.reqHack > hackLevel) continue;
        if (!ns.serverExists(t.name)) continue;

        const maxMoney = ns.getServerMaxMoney(t.name);
        const minSec = ns.getServerMinSecurityLevel(t.name);
        const score = maxMoney / (minSec + 1);

        if (score > bestScore) {
            bestScore = score;
            best = t;
        }
    }

    return best || { name: "n00dles" };
}
