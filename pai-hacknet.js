/**
 * pai-hacknet.js - Hacknet Management Agent
 * Agent: PAI-Hacknet
 * RAM: ~2GB
 *
 * Manages hacknet nodes for passive income.
 * Buys and upgrades nodes automatically.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Hacknet";
    const MAX_NODES = 12; // Cap for early game
    const BUDGET_PERCENT = 0.1; // Spend 10% of money on hacknet

    ns.disableLog("ALL");
    ns.ui.openTail();

    ns.print(`[${AGENT}] Hacknet Management Agent`);

    while (true) {
        const money = ns.getServerMoneyAvailable("home");
        const budget = money * BUDGET_PERCENT;
        const numNodes = ns.hacknet.numNodes();

        let production = 0;
        for (let i = 0; i < numNodes; i++) {
            production += ns.hacknet.getNodeStats(i).production;
        }

        ns.clearLog();
        ns.print(`[${AGENT}] ════════════════════════════════════`);
        ns.print(`[${AGENT}] ⚡ HACKNET STATUS`);
        ns.print(`[${AGENT}] ────────────────────────────────────`);
        ns.print(`[${AGENT}] Nodes: ${numNodes}/${MAX_NODES}`);
        ns.print(`[${AGENT}] Production: $${ns.formatNumber(production)}/sec`);
        ns.print(`[${AGENT}] Budget: $${ns.formatNumber(budget)}`);
        ns.print(`[${AGENT}] ────────────────────────────────────`);

        // Buy new node if affordable
        if (numNodes < MAX_NODES) {
            const cost = ns.hacknet.getPurchaseNodeCost();
            if (cost <= budget) {
                const idx = ns.hacknet.purchaseNode();
                if (idx !== -1) {
                    ns.print(`[${AGENT}] ✅ Bought node ${idx}`);
                }
            }
        }

        // Upgrade existing nodes
        for (let i = 0; i < numNodes; i++) {
            const stats = ns.hacknet.getNodeStats(i);

            // Upgrade level
            const levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
            if (levelCost <= budget && stats.level < 200) {
                if (ns.hacknet.upgradeLevel(i, 1)) {
                    ns.print(`[${AGENT}] ⬆️ Node ${i} level up`);
                }
            }

            // Upgrade RAM
            const ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
            if (ramCost <= budget && stats.ram < 64) {
                if (ns.hacknet.upgradeRam(i, 1)) {
                    ns.print(`[${AGENT}] ⬆️ Node ${i} RAM up`);
                }
            }

            // Upgrade cores
            const coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
            if (coreCost <= budget && stats.cores < 16) {
                if (ns.hacknet.upgradeCore(i, 1)) {
                    ns.print(`[${AGENT}] ⬆️ Node ${i} cores up`);
                }
            }
        }

        ns.print(`[${AGENT}] ════════════════════════════════════`);
        ns.print(`[${AGENT}] Next check in 30s...`);

        await ns.sleep(30000);
    }
}
