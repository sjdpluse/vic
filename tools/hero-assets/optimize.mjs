#!/usr/bin/env node

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const argv = process.argv.slice(2);

function arg(name, fallback) {
  const index = argv.indexOf(name);
  if (index === -1 || index === argv.length - 1) return fallback;
  return argv[index + 1];
}

function numberArg(name, fallback) {
  const value = Number(arg(name, fallback));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid numeric value for ${name}`);
  }
  return value;
}

const root = process.cwd();
const inputDir = path.resolve(root, arg("--input", "png"));
const outputDir = path.resolve(root, arg("--output", "artifacts/hero-sequence"));
const desktopWidth = numberArg("--desktop-width", 1280);
const mobileWidth = numberArg("--mobile-width", 800);
const avifQuality = numberArg("--avif-quality", 56);
const webpQuality = numberArg("--webp-quality", 82);
const concurrency = Math.max(1, Math.floor(numberArg("--concurrency", 2)));
const limit = Math.floor(numberArg("--limit", 0));

const profiles = [
  {
    name: "desktop",
    width: desktopWidth,
    composition: "desktop-master",
  },
  {
    name: "mobile",
    width: mobileWidth,
    composition: "desktop-derived-prototype",
  },
];

function frameNumber(filename) {
  const match = filename.match(/(\d+)(?=\.[^.]+$)/);
  return match ? Number(match[1]) : Number.NaN;
}

function compareFrames(a, b) {
  const aNumber = frameNumber(a);
  const bNumber = frameNumber(b);
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
    return aNumber - bNumber;
  }
  return a.localeCompare(b, undefined, { numeric: true });
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function prettyBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
}

function relativeToRoot(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

async function mapLimit(items, maxConcurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from(
    { length: Math.min(maxConcurrency, items.length) },
    async () => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= items.length) return;
        results[index] = await worker(items[index], index);
      }
    },
  );

  await Promise.all(runners);
  return results;
}

async function collectSourceFrames() {
  const entries = await fs.readdir(inputDir, { withFileTypes: true });
  const filenames = entries
    .filter((entry) => entry.isFile() && /\.png$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort(compareFrames);

  if (filenames.length === 0) {
    throw new Error(`No PNG frames found in ${inputDir}`);
  }

  const unique = [];
  const duplicates = [];
  let previousHash = null;
  let expectedWidth = null;
  let expectedHeight = null;
  let sourceBytes = 0;

  for (let index = 0; index < filenames.length; index += 1) {
    const filename = filenames[index];
    const filePath = path.join(inputDir, filename);
    const buffer = await fs.readFile(filePath);
    const hash = sha256(buffer);
    const metadata = await sharp(buffer, { failOn: "error" }).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(`Could not read dimensions for ${filename}`);
    }

    expectedWidth ??= metadata.width;
    expectedHeight ??= metadata.height;

    if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
      throw new Error(
        `${filename} is ${metadata.width}x${metadata.height}; expected ${expectedWidth}x${expectedHeight}`,
      );
    }

    sourceBytes += buffer.length;

    const source = {
      sourceOrdinal: index + 1,
      sourceFrame: frameNumber(filename),
      sourceFile: relativeToRoot(filePath),
      sourceBytes: buffer.length,
      sha256: hash,
      path: filePath,
    };

    if (hash === previousHash) {
      duplicates.push(source);
      continue;
    }

    unique.push(source);
    previousHash = hash;
  }

  return {
    filenames,
    unique,
    duplicates,
    sourceBytes,
    width: expectedWidth,
    height: expectedHeight,
  };
}

async function convertProfile(profile, frames) {
  const avifDir = path.join(outputDir, profile.name, "avif");
  const webpDir = path.join(outputDir, profile.name, "webp");
  await fs.mkdir(avifDir, { recursive: true });
  await fs.mkdir(webpDir, { recursive: true });

  return mapLimit(frames, concurrency, async (frame, index) => {
    const sequenceNumber = index + 1;
    const outputName = `frame-${String(sequenceNumber).padStart(4, "0")}`;
    const avifPath = path.join(avifDir, `${outputName}.avif`);
    const webpPath = path.join(webpDir, `${outputName}.webp`);

    const base = sharp(frame.path, {
      failOn: "error",
      sequentialRead: true,
    }).resize({
      width: profile.width,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });

    const [avifInfo, webpInfo] = await Promise.all([
      base
        .clone()
        .avif({
          quality: avifQuality,
          effort: 6,
          chromaSubsampling: "4:4:4",
        })
        .toFile(avifPath),
      base
        .clone()
        .webp({
          quality: webpQuality,
          effort: 5,
          smartSubsample: true,
        })
        .toFile(webpPath),
    ]);

    return {
      index,
      sequenceNumber,
      sourceOrdinal: frame.sourceOrdinal,
      sourceFrame: Number.isFinite(frame.sourceFrame) ? frame.sourceFrame : null,
      sourceFile: frame.sourceFile,
      sha256: frame.sha256,
      width: avifInfo.width,
      height: avifInfo.height,
      avif: {
        file: relativeToRoot(avifPath),
        bytes: avifInfo.size,
      },
      webp: {
        file: relativeToRoot(webpPath),
        bytes: webpInfo.size,
      },
    };
  });
}

function profileStats(frames) {
  const avifBytes = frames.reduce((sum, frame) => sum + frame.avif.bytes, 0);
  const webpBytes = frames.reduce((sum, frame) => sum + frame.webp.bytes, 0);
  return {
    frameCount: frames.length,
    width: frames[0]?.width ?? null,
    height: frames[0]?.height ?? null,
    avifBytes,
    webpBytes,
    averageAvifBytes: frames.length ? Math.round(avifBytes / frames.length) : 0,
    averageWebpBytes: frames.length ? Math.round(webpBytes / frames.length) : 0,
  };
}

function qualityCheckIndices(frameCount) {
  if (frameCount === 0) return [];
  const candidates = [
    0,
    Math.round((frameCount - 1) * 0.25),
    Math.round((frameCount - 1) * 0.5),
    Math.round((frameCount - 1) * 0.75),
    frameCount - 1,
  ];
  return [...new Set(candidates)];
}

async function main() {
  console.log(`Input: ${inputDir}`);
  console.log(`Output: ${outputDir}`);

  const source = await collectSourceFrames();
  const frames = limit > 0 ? source.unique.slice(0, limit) : source.unique;

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const generatedProfiles = {};

  for (const profile of profiles) {
    console.log(`Encoding ${profile.name} profile (${profile.width}px)…`);
    const encodedFrames = await convertProfile(profile, frames);
    generatedProfiles[profile.name] = {
      composition: profile.composition,
      ...profileStats(encodedFrames),
      poster: encodedFrames[0] ?? null,
      completed: encodedFrames.at(-1) ?? null,
      qualityCheckIndices: qualityCheckIndices(encodedFrames.length),
      frames: encodedFrames,
    };
  }

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      directory: relativeToRoot(inputDir),
      width: source.width,
      height: source.height,
      inputFrameCount: source.filenames.length,
      uniqueConsecutiveFrameCount: source.unique.length,
      consecutiveDuplicatesRemoved: source.duplicates.length,
      processedFrameCount: frames.length,
      sourceBytes: source.sourceBytes,
      limitedSmokeRun: limit > 0,
    },
    encoding: {
      preferredFormat: "avif",
      fallbackFormat: "webp",
      avifQuality,
      webpQuality,
      note: "The website should select one delivery format per browser; do not download both frame sets.",
    },
    profiles: generatedProfiles,
    mobileNote:
      "The current mobile set is a resized desktop composition for prototype/performance testing only. Replace it with a dedicated mobile master when that source sequence is approved.",
  };

  await fs.writeFile(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  const desktop = generatedProfiles.desktop;
  const mobile = generatedProfiles.mobile;
  const summary = `# Hero frame artifact\n\n` +
    `- Source: \`${manifest.source.directory}\`\n` +
    `- Source dimensions: ${source.width}×${source.height}\n` +
    `- Input PNG frames: ${source.filenames.length}\n` +
    `- Unique consecutive frames: ${source.unique.length}\n` +
    `- Exact consecutive duplicates removed: ${source.duplicates.length}\n` +
    `- Frames encoded in this run: ${frames.length}${limit > 0 ? " (smoke limit)" : ""}\n` +
    `- Source PNG bytes: ${prettyBytes(source.sourceBytes)}\n\n` +
    `## Desktop\n\n` +
    `- ${desktop.width}×${desktop.height}\n` +
    `- AVIF q${avifQuality}: ${prettyBytes(desktop.avifBytes)} total, ${prettyBytes(desktop.averageAvifBytes)} average/frame\n` +
    `- WebP q${webpQuality}: ${prettyBytes(desktop.webpBytes)} total, ${prettyBytes(desktop.averageWebpBytes)} average/frame\n\n` +
    `## Mobile prototype\n\n` +
    `- ${mobile.width}×${mobile.height}\n` +
    `- AVIF q${avifQuality}: ${prettyBytes(mobile.avifBytes)} total, ${prettyBytes(mobile.averageAvifBytes)} average/frame\n` +
    `- WebP q${webpQuality}: ${prettyBytes(mobile.webpBytes)} total, ${prettyBytes(mobile.averageWebpBytes)} average/frame\n\n` +
    `The mobile profile is currently resized from the desktop composition and is not the final dedicated mobile master.\n`;

  await fs.writeFile(path.join(outputDir, "SUMMARY.md"), summary, "utf8");

  console.log(summary);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
