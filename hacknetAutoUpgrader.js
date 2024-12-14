/** @param {NS} ns **/
export async function main(ns) {
    const budgetPercent = ns.args[0]; // e.g., 10 for 10% of your current money
    if (!budgetPercent || budgetPercent <= 0 || budgetPercent > 100) {
        ns.tprint("ERROR: Please provide a valid percentage (1–100) as an argument.");
        return;
    }

    const ROI_THRESHOLD = 0.0149; // 1.49%
    const playerMoney = ns.getServerMoneyAvailable("home");
    const budget = playerMoney * (budgetPercent / 100);
    const hacknet = ns.hacknet;
    const nodeCount = hacknet.numNodes();

    if (nodeCount === 0) {
        ns.tprint("No Hacknet nodes exist. Consider buying your first Hacknet node.");
        if (hacknet.getPurchaseNodeCost() <= budget) {
            ns.tprint(`Recommended: Purchase your first Hacknet node for ${ns.nFormat(hacknet.getPurchaseNodeCost(), "$0.00a")}.`);
        }
        return;
    }

    // Tracking totals
    let totalSpent = 0;
    let totalROI = 0;
    let upgradeCount = 0;
    const upgradeTypes = { Level: 0, RAM: 0, Core: 0, NewNode: 0 };

    while (true) {
        let bestUpgrade = null;
        let bestROI = 0;
        const allUpgrades = []; // Collect data for logging all potential upgrades

        // Check upgrades for each existing node
        for (let i = 0; i < nodeCount; i++) {
            const stats = hacknet.getNodeStats(i);

            const levelCost = hacknet.getLevelUpgradeCost(i, 1);
            const ramCost = hacknet.getRamUpgradeCost(i, 1);
            const coreCost = hacknet.getCoreUpgradeCost(i, 1);

            const levelROI = (levelCost > 0 && levelCost <= budget) ? stats.production / levelCost : 0;
            const ramROI = (ramCost > 0 && ramCost <= budget) ? stats.production / ramCost : 0;
            const coreROI = (coreCost > 0 && coreCost <= budget) ? stats.production / coreCost : 0;

            // Collect all upgrades for analysis
            if (levelROI > 0) allUpgrades.push({ type: "Level", node: i, cost: levelCost, roi: levelROI });
            if (ramROI > 0) allUpgrades.push({ type: "RAM", node: i, cost: ramCost, roi: ramROI });
            if (coreROI > 0) allUpgrades.push({ type: "Core", node: i, cost: coreCost, roi: coreROI });

            // Consider upgrades that meet ROI_THRESHOLD
            if (levelROI >= ROI_THRESHOLD && levelROI > bestROI) {
                bestUpgrade = { type: "Level", node: i, cost: levelCost, roi: levelROI };
                bestROI = levelROI;
            }
            if (ramROI >= ROI_THRESHOLD && ramROI > bestROI) {
                bestUpgrade = { type: "RAM", node: i, cost: ramCost, roi: ramROI };
                bestROI = ramROI;
            }
            if (coreROI >= ROI_THRESHOLD && coreROI > bestROI) {
                bestUpgrade = { type: "Core", node: i, cost: coreCost, roi: coreROI };
                bestROI = coreROI;
            }
        }

        // Check if buying a new node meets the ROI_THRESHOLD
        const newNodeCost = hacknet.getPurchaseNodeCost();
        const baseProd = hacknet.getNodeStats(0)?.production || 1;
        const newNodeROI = (newNodeCost > 0 && newNodeCost <= budget) ? baseProd / newNodeCost : 0;
        if (newNodeROI >= ROI_THRESHOLD && newNodeROI > bestROI) {
            bestUpgrade = { type: "NewNode", cost: newNodeCost, roi: newNodeROI };
            bestROI = newNodeROI;
        }
        if (newNodeROI > 0) allUpgrades.push({ type: "NewNode", cost: newNodeCost, roi: newNodeROI });

        // Log all potential upgrades
        ns.tprint("\n=== All Potential Upgrades ===");
        allUpgrades
            .sort((a, b) => b.roi - a.roi) // Sort by ROI descending for clarity
            .forEach(upgrade => {
                const desc = upgrade.type === "NewNode"
                    ? `New Node`
                    : `Node ${upgrade.node}'s ${upgrade.type}`;
                ns.tprint(`${desc} | Cost: ${ns.nFormat(upgrade.cost, "$0.00a")} | ROI: ${(upgrade.roi * 100).toFixed(2)}%`);
            });

        // Exit if no valid upgrades are available
        if (!bestUpgrade || bestROI < ROI_THRESHOLD) {
            ns.tprint(`No profitable upgrades available with ROI ≥ ${(ROI_THRESHOLD * 100).toFixed(2)}%.`);
            break;
        }

        // Log and perform the best upgrade
        const { type, cost, roi, node } = bestUpgrade;
        if (type === "NewNode") {
            ns.tprint(`\n[SELECTED UPGRADE] Purchasing new Hacknet Node for ${ns.nFormat(cost, "$0.00a")} (ROI: ${(roi * 100).toFixed(2)}%).`);
            hacknet.purchaseNode();
        } else {
            ns.tprint(`\n[SELECTED UPGRADE] Upgrading Node ${node}'s ${type} for ${ns.nFormat(cost, "$0.00a")} (ROI: ${(roi * 100).toFixed(2)}%).`);
            if (type === "Level") hacknet.upgradeLevel(node, 1);
            if (type === "RAM") hacknet.upgradeRam(node, 1);
            if (type === "Core") hacknet.upgradeCore(node, 1);
        }

        // Update totals
        totalSpent += cost;
        totalROI += roi;
        upgradeCount += 1;
        if (type in upgradeTypes) upgradeTypes[type] += 1;

        // Check remaining budget
        const updatedMoney = ns.getServerMoneyAvailable("home");
        if (updatedMoney < cost) {
            ns.tprint("Not enough money left to continue upgrading within the budget.");
            break;
        }
    }

    // Final Summary
    ns.tprint("\n=== Hacknet Upgrade Summary ===");
    ns.tprint(`Total Spent: ${ns.nFormat(totalSpent, "$0.00a")}`);
    ns.tprint(`Upgrades Performed: ${upgradeCount}`);
    ns.tprint(`Average ROI: ${(totalROI / Math.max(upgradeCount, 1) * 100).toFixed(2)}%`);
    ns.tprint("\nBreakdown of Upgrades:");
    ns.tprint(`  Level Upgrades: ${upgradeTypes.Level}`);
    ns.tprint(`  RAM Upgrades: ${upgradeTypes.RAM}`);
    ns.tprint(`  Core Upgrades: ${upgradeTypes.Core}`);
    ns.tprint(`  New Nodes Purchased: ${upgradeTypes.NewNode}`);

    ns.tprint("\nHacknet Auto-Upgrader: Budget cycle complete.");
}
