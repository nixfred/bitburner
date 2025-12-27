/**
 * pai-cmd-lite.js - Lightweight Remote Command Execution
 * Agent: PAI-Commander-Lite
 * RAM: ~1.6GB (no hack/grow/weaken)
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Cmd";
    const CMD_FILE = "command.txt";

    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.print(`[${AGENT}] Lite commander ready (1.6GB)`);

    while (true) {
        if (ns.fileExists(CMD_FILE, "home")) {
            const cmd = ns.read(CMD_FILE).trim();
            ns.rm(CMD_FILE, "home");

            if (cmd) {
                const parts = cmd.split(" ");
                const action = parts[0].toLowerCase();
                let result = "";

                if (action === "run") {
                    const script = parts[1];
                    const args = parts.slice(2);
                    const pid = ns.exec(script, "home", 1, ...args);
                    result = pid > 0 ? `Started ${script} (PID: ${pid})` : `FAILED: Not enough RAM for ${script}`;
                } else if (action === "kill") {
                    const target = parts[1];
                    if (target === "all") {
                        let killed = 0;
                        for (const s of ns.ps("home")) {
                            if (s.filename !== "pai-cmd-lite.js") {
                                ns.kill(s.pid);
                                killed++;
                            }
                        }
                        result = `Killed ${killed} scripts`;
                    } else {
                        result = ns.kill(target, "home") ? `Killed ${target}` : `Failed`;
                    }
                } else if (action === "status") {
                    const m = ns.getServerMoneyAvailable("home");
                    const r = ns.getServerMaxRam("home");
                    const u = ns.getServerUsedRam("home");
                    result = `$${ns.formatNumber(m)} | RAM: ${u.toFixed(1)}/${r}GB free:${(r-u).toFixed(1)}GB | Hack:${ns.getHackingLevel()}`;
                } else if (action === "ls") {
                    result = ns.ls("home", ".js").join(", ");
                } else {
                    result = `Commands: run, kill, status, ls`;
                }

                ns.print(`[${AGENT}] ${cmd} => ${result}`);
            }
        }
        await ns.sleep(2000);
    }
}
