import { isURL, writeJson } from "../utils.js";

async function updateData(data) {
 await writeJson("../../data.json", data);
}

async function fetchAssets(clientId) {
 const response = await fetch(
  "https://rpc-proxy.firstdarkdev.xyz/" + clientId + "/assets"
 );
 const data = await response.json();
 await writeJson(
  "generated/assets.json",
  data.length
   ? data.map(item => ({
      id: item.id,
      tag: item.name,
      url: `https://cdn.discordapp.com/app-assets/${clientId}/${item.id}`,
     }))
   : []
 );
}

async function createTags(data, assets) {
 await updateData(
  data.map(item => {
   if (!isURL(item.icon)) {
    const asset = assets.find(asset => asset.tag === item.icon);
    if (asset) {
     item.icon = asset.url;
    }
   }
   return item;
  })
 );
}

export { fetchAssets, createTags, updateData };
