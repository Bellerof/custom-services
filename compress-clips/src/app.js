import { existsSync } from "fs";
import { mkdir, stat } from "fs/promises";
import { promisify } from "util";
import { basename, join } from "path";
import commandExists from "command-exists";
import chokidar from "chokidar";
import ffmpeg from "fluent-ffmpeg";

await promisify(commandExists)("ffmpeg").then(exists => {
 if (exists) return;
 console.log("\x1b[31mffmpeg not found, exiting...\x1b[0m");
 console.log(
  "Please install ffmpeg and try again. See https://ffmpeg.org/download.html\n"
 );
 process.exit(1);
});
// e.g. node src/app.js --path=<path>
const args = process.argv.slice(2).map(str => {
 const [name, value] = str.split("=");
 return { name, value };
});
/**
 * @type {Array<{name: string, value: string}>}
 * @param {string} path - The path to watch
 * @param {number} maxSize - The maximum size in bytes for file to compress, if the file is larger it will not be compressed. Defaults to 50MB.
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
const watcher = chokidar.watch(options.path, {
 ignored: [/(^|[\/\\])\../, /node_modules/, options.compressedPath],
 persistent: true,
 depth: 2,
 ignoreInitial: true,
 awaitWriteFinish: true,
});

if (!existsSync(options.path)) {
 await mkdir(options.path, { recursive: true });
}

if (!existsSync(join(options.path, "compressed"))) {
 await mkdir(join(options.path, "compressed"));
}

console.log("Watching directory: " + options.path);
console.log(
 `With a maximum input file size of: ${(options.maxSize / 1024 / 1024).toFixed(2)}MB`
);

watcher.on("add", async filePath => {
 if (!allowedExtensions.some(ext => filePath.endsWith(ext))) return;

 const { id: fileId, size } = await getFileInfo(filePath);

 if (size > options.maxSize) return;
 if (compressed.has(fileId)) return;

 compressVideo(filePath, { fileId }).save(
  join(options.compressedPath, basename(filePath))
 );
});

async function getFileInfo(filePath) {
 const { ino, dev, size } = await stat(filePath);
 return { id: `${ino}:${dev}`, size };
}

function compressVideo(filePath, data) {
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
  .on("end", () => {
   compressed.add(data.fileId);
  })
  .on("error", console.error);
}
