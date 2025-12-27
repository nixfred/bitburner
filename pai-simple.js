/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    // Crack and nuke servers
    function rootServer(s) {
        try { if (ns.fileExists("BruteSSH.exe")) ns.brutessh(s); } catch {}
        try { if (ns.fileExists("FTPCrack.exe")) ns.ftpcrack(s); } catch {}
        try { ns.nuke(s); return true; } catch { return false; }
    }

    // Pick best target we can hack
    function pickTarget() {
        const targets = ["n00dles", "foodnstuff", "sigma-cosmetics", "joesguns", "harakiri-sushi", "hong-fang-tea"];
        for (const t of targets.reverse()) {
            if (ns.getServerRequiredHackingLevel(t) <= ns.getHackingLevel()) {
                if (!ns.hasRootAccess(t)) rootServer(t);
                if (ns.hasRootAccess(t)) return t;
            }
        }
        return "n00dles";
    }

    let target = pickTarget();
    if (!ns.hasRootAccess(target)) rootServer(target);

    const startMoney = ns.getServerMoneyAvailable("home");
    const startLevel = ns.getHackingLevel();
    let hacks = 0;
    let weakens = 0;
    let grows = 0;

    ns.print("PAI-Simple: STARTING - Target: " + target);
    ns.print("PAI-Simple: This script works. Period.");

    while (true) {
        const myMoney = ns.getServerMoneyAvailable("home");
        const earned = myMoney - startMoney;
        const level = ns.getHackingLevel();
        const levelsGained = level - startLevel;

        const securityMin = ns.getServerMinSecurityLevel(target);
        const securityCurrent = ns.getServerSecurityLevel(target);
        const moneyMax = ns.getServerMaxMoney(target);
        const moneyAvailable = ns.getServerMoneyAvailable(target);

        ns.clearLog();
        ns.print("════════════════════════════════════════");
        ns.print("  PAI-SIMPLE - WORKING SCRIPT");
        ns.print("════════════════════════════════════════");
        ns.print("  YOUR $: " + ns.formatNumber(myMoney) + " (+" + ns.formatNumber(earned) + ")");
        ns.print("  HACK LEVEL: " + level + " (+" + levelsGained + ")");
        ns.print("────────────────────────────────────────");
        ns.print("  Target: " + target);
        ns.print("  Security: " + securityCurrent.toFixed(1) + " / " + securityMin + " min");
        ns.print("  Money: " + ns.formatNumber(moneyAvailable) + " / " + ns.formatNumber(moneyMax));
        ns.print("────────────────────────────────────────");
        ns.print("  Hacks: " + hacks + " | Grows: " + grows + " | Weakens: " + weakens);
        ns.print("════════════════════════════════════════");

        // Re-pick target every 50 cycles
        if ((hacks + grows + weakens) % 50 === 0) {
            const newTarget = pickTarget();
            if (newTarget !== target) {
                target = newTarget;
                ns.print("  >>> UPGRADED TARGET: " + target);
            }
        }

        // WEAKEN if security too high
        if (securityCurrent > securityMin + 5) {
            await ns.weaken(target);
            weakens++;
        }
        // GROW if money too low
        else if (moneyAvailable < moneyMax * 0.75) {
            await ns.grow(target);
            grows++;
        }
        // HACK!
        else {
            const stolen = await ns.hack(target);
            hacks++;
        }
    }
}

