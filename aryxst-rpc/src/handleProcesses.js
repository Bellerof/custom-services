import { writeFileSync } from 'fs';
import { createRequire } from 'module';
import { clientId } from './config.js';
import psList from 'ps-list';
import RPC from 'discord-rpc';

const require = createRequire(import.meta.url);

const rpc = new RPC.Client({ transport: 'ipc' });

rpc.login({ clientId }).catch(console.error);
rpc.on('ready', () => {
 console.log('Ready!');
});

setInterval(async () => {
 const processes = await psList();
 writeFileSync(
  new URL('../processes.json', import.meta.url),
  JSON.stringify(
   processes.map((v) => v.name.toLowerCase()),
   null,
   2
  )
 );
 const data = require('../data.json');
 const runningProcesses = data.filter((v) => processes.find((p) => p.name === v.executableName.toLowerCase()));
 console.log(runningProcesses);
 if (!runningProcesses.length) {
  rpc.clearActivity();
  return;
 }
 const prioritedProcess = runningProcesses.reduce((a, b) => {
  return a.priority > b.priority ? a : b;
 });
 rpc.setActivity({
  details: prioritedProcess.name,
  state: 'Wandering around ig',
  largeImageKey: prioritedProcess.icon,
  largeImageText: prioritedProcess.name,
 });
}, 10000);
