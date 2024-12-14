/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("sleep"); // Suppress sleep logs for cleaner output
    const updateInterval = 300000; // 5 minutes in milliseconds

    let currentJob = null;
    let sessionEarnings = 0;
    let lastMoney = ns.getServerMoneyAvailable("home");

    while (true) {
        // Log the current job status
        if (!currentJob) {
            ns.tprint("Currently not working. Searching for a job...");
        } else {
            ns.tprint(`Currently working at: ${currentJob}`);
        }

        // Calculate session earnings
        const currentMoney = ns.getServerMoneyAvailable("home");
        const earningsThisCycle = currentMoney - lastMoney;
        sessionEarnings += earningsThisCycle;
        lastMoney = currentMoney;

        // Output earnings report
        ns.tprint(`Earnings this session: $${ns.nFormat(sessionEarnings, "0.00a")}`);
        ns.tprint(`Hourly rate (estimated): $${ns.nFormat((earningsThisCycle / (updateInterval / 1000 / 60)) * 60, "0.00a")}`);

        // Simulate job search and working
        if (!currentJob || currentJob !== "BestJob (Simulated)") {
            currentJob = "BestJob (Simulated)";
            ns.tprint("Started working at: BestJob (Simulated)");
        }

        // Wait for the next update
        await ns.sleep(updateInterval);
    }
}
