/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.print("CMD ready");

    while (true) {
        if (ns.fileExists("command.txt", "home")) {
            const cmd = ns.read("command.txt").trim();
            ns.rm("command.txt", "home");

            if (cmd.startsWith("run ")) {
                const script = cmd.slice(4);
                const pid = ns.exec(script, "home", 1);
                ns.print(pid > 0 ? "Started " + script : "FAILED " + script);
            } else if (cmd === "status") {
                const m = ns.getServerMoneyAvailable("home");
                const r = ns.getServerMaxRam("home");
                const u = ns.getServerUsedRam("home");
                ns.print("$" + ns.formatNumber(m) + " | RAM:" + u.toFixed(1) + "/" + r + " | Hack:" + ns.getHackingLevel());
            } else if (cmd === "kill all") {
                for (const p of ns.ps("home")) {
                    if (p.filename !== "cmd.js") ns.kill(p.pid);
                }
                ns.print("Killed all");
            }
        }
        await ns.sleep(2000);
    }
}
