import { readFileSync, writeFileSync } from 'fs';

import { isURL } from '../utils/isURL.js';

function updateData(data) {
 writeFileSync(new URL('../../data.json', import.meta.url), JSON.stringify(data, null, 2), 'utf8');
}
function fetchAssets(clientId) {
 fetch('https://rpc-proxy.firstdarkdev.xyz/' + clientId + '/assets')
  .then((res) => res.json())
  .then((data) => {
   writeFileSync('./assets.json', JSON.stringify(data.length ? data.map((v) => ({ id: v.id, tag: v.name, url: `https://cdn.discordapp.com/app-assets/${clientId}/${v.id}` })) : [], null, 2), 'utf8');
  });
}
function importProcesses() {
 return JSON.parse(readFileSync(new URL('../../processes.json', import.meta.url), 'utf-8'));
}
function renderTags(data, assets) {
 const newData = data.map((v) => {
  if (!isURL(v.icon)) {
   const asset = assets.find((asset) => asset.tag === v.icon);
   if (asset) {
    v.icon = asset.url;
   }
  }
  return v;
 });
 updateData(newData);
 return newData;
}

export { importProcesses, fetchAssets, renderTags, updateData };
