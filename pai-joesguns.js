/**
 * pai-joesguns.js - Optimized Early Game (Target: joesguns)
 * Agent: PAI-JoesGuns
 * RAM: ~2.6GB
 *
 * Based on research: joesguns is the BEST early target for XP and money.
 * - Best XP rate in the entire game
 * - Good money for early game
 * - Weaken first (starts at 5-10 security)
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-JoesGuns";
    const TARGET = "joesguns";

    ns.disableLog("ALL");
    ns.ui.openTail();

    // First, get root on joesguns (requires 0 ports)
    if (!ns.hasRootAccess(TARGET)) {
        ns.nuke(TARGET);
        ns.print(`[${AGENT}] Nuked ${TARGET}`);
    }

    let totalStolen = 0;
    let totalXP = 0;
    let hacks = 0;
    let weakens = 0;
    let grows = 0;
    const startMoney = ns.getServerMoneyAvailable("home");
    const startHackLevel = ns.getHackingLevel();

    ns.print(`[${AGENT}] PURPOSE: Farm joesguns for XP + money`);
    ns.print(`[${AGENT}] WHY: Best XP rate in the game!`);
    ns.print("");

    while (true) {
        const sec = ns.getServerSecurityLevel(TARGET);
        const minSec = ns.getServerMinSecurityLevel(TARGET);
        const money = ns.getServerMoneyAvailable(TARGET);
        const maxMoney = ns.getServerMaxMoney(TARGET);

        ns.clearLog();
        const current = ns.getServerMoneyAvailable("home");
        const earned = current - startMoney;
        const hackLevel = ns.getHackingLevel();
        const levelsGained = hackLevel - startHackLevel;

        ns.print("═".repeat(55));
        ns.print(`[${AGENT}] JOESGUNS FARM - Best XP in game!`);
        ns.print("═".repeat(55));
        ns.print(`  Your Money:   $${ns.formatNumber(current)}`);
        ns.print(`  Earned:       $${ns.formatNumber(earned)}`);
        ns.print(`  Hack Level:   ${hackLevel} (+${levelsGained})`);
        ns.print("─".repeat(55));
        ns.print(`  Target:       ${TARGET}`);
        ns.print(`  Security:     ${sec.toFixed(1)} / ${minSec} (min)`);
        ns.print(`  Money:        $${ns.formatNumber(money)} / $${ns.formatNumber(maxMoney)}`);
        ns.print("─".repeat(55));
        ns.print(`  Hacks: ${hacks} | Weakens: ${weakens} | Grows: ${grows}`);
        ns.print("═".repeat(55));

        // Priority 1: Weaken if security is above minimum
        if (sec > minSec + 0.5) {
            ns.print(`[${AGENT}] ACTION: Weakening security...`);
            await ns.weaken(TARGET);
            weakens++;
        }
        // Priority 2: Grow if money is low
        else if (money < maxMoney * 0.5) {
            ns.print(`[${AGENT}] ACTION: Growing money...`);
            await ns.grow(TARGET);
            grows++;
        }
        // Priority 3: Hack!
        else {
            ns.print(`[${AGENT}] ACTION: Hacking! 💰`);
            const stolen = await ns.hack(TARGET);
            totalStolen += stolen;
            hacks++;
            if (stolen > 0) {
                ns.print(`[${AGENT}] RESULT: Stole $${ns.formatNumber(stolen)}`);
            }
        }

        // Tips based on progress
        if (current >= 200000 && current < 250000) {
            ns.print(`[${AGENT}] 💡 TIP: Buy RAM upgrade at Alpha Enterprises!`);
        }
        if (hackLevel >= 10 && hackLevel < 15) {
            ns.print(`[${AGENT}] 💡 TIP: Consider joining CyberSec faction!`);
        }
    }
}

