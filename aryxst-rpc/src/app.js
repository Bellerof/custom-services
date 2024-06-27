import { existsSync } from 'fs';
import { createRequire } from 'module';
import express from 'express';
import Sqrl from './lib/sqrl.js';
import { clientId } from './config.js';
import { importProcesses, fetchAssets, updateData, renderTags } from './lib/editFunctions.js';
import { isURL } from './utils/isURL.js';
import './handleProcesses.js';

const require = createRequire(import.meta.url);

const app = express();

app.engine('html', Sqrl.renderFile);
app.set('view engine', 'html');
app.set('views', import.meta.dirname + '/views/pages');
app.set('partials', import.meta.dirname + '/views/partials');

app.use(express.static('public'));
app.use(express.json());

fetchAssets(clientId);
renderTags(require('../data.json'), require('../assets.json'));

app.get('/', async (req, res) => {
 res.render('index', {
  data: require('../data.json').sort((a, b) => b.priority - a.priority),
  assets: require('../assets.json'),
  processes: importProcesses(),
  clientId,
 });
});

app.post('/change-icon', (req, res) => {
 const { name, icon } = req.body;
 const data = require('../data.json');
 data[data.findIndex((v) => v.name === name)].icon = icon;
 updateData(data);
 res.send({ success: true });
});

app.post('/change-name', (req, res) => {
 const { name, newName } = req.body;
 const data = require('../data.json');
 data[data.findIndex((v) => v.name === name)].name = newName;

 updateData(data);
 res.send({ success: true });
});

app.post('/change-priority', (req, res) => {
 const { name, priority } = req.body;
 const data = require('../data.json');

 data[data.findIndex((v) => v.name === name)].priority = priority;
 updateData(data);
 res.send({ success: true });
});

app.post('/add-program', (req, res) => {
 const data = require('../data.json');
 if (!isURL(req.body.icon)) {
  const asset = require('../assets.json').find((v) => v.tag === req.body.icon);
  if (asset) {
   req.body.icon = asset.url;
  }
 }
 data.push(req.body);
 updateData(data);
 res.send({ success: true });
});
app.post('/delete-program', (req, res) => {
 const { name } = req.body;
 const data = require('../data.json');
 data.splice(
  data.findIndex((v) => v.name === name),
  1
 );
 updateData(data);
 res.send({ success: true });
});

app.post('/fetch-assets', (req, res) => {
 fetchAssets(clientId);
 res.send({ success: true });
});

app.post('/is-valid-path', (req, res) => {
 const { path } = req.body;
 if (existsSync(path)) {
  res.send({ success: true });
 } else {
  res.send({ success: false });
 }
});
app.listen(3000, () => {
 console.log('Example app listening on  http://localhost:3000/');
});
