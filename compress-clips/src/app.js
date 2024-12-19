import { existsSync } from "fs";
import { mkdir, stat } from "fs/promises";
import { promisify } from "util";
import { basename, join } from "path";
import commandExists from "command-exists";
import chokidar from "chokidar";
import ffmpeg from "fluent-ffmpeg";

/* Exit if ffmpeg is not installed */
await promisify(commandExists)("ffmpeg").then(exists => {
 if (exists) return;
 console.log("\x1b[31mffmpeg not found, exiting...\x1b[0m");
 console.log(
  "Please install ffmpeg and try again. See https://ffmpeg.org/download.html\n"
 );
 process.exit(1);
});
/* e.g. node src/app.js --path=<path>
 * Create an array from passed CLI arguments
 * works with --path=<path> and path=<path>
 * but not with --path because thats the next arg
 */
const args = process.argv.slice(2).map(str => {
 const [name, value] = str.split("=");
 return { name, value };
});
/**
 * @type {Array<{name: string, value: string}>}
 * @param {string} path - The path to watch. Defaults to THIS_SCRIPT_DIRECTORY/videos
 * @param {number} maxSize - The maximum size in bytes for file to compress, if the file is larger it will not be compressed. Defaults to 50MB.
 * @param {string} compressedPath - A getter that returns the output folder for compressed videos
 */
const options = {
 path:
  args.find(({ name }) => name.endsWith("path"))?.value ??
  join(import.meta.dirname, "videos"),
 maxSize: +args.find(({ name }) => name.endsWith("max-size"))?.value || 50 * 1024 * 1024,
 get compressedPath() {
  return join(this.path, "compressed");
 },
};

const allowedExtensions = ["mp4", "mkv"];
const compressed = new Set();
/* Watch for files being added in options.path
 * ignores node_modules ignore dotfiles
 */
const watcher = chokidar.watch(options.path, {
 ignored: [/(^|[\/\\])\../, /node_modules/, options.compressedPath],
 persistent: true,
 depth: 2,
 ignoreInitial: true,
 awaitWriteFinish: true,
});

/* Creates the watched dir if it doesn't exist */
if (!existsSync(options.path)) {
 await mkdir(options.path, { recursive: true });
}
/* Same for the compressed folder */
if (!existsSync(join(options.path, "compressed"))) {
 await mkdir(join(options.path, "compressed"));
}

console.log("Watching directory: " + options.path);
console.log(`With a maximum input file size of: ${sizeToMB(options.maxSize)}`);

watcher.on("add", async filePath => {
 /* Skip the file if doesn't have an allowed extension */
 if (!allowedExtensions.some(ext => filePath.endsWith(ext))) return;

 const fileInfo = await getFileInfo(filePath);
 /* Skip the file if it's bigger than the defined max-size */
 if (fileInfo.size > options.maxSize) return;
 /* Skip the file if it's already been compressed(also prevents renamed files from being recompressed) */
 if (compressed.has(fileInfo.id)) return;

 /* Compress the video */
 compressVideo(filePath, fileInfo).save(getCompressedFilePath(filePath));
});
/* Generates somewhat a UUID */
async function getFileInfo(filePath) {
 const { ino, dev, size } = await stat(filePath);
 return { id: `${ino}:${dev}`, size };
}
/* Joins the compressedPath with the filename of the provided file path */
function getCompressedFilePath(filePath) {
 return join(options.compressedPath, basename(filePath));
}

function sizeToMB(size) {
 return `${(size / 1024 / 1024).toFixed(2)}MB`;
}

function compressVideo(filePath, fileInfo) {
 return ffmpeg(filePath)
  .outputFPS(60)
  .audioCodec("aac")
  .audioBitrate("160k")
  .videoCodec("libx264")
  .audioChannels(2)
  .addOutputOptions([
   // Encoding Threads
   "-threads 2",
  ])
  .on("start", () => {
   console.log(`\nStarting compression of ${filePath}`);
  })
  .on("progress", ({ percent }) => {
   percent && console.log("Progress:", percent);
  })
  .on("end", async () => {
   console.log(
    `Finished compression of ${filePath} | Original size: ${sizeToMB(
     fileInfo.size
    )} | New size: ${sizeToMB((await getFileInfo(getCompressedFilePath(filePath))).size)}`
   );
   compressed.add(fileInfo.id);
  })
  .on("error", console.error);
}
