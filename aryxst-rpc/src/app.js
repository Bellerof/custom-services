import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import express from "express";
import Sqrl from "./lib/sqrl.js";
import { fetchAssets, updateData, createTags } from "./lib/edit-functions.js";
import { handleProcesses } from "./lib/handle-processes.js";
import { isURL, readJson } from "./utils.js";
import { CLIENT_ID, PROCESS_LIST_REFRESH_INTERVAL } from "./config.js";

const app = express();

if (!existsSync("generated/")) await mkdir("generated/");

handleProcesses();
setTimeout(handleProcesses, PROCESS_LIST_REFRESH_INTERVAL);

await fetchAssets(CLIENT_ID);
await createTags(
 await readJson("generated/data.json"),
 await readJson("generated/assets.json")
);

app.engine("html", Sqrl.renderFile);
app.set("view engine", "html");
app.set("views", import.meta.dirname + "/views/pages");
app.set("partials", import.meta.dirname + "/views/partials");

app.use(express.static("public"));
app.use(express.json());

app.get("/", async (req, res) => {
 res.render("index", {
  data: await readJson("generated/data.json").sort((a, b) => b.priority - a.priority),
  assets: await readJson("generated/assets.json"),
  processes: await readJson("processes.json"),
  CLIENT_ID,
 });
});

app.post("/change-icon", async (req, res) => {
 const data = await readJson("generated/data.json");

 data[data.findIndex(item => item.name === req.body.name)].icon = req.body.icon;

 await updateData(data);
 res.send({ success: true });
});

app.post("/change-name", async (req, res) => {
 const data = await readJson("generated/data.json");

 data[data.findIndex(item => item.name === req.body.name)].name = req.body.newName;

 await updateData(data);
 res.send({ success: true });
});

app.post("/change-priority", async (req, res) => {
 const data = await readJson("generated/data.json");

 data[data.findIndex(item => item.name === req.body.name)].priority = req.body.priority;

 await updateData(data);
 res.send({ success: true });
});

app.post("/add-program", async (req, res) => {
 const data = await readJson("generated/data.json");
 if (!isURL(req.body.icon)) {
  const asset = await readJson("generated/assets.json").find(
   item => item.tag === req.body.icon
  );
  if (asset) {
   req.body.icon = asset.url;
  }
 }

 data.push(req.body);

 await updateData(data);
 res.send({ success: true });
});

app.post("/delete-program", async (req, res) => {
 const data = await readJson("generated/data.json");

 data.splice(
  data.findIndex(item => item.name === req.body.name),
  1
 );

 await updateData(data);
 res.send({ success: true });
});

app.post("/fetch-assets", async (req, res) => {
 await fetchAssets(CLIENT_ID);
 res.send({ success: true });
});

app.post("/is-valid-path", (req, res) => {
 if (existsSync(req.body.path)) {
  res.send({ success: true });
 } else {
  res.send({ success: false });
 }
});

app.listen(3000, () => {
 console.log("Listening on http://localhost:6969");
});
