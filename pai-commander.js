/**
 * pai-commander.js - Remote Command Execution
 * Agent: PAI-Commander
 * RAM: ~2.5GB
 *
 * Watches for commands from PAI (via command.txt) and executes them.
 * This allows PAI to run scripts remotely!
 *
 * Usage: run pai-commander.js (keep running in background)
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const AGENT = "PAI-Commander";
    const CMD_FILE = "command.txt";
    const POLL_INTERVAL = 2000; // Check every 2 seconds

    ns.disableLog("ALL");
    ns.ui.openTail();

    ns.print(`[${AGENT}] PURPOSE: Execute remote commands from PAI`);
    ns.print(`[${AGENT}] STATUS: Watching for ${CMD_FILE}...`);
    ns.print(`[${AGENT}] Ready to receive orders!`);
    ns.print("");

    let commandsExecuted = 0;

    while (true) {
        if (ns.fileExists(CMD_FILE, "home")) {
            const cmd = ns.read(CMD_FILE).trim();
            ns.rm(CMD_FILE, "home"); // Delete after reading

            if (cmd && cmd.length > 0) {
                commandsExecuted++;
                ns.print(`[${AGENT}] ════════════════════════════════════`);
                ns.print(`[${AGENT}] RECEIVED COMMAND #${commandsExecuted}:`);
                ns.print(`[${AGENT}] > ${cmd}`);

                try {
                    const result = await executeCommand(ns, cmd);
                    ns.print(`[${AGENT}] RESULT: ${result}`);
                } catch (e) {
                    ns.print(`[${AGENT}] ERROR: ${e}`);
                }
                ns.print(`[${AGENT}] ════════════════════════════════════`);
                ns.print("");
            }
        }

        await ns.sleep(POLL_INTERVAL);
    }
}

async function executeCommand(ns, cmd) {
    const parts = cmd.split(" ");
    const action = parts[0].toLowerCase();

    switch (action) {
        case "run": {
            const script = parts[1];
            const args = parts.slice(2);
            if (!ns.fileExists(script, "home")) {
                return `Script not found: ${script}`;
            }
            const pid = ns.exec(script, "home", 1, ...args);
            return pid > 0 ? `Started ${script} (PID: ${pid})` : `Failed to start ${script}`;
        }

        case "kill": {
            const script = parts[1];
            if (script === "all") {
                const scripts = ns.ps("home");
                let killed = 0;
                for (const s of scripts) {
                    if (s.filename !== "pai-commander.js") {
                        ns.kill(s.pid);
                        killed++;
                    }
                }
                return `Killed ${killed} scripts`;
            }
            const success = ns.kill(script, "home");
            return success ? `Killed ${script}` : `Failed to kill ${script}`;
        }

        case "status": {
            const money = ns.getServerMoneyAvailable("home");
            const ram = ns.getServerMaxRam("home");
            const usedRam = ns.getServerUsedRam("home");
            const hackLevel = ns.getHackingLevel();
            const scripts = ns.ps("home").length;
            return `Money: $${ns.formatNumber(money)} | RAM: ${usedRam.toFixed(1)}/${ram}GB | Hack: ${hackLevel} | Scripts: ${scripts}`;
        }

        case "ls": {
            const files = ns.ls("home", ".js");
            return `Scripts: ${files.join(", ")}`;
        }

        case "scan": {
            const servers = ns.scan("home");
            return `Nearby: ${servers.join(", ")}`;
        }

        case "nuke": {
            const target = parts[1];
            try {
                ns.nuke(target);
                return `Nuked ${target}`;
            } catch (e) {
                return `Cannot nuke ${target}: ${e}`;
            }
        }

        case "hack": {
            const target = parts[1] || "n00dles";
            const stolen = await ns.hack(target);
            return `Hacked ${target}, stole $${ns.formatNumber(stolen)}`;
        }

        case "grow": {
            const target = parts[1] || "n00dles";
            await ns.grow(target);
            return `Grew ${target}`;
        }

        case "weaken": {
            const target = parts[1] || "n00dles";
            await ns.weaken(target);
            return `Weakened ${target}`;
        }

        default:
            return `Unknown command: ${action}. Valid: run, kill, status, ls, scan, nuke, hack, grow, weaken`;
    }
}
