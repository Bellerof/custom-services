import { stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import util from 'node:util';
import commandExists from 'command-exists';
import chokidar from 'chokidar';
import ffmpeg from 'fluent-ffmpeg';
import Notifier from 'node-notifier';

commandExists('ffmpeg', function (err, commandExists) {
 if (commandExists) return;
 log('\x1b[31mffmpeg not found, exiting... \x1b[0m');
 log('Please install ffmpeg and try again. See https://ffmpeg.org/download.html\n');
 process.exit(1);
});
// FORMAT: node index.js path=<path>
const args = process.argv.slice(2).map((str) => {
 const [name, value] = str.split('=');
 return { name, value };
});

/**
 * @type {{name: string, value: string}[]}
 * @param {string} path - path to watch
 * @param {number} maxSize - max size in bytes to compress, if the file is larger it will not be compressed. Defaults to Infinity.
 */
const options = {
 icon: `${import.meta.dirname}/icon.png`,
 path: args.find(({ name }) => name === 'path')?.value || './videos',
 maxSize: args.find(({ name }) => name === 'maxSize')?.value || Infinity,
};
const logFile = createWriteStream(import.meta.dirname + '/latest.log', { flags: 'w' });
const logOutput = process.stdout;
console.log = (e) => {
 var formattedText = `[${new Date().toLocaleTimeString()}]: ${util.format(e)}`;
 logFile.write(formattedText + '\n');
 logOutput.write(formattedText + '\n');
};

console.log('Watching directory:' + options.path);
console.log('WARNING: A recent NVIDIA GPU is required to use this script. See https://developer.nvidia.com/video-encode-and-decode-gpu-support-matrix-new\n');

Notifier.notify({
 title: 'Compress Videos',
 subtitle: 'Initialized!',
 message: 'Successfully started!',
 icon: options.icon,
});

const compressed = [];
const queue = [];
const watcher = chokidar.watch(options.path, {
 ignored: [/(^|[\/\\])\../, /node_modules/], // ignore dotfiles and files that do not end with .mp4
 persistent: true,
 depth: 2,
 ignoreInitial: true,
 awaitWriteFinish: true,
});

watcher.on('add', async (path) => {
 if (!path.endsWith('.mp4')) return;
 if (path.endsWith('-COMPRESSED.mp4')) return;

 const { id: fileId, size } = await getFileInfo(path);

 if (size > options.maxSize) {
  Notifier.notify({
   title: 'Compress Videos',
   subtitle: 'Skipping!',
   message: `File ${path} is larger than ${options.maxSize / 1024 / 1024}MB, it will not be compressed`,
   icon: options.icon,
  });
  return;
 }

 if (compressed.includes(fileId)) {
  console.log('Already compressed this file, got renamed!');
 } else {
  queue.push(fileId);
  compressVideo(path, { fileId }).save(formatName(path));
  queue.splice(queue.indexOf(fileId), 1);
 }
});

async function getFileInfo(path) {
 var { ino, dev, size } = await stat(path);
 return { id: `${ino}:${dev}`, size };
}
function formatName(path) {
 const splatPath = path.split('/');
 const fileName = splatPath.pop().replace('.mp4', '');
 return `${fileName}-COMPRESSED.mp4`;
}

function compressVideo(path, data) {
 console.log(`Starting compression of ${path}...`);
 return ffmpeg(path)
  .fps(60)
  .addOptions(['-crf 26', '-ab 160k', '-acodec aac', '-ac 2', '-f mp4', '-threads 12', '-vb 6000k', '-vcodec hevc_nvenc'])
  .on('end', () => {
   console.log(`Successfully compressed!`);
   Notifier.notify({
    title: 'Compress Videos',
    subtitle: 'Success!',
    message: `File ${path} has been compressed`,
    icon: options.icon,
   });
   compressed.push(data.fileId);
  })
  .on('error', (err) => {
   Notifier.notify({
    title: 'Compress Videos',
    subtitle: 'Error!',
    message: `File ${path} has not been compressed, see logs!`,
    icon: options.icon,
   });
   console.log(err);
  });
}
