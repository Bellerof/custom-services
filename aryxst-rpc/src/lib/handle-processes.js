import RPC from "discord-rpc";
import psList from "ps-list";
import { readJson, writeJson } from "../utils.js";
import { CLIENT_ID } from "../config.js";

const rpc = new RPC.Client({ transport: "ipc" });

rpc.login({ clientId: CLIENT_ID }).catch(console.error);

rpc.on("ready", () => {
 console.log("Ready!");
});

async function handleProcesses() {
 const processes = await psList();
 const data = await readJson("generated/data.json", []);

 await writeJson(
  "generated/processes.json",
  processes.map(process => process.name.toLowerCase())
 );

 const runningProcesses = data.filter(item =>
  processes.find(process => process.name === item.executableName.toLowerCase())
 );

 if (!runningProcesses.length) {
  rpc.clearActivity();
  return;
 }

 const prioritizedProcess = runningProcesses.reduce((a, b) => {
  return a.priority > b.priority ? a : b;
 });

 rpc.setActivity({
  details: prioritizedProcess.name,
  largeImageKey: prioritizedProcess.icon,
  largeImageText: prioritizedProcess.name,
 });
}

export { handleProcesses };
