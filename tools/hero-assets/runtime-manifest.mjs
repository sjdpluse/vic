import { promises as fs } from "node:fs";
import path from "node:path";

const [sourceArg = "artifacts/hero-sequence/manifest.json", outputArg = "artifacts/hero-sequence/runtime-manifest.json"] = process.argv.slice(2);
const sourcePath = path.resolve(sourceArg);
const outputPath = path.resolve(outputArg);
const manifest = JSON.parse(await fs.readFile(sourcePath, "utf8"));

function toTimeline(profileName, preloadRadius) {
  const profile = manifest.profiles[profileName];
  const unique = profile.frames;
  const timeline = [];

  for (let ordinal = 1; ordinal <= manifest.source.inputFrameCount; ordinal += 1) {
    let uniqueIndex = 0;
    for (let index = 0; index < unique.length; index += 1) {
      if (unique[index].sourceOrdinal <= ordinal) uniqueIndex = index;
      else break;
    }

    const frame = unique[uniqueIndex];
    const filename = `frame-${String(frame.sequenceNumber).padStart(4, "0")}`;
    timeline.push({
      index: ordinal - 1,
      sourceFrame: ordinal,
      sourceOrdinal: ordinal,
      sources: {
        avif: `${profileName}/avif/${filename}.avif`,
        webp: `${profileName}/webp/${filename}.webp`,
      },
    });
  }

  return {
    frameCount: timeline.length,
    preloadRadius,
    frames: timeline,
  };
}

const runtimeManifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  source: {
    dimensions: {
      width: manifest.source.width,
      height: manifest.source.height,
    },
    inputFrameCount: manifest.source.inputFrameCount,
    uniqueConsecutiveFrameCount: manifest.source.uniqueConsecutiveFrameCount,
  },
  profiles: {
    desktop: toTimeline("desktop", 18),
    mobile: toTimeline("mobile", 8),
  },
};

await fs.writeFile(outputPath, `${JSON.stringify(runtimeManifest, null, 2)}\n`, "utf8");
console.log(`Wrote runtime manifest with ${runtimeManifest.profiles.desktop.frameCount} desktop and ${runtimeManifest.profiles.mobile.frameCount} mobile timeline positions.`);
