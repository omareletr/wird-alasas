import { existsSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const oneKb = 1024;

const required = [
  {
    path: "assets/store/icon/icon-master-1024.png",
    width: 1024,
    height: 1024,
    format: "png",
    alpha: false,
  },
  {
    path: "assets/store/icon/maskable-512.png",
    width: 512,
    height: 512,
    format: "png",
  },
  {
    path: "assets/store/app-store/app-icon-1024.png",
    width: 1024,
    height: 1024,
    format: "png",
    alpha: false,
  },
  {
    path: "assets/store/google-play/app-icon-512.png",
    width: 512,
    height: 512,
    format: "png",
    alpha: true,
    maxBytes: 1024 * oneKb,
  },
  {
    path: "assets/store/google-play/feature-graphic-1024x500.png",
    width: 1024,
    height: 500,
    format: "png",
    alpha: false,
  },
];

for (const [index, name] of [
  "daily-wird-counter",
  "progress-completion",
  "four-adhkar-flow",
  "history-streaks",
  "reset-settings",
].entries()) {
  const number = String(index + 1).padStart(2, "0");
  required.push({
    path: `assets/store/app-store/${number}-${name}-1320x2868.png`,
    width: 1320,
    height: 2868,
    format: "png",
    alpha: false,
  });
  required.push({
    path: `assets/store/google-play/${number}-${name}-1080x1920.png`,
    width: 1080,
    height: 1920,
    format: "png",
    alpha: false,
  });
}

const failures = [];

function record(ok, label, detail) {
  if (ok) {
    console.log(`PASS ${label}`);
  } else {
    failures.push(`${label}: ${detail}`);
    console.log(`FAIL ${label}: ${detail}`);
  }
}

for (const asset of required) {
  const absolutePath = path.join(root, asset.path);
  record(existsSync(absolutePath), asset.path, "missing");
  if (!existsSync(absolutePath)) continue;

  const metadata = await sharp(absolutePath).metadata();
  const size = statSync(absolutePath).size;
  record(metadata.width === asset.width, `${asset.path} width`, `${metadata.width} !== ${asset.width}`);
  record(metadata.height === asset.height, `${asset.path} height`, `${metadata.height} !== ${asset.height}`);
  record(metadata.format === asset.format, `${asset.path} format`, `${metadata.format} !== ${asset.format}`);

  if (asset.alpha === false) {
    record(metadata.hasAlpha !== true, `${asset.path} no alpha`, "has alpha channel");
    record(metadata.channels === 3, `${asset.path} 24-bit RGB`, `${metadata.channels} channels`);
  }

  if (asset.alpha === true) {
    record(metadata.hasAlpha === true, `${asset.path} alpha channel`, "missing alpha channel");
    record(metadata.channels === 4, `${asset.path} 32-bit RGBA`, `${metadata.channels} channels`);
  }

  if (asset.maxBytes) {
    record(size <= asset.maxBytes, `${asset.path} max size`, `${size} > ${asset.maxBytes}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} validation failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`\nPASS all ${required.length} required assets`);
