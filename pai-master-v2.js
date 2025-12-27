/**
 * pai-master-v2.js - Master Orchestrator V2
 * Agent: PAI-Master
 * RAM: ~5GB
 *
 * Coordinates all PAI agents based on game phase.
 * Automatically adjusts strategy as you progress.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Master";
    const GOAL = 10_000_000_000_000; // $10T

    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.resizeTail(600, 500);

    const startTime = Date.now();
    const startMoney = ns.getServerMoneyAvailable("home");
    const startLevel = ns.getHackingLevel();

    ns.print(`[${AGENT}] ══════════════════════════════════════════`);
    ns.print(`[${AGENT}] PAI MASTER ORCHESTRATOR V2`);
    ns.print(`[${AGENT}] GOAL: $10 TRILLION`);
    ns.print(`[${AGENT}] ══════════════════════════════════════════`);

    while (true) {
        const money = ns.getServerMoneyAvailable("home");
        const hackLevel = ns.getHackingLevel();
        const homeRam = ns.getServerMaxRam("home");
        const freeRam = homeRam - ns.getServerUsedRam("home");

        // Determine current phase
        const phase = getPhase(hackLevel, money);
        const elapsed = (Date.now() - startTime) / 1000;
        const earned = money - startMoney;
        const rate = elapsed > 0 ? earned / elapsed : 0;
        const progress = (money / GOAL) * 100;

        ns.clearLog();
        ns.print(`[${AGENT}] ══════════════════════════════════════════`);
        ns.print(`[${AGENT}] 📊 PHASE: ${phase.name}`);
        ns.print(`[${AGENT}] ──────────────────────────────────────────`);
        ns.print(`[${AGENT}] 💰 Money: $${ns.formatNumber(money)}`);
        ns.print(`[${AGENT}] 📈 Rate: $${ns.formatNumber(rate * 3600)}/hr`);
        ns.print(`[${AGENT}] 🎯 Progress: ${progress.toFixed(6)}%`);
        ns.print(`[${AGENT}] 🧠 Hack Level: ${hackLevel} (+${hackLevel - startLevel})`);
        ns.print(`[${AGENT}] 💾 RAM: ${freeRam.toFixed(1)}/${homeRam}GB free`);
        ns.print(`[${AGENT}] ──────────────────────────────────────────`);
        ns.print(`[${AGENT}] 🎮 STRATEGY: ${phase.strategy}`);
        ns.print(`[${AGENT}] 📋 NEXT GOAL: ${phase.nextGoal}`);
        ns.print(`[${AGENT}] ──────────────────────────────────────────`);

        // Execute phase strategy
        await executePhase(ns, phase, freeRam);

        // Check victory
        if (money >= GOAL) {
            ns.print(`[${AGENT}] 🎉🎉🎉 VICTORY! $10 TRILLION! 🎉🎉🎉`);
            ns.tprint(`SUCCESS: PAI reached $10 TRILLION!`);
            return;
        }

        ns.print(`[${AGENT}] ══════════════════════════════════════════`);

        await ns.sleep(5000);
    }
}

function getPhase(hackLevel, money) {
    if (hackLevel < 10) {
        return {
            name: "1️⃣ XP RUSH",
            strategy: "Weaken joesguns for XP",
            nextGoal: "Reach hack level 10",
            script: "pai-xp-boost.js"
        };
    } else if (hackLevel < 50) {
        return {
            name: "2️⃣ XP + MONEY",
            strategy: "Hack joesguns for XP & money",
            nextGoal: "Reach hack level 50",
            script: "pai-money.js"
        };
    } else if (money < 1_000_000) {
        return {
            name: "3️⃣ MONEY RUSH",
            strategy: "Hack best target for money",
            nextGoal: "Reach $1M for upgrades",
            script: "pai-money.js"
        };
    } else if (money < 100_000_000) {
        return {
            name: "4️⃣ INFRASTRUCTURE",
            strategy: "Buy servers & programs",
            nextGoal: "Reach $100M",
            script: "pai-money.js"
        };
    } else if (money < 10_000_000_000) {
        return {
            name: "5️⃣ SCALING",
            strategy: "Max servers, batch hacking",
            nextGoal: "Reach $10B",
            script: "pai-money.js"
        };
    } else {
        return {
            name: "6️⃣ ENDGAME",
            strategy: "Stocks, Corp, final push",
            nextGoal: "Reach $10T",
            script: "pai-money.js"
        };
    }
}

async function executePhase(ns, phase, freeRam) {
    const running = ns.ps("home").map(p => p.filename);

    // Ensure phase script is running
    if (!running.includes(phase.script)) {
        if (ns.fileExists(phase.script, "home")) {
            const scriptRam = ns.getScriptRam(phase.script);
            if (freeRam >= scriptRam) {
                ns.print(`[PAI-Master] Starting ${phase.script}...`);
                ns.exec(phase.script, "home", 1);
            } else {
                ns.print(`[PAI-Master] Not enough RAM for ${phase.script}`);
            }
        }
    } else {
        ns.print(`[PAI-Master] ✓ ${phase.script} running`);
    }

    // Show running scripts
    const paiScripts = running.filter(s => s.startsWith("pai-"));
    ns.print(`[PAI-Master] Active: ${paiScripts.join(", ") || "none"}`);
}
