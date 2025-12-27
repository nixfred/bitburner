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
                const parts = cmd.slice(4).split(" ");
                const script = parts[0];
                const threads = parseInt(parts[1]) || 1;
                const pid = ns.exec(script, "home", threads, ...parts.slice(2));
                ns.print(pid > 0 ? `Started ${script} t=${threads}` : `FAILED ${script}`);
            } else if (cmd === "deploy") {
                const servers = ["n00dles", "foodnstuff", "sigma-cosmetics", "joesguns", "hong-fang-tea", "harakiri-sushi", "iron-gym"];
                let total = 0;
                for (const s of servers) {
                    try { ns.brutessh(s); } catch {}
                    try { ns.ftpcrack(s); } catch {}
                    try { ns.nuke(s); } catch {}
                    if (!ns.hasRootAccess(s)) continue;
                    ns.killall(s);
                    await ns.scp("worker.js", s);
                    const threads = Math.floor(ns.getServerMaxRam(s) / 1.75);
                    if (threads > 0) {
                        ns.exec("worker.js", s, threads, "joesguns");
                        total += threads;
                        ns.print(`${s}: ${threads}t`);
                    }
                }
                ns.print(`DEPLOYED ${total} threads`);
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
