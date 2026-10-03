import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const inputDir = path.join(root, "images");
const outputRoot = path.join(root, "public", "frames");
const desktopDir = path.join(outputRoot, "desktop");
const mobileDir = path.join(outputRoot, "mobile");

const frameNumber = (name) => {
  const match = name.match(/(\d+)(?=\.[^.]+$)/);
  return match ? Number(match[1]) : Number.NaN;
};

const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");

const files = (await fs.readdir(inputDir))
  .filter((name) => /\.jpe?g$/i.test(name))
  .sort((a, b) => frameNumber(a) - frameNumber(b));

if (!files.length) {
  throw new Error(`No JPG prototype frames found in ${inputDir}`);
}

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(desktopDir, { recursive: true });
await fs.mkdir(mobileDir, { recursive: true });

const unique = [];
let previousHash = null;

for (let index = 0; index < files.length; index += 1) {
  const sourceName = files[index];
  const sourcePath = path.join(inputDir, sourceName);
  const buffer = await fs.readFile(sourcePath);
  const currentHash = hash(buffer);

  if (currentHash === previousHash) continue;

  unique.push({
    sourceName,
    sourceFrame: frameNumber(sourceName),
    sourceOrdinal: index + 1,
    buffer,
  });
  previousHash = currentHash;
}

const desktopFrames = [];
for (let index = 0; index < unique.length; index += 1) {
  const name = `frame-${String(index + 1).padStart(4, "0")}.jpg`;
  await fs.writeFile(path.join(desktopDir, name), unique[index].buffer);
  desktopFrames.push({
    index,
    src: `/frames/desktop/${name}`,
    sourceFrame: unique[index].sourceFrame,
    sourceOrdinal: unique[index].sourceOrdinal,
  });
}

const mobileSourceIndexes = unique
  .map((_, index) => index)
  .filter((index) => index % 2 === 0 || index === unique.length - 1);

const mobileFrames = [];
for (let index = 0; index < mobileSourceIndexes.length; index += 1) {
  const uniqueIndex = mobileSourceIndexes[index];
  const name = `frame-${String(index + 1).padStart(4, "0")}.jpg`;
  await fs.writeFile(path.join(mobileDir, name), unique[uniqueIndex].buffer);
  mobileFrames.push({
    index,
    src: `/frames/mobile/${name}`,
    sourceFrame: unique[uniqueIndex].sourceFrame,
    sourceOrdinal: unique[uniqueIndex].sourceOrdinal,
  });
}

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: {
    format: "jpg-prototype",
    inputFrameCount: files.length,
    uniqueConsecutiveFrameCount: unique.length,
    duplicatesRemoved: files.length - unique.length,
    dimensions: { width: 1280, height: 720 },
  },
  profiles: {
    desktop: {
      frameCount: desktopFrames.length,
      preloadRadius: 10,
      frames: desktopFrames,
    },
    mobile: {
      frameCount: mobileFrames.length,
      preloadRadius: 5,
      frames: mobileFrames,
      note: "Prototype delivery profile: every second unique desktop frame. Final mobile production sequence will use the approved 800px AVIF/WebP export or a dedicated mobile master.",
    },
  },
};

await fs.writeFile(
  path.join(outputRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `Prepared ${desktopFrames.length} desktop frames and ${mobileFrames.length} mobile prototype frames from ${files.length} JPG sources.`,
);
