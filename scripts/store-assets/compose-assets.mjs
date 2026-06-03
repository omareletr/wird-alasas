import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const storeDir = path.join(root, "assets/store");
const captureDir = path.join(storeDir, "captures");
const appStoreDir = path.join(storeDir, "app-store");
const googleDir = path.join(storeDir, "google-play");
const iconDir = path.join(storeDir, "icon");

for (const dir of [appStoreDir, googleDir, iconDir]) {
  mkdirSync(dir, { recursive: true });
}

const APPLE_SCREEN = { width: 1320, height: 2868 };
const GOOGLE_SCREEN = { width: 1080, height: 1920 };
const FEATURE = { width: 1024, height: 500 };
const ICON_MASTER = { width: 1024, height: 1024 };
const GOOGLE_ICON = { width: 512, height: 512 };

const COLORS = {
  cream: "#f4efe2",
  creamDeep: "#e7dcc6",
  ink: "#171512",
  muted: "#756b5f",
  amber: "#a86820",
  gold: "#c48a3b",
  black: "#050505",
  white: "#fffaf0",
};

const FONT_ARABIC = "Kufyan Arabic, KufiStandardGK, Geeza Pro, serif";
const FONT_LATIN = "IBM Plex Sans, Helvetica Neue, Arial, sans-serif";
const FONT_MONO = "Geist Mono, Menlo, monospace";

const screenshots = [
  {
    id: "daily-wird-counter",
    title: "Begin the daily wird",
    subtitle: "A quiet counter for the four adhkar.",
    apple: "01-daily-wird-counter-1320x2868.png",
    google: "01-daily-wird-counter-1080x1920.png",
    alt: "Daily wird counter showing partial progress on the first dhikr.",
    accent: true,
  },
  {
    id: "progress-completion",
    title: "See every count clearly",
    subtitle: "Progress stays centered and calm.",
    apple: "02-progress-completion-1320x2868.png",
    google: "02-progress-completion-1080x1920.png",
    alt: "Counter screen showing progress near completion across the daily adhkar.",
  },
  {
    id: "four-adhkar-flow",
    title: "Move through four adhkar",
    subtitle: "Swipe between each remembrance.",
    apple: "03-four-adhkar-flow-1320x2868.png",
    google: "03-four-adhkar-flow-1080x1920.png",
    alt: "Dhikr card screen showing the third remembrance in the four-part wird flow.",
  },
  {
    id: "history-streaks",
    title: "Keep a gentle history",
    subtitle: "Streaks and activity stay private on-device.",
    apple: "04-history-streaks-1320x2868.png",
    google: "04-history-streaks-1080x1920.png",
    alt: "History sheet showing current streak, longest streak, and activity calendar.",
  },
  {
    id: "reset-settings",
    title: "Set your daily rhythm",
    subtitle: "Choose reset time, mode, and feedback.",
    apple: "05-reset-settings-1320x2868.png",
    google: "05-reset-settings-1080x1920.png",
    alt: "Settings sheet showing mode, feedback, and daily reset time controls.",
  },
];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function dataUri(file) {
  return `data:image/png;base64,${readFileSync(file).toString("base64")}`;
}

function kuficGrid(x, y, cols, rows, cell, color = COLORS.gold, opacity = 0.24) {
  const blocks = [];
  const pattern = [
    [0, 0], [1, 0], [2, 0], [4, 0], [5, 0], [7, 0], [8, 0],
    [0, 1], [2, 1], [4, 1], [7, 1],
    [0, 2], [1, 2], [2, 2], [4, 2], [5, 2], [7, 2], [8, 2],
    [2, 3], [4, 3], [8, 3],
    [0, 4], [1, 4], [2, 4], [4, 4], [5, 4], [6, 4], [8, 4],
  ];
  for (const [cx, cy] of pattern) {
    if (cx < cols && cy < rows) {
      blocks.push(`<rect x="${x + cx * cell}" y="${y + cy * cell}" width="${cell * 0.82}" height="${cell * 0.82}" fill="${color}" opacity="${opacity}"/>`);
    }
  }
  return blocks.join("");
}

function iconSvg({ width, height, alpha = false }) {
  const bg = alpha ? "transparent" : COLORS.ink;
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${bg}"/>
    <rect x="${width * 0.075}" y="${height * 0.075}" width="${width * 0.85}" height="${height * 0.85}" fill="${COLORS.cream}" opacity="${alpha ? 0.98 : 1}"/>
    <g opacity="0.16">${kuficGrid(width * 0.13, height * 0.13, 9, 5, width * 0.077, COLORS.amber, 1)}</g>
    <text x="${width / 2}" y="${height * 0.45}" direction="rtl" text-anchor="middle"
      font-family="${FONT_ARABIC}" font-size="${width * 0.18}" font-weight="900" fill="${COLORS.ink}"
      style="letter-spacing:0">الورد</text>
    <text x="${width / 2}" y="${height * 0.64}" direction="rtl" text-anchor="middle"
      font-family="${FONT_ARABIC}" font-size="${width * 0.165}" font-weight="900" fill="${COLORS.ink}"
      style="letter-spacing:0">الأساس</text>
    <rect x="${width * 0.255}" y="${height * 0.71}" width="${width * 0.49}" height="${width * 0.035}" fill="${COLORS.amber}"/>
    <rect x="${width * 0.72}" y="${height * 0.71}" width="${width * 0.045}" height="${width * 0.035}" fill="${COLORS.amber}"/>
  </svg>`;
}

function screenshotSvg({ width, height, captureFile, title, subtitle, accent = false }) {
  const phoneW = Math.round(width * (width > 1100 ? 0.72 : 0.7));
  const phoneH = Math.round(phoneW * (2532 / 1170));
  const phoneX = Math.round((width - phoneW) / 2);
  const phoneY = Math.round(height - phoneH - height * 0.065);
  const radius = Math.round(phoneW * 0.09);
  const capture = dataUri(captureFile);
  const titleY = Math.round(height * 0.1);
  const subY = Math.round(titleY + height * 0.055);
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="screenClip"><rect x="${phoneX + 18}" y="${phoneY + 18}" width="${phoneW - 36}" height="${phoneH - 36}" rx="${radius - 12}" ry="${radius - 12}"/></clipPath>
    </defs>
    <rect width="${width}" height="${height}" fill="${COLORS.cream}"/>
    <rect y="${height * 0.72}" width="${width}" height="${height * 0.28}" fill="${COLORS.creamDeep}" opacity="0.5"/>
    ${accent ? `<g transform="translate(${Math.round(width * 0.06)} ${Math.round(height * 0.04)})">${kuficGrid(0, 0, 9, 5, Math.round(width * 0.035), COLORS.amber, 0.18)}</g>` : ""}
    <text x="${width / 2}" y="${titleY}" text-anchor="middle" font-family="${FONT_LATIN}" font-size="${Math.round(width * 0.065)}" font-weight="500" fill="${COLORS.ink}">${esc(title)}</text>
    <text x="${width / 2}" y="${subY}" text-anchor="middle" font-family="${FONT_LATIN}" font-size="${Math.round(width * 0.032)}" fill="${COLORS.muted}">${esc(subtitle)}</text>
    <rect x="${phoneX}" y="${phoneY}" width="${phoneW}" height="${phoneH}" rx="${radius}" fill="${COLORS.black}"/>
    <rect x="${phoneX + 10}" y="${phoneY + 10}" width="${phoneW - 20}" height="${phoneH - 20}" rx="${radius - 6}" fill="${COLORS.black}" stroke="${COLORS.ink}" stroke-width="2"/>
    <image href="${capture}" x="${phoneX + 18}" y="${phoneY + 18}" width="${phoneW - 36}" height="${phoneH - 36}" preserveAspectRatio="xMidYMid slice" clip-path="url(#screenClip)"/>
  </svg>`;
}

function featureSvg() {
  const capture = dataUri(path.join(captureDir, "daily-wird-counter.png"));
  return `
  <svg width="${FEATURE.width}" height="${FEATURE.height}" viewBox="0 0 ${FEATURE.width} ${FEATURE.height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="featurePhone"><rect x="754" y="64" width="190" height="411" rx="32"/></clipPath>
    </defs>
    <rect width="${FEATURE.width}" height="${FEATURE.height}" fill="${COLORS.cream}"/>
    <rect x="0" y="0" width="1024" height="500" fill="${COLORS.creamDeep}" opacity="0.34"/>
    <g transform="translate(42 42)">${kuficGrid(0, 0, 9, 5, 34, COLORS.amber, 0.2)}</g>
    <text x="86" y="198" font-family="${FONT_LATIN}" font-size="58" font-weight="500" fill="${COLORS.ink}">Wird Al-Asas</text>
    <text x="88" y="258" font-family="${FONT_LATIN}" font-size="25" fill="${COLORS.muted}">A quiet counter for your daily adhkar.</text>
    <text x="352" y="314" direction="rtl" text-anchor="end" font-family="${FONT_ARABIC}" font-size="42" font-weight="900" fill="${COLORS.amber}">الورد الأساس</text>
    <rect x="732" y="42" width="234" height="456" rx="46" fill="${COLORS.black}"/>
    <image href="${capture}" x="754" y="64" width="190" height="411" preserveAspectRatio="xMidYMid slice" clip-path="url(#featurePhone)"/>
  </svg>`;
}

async function pngFromSvg(svg, output, { width, height, alpha = false } = {}) {
  let image = sharp(Buffer.from(svg));
  if (width && height) image = image.resize(width, height);
  if (alpha) {
    await image.png().toFile(output);
  } else {
    await image.flatten({ background: COLORS.cream }).png().toFile(output);
  }
}

async function writeIcons() {
  await pngFromSvg(iconSvg({ ...ICON_MASTER, alpha: false }), path.join(iconDir, "icon-master-1024.png"), { alpha: false });
  await pngFromSvg(iconSvg({ ...ICON_MASTER, alpha: false }), path.join(appStoreDir, "app-icon-1024.png"), { alpha: false });
  await pngFromSvg(iconSvg({ ...GOOGLE_ICON, alpha: true }), path.join(googleDir, "app-icon-512.png"), { alpha: true });
  await pngFromSvg(iconSvg({ ...GOOGLE_ICON, alpha: true }), path.join(iconDir, "maskable-512.png"), { alpha: true });
}

async function writeScreenshots() {
  for (const shot of screenshots) {
    const captureFile = path.join(captureDir, `${shot.id}.png`);
    await pngFromSvg(
      screenshotSvg({ ...APPLE_SCREEN, captureFile, title: shot.title, subtitle: shot.subtitle, accent: shot.accent }),
      path.join(appStoreDir, shot.apple),
      { alpha: false }
    );
    await pngFromSvg(
      screenshotSvg({ ...GOOGLE_SCREEN, captureFile, title: shot.title, subtitle: shot.subtitle, accent: shot.accent }),
      path.join(googleDir, shot.google),
      { alpha: false }
    );
  }
}

async function writeFeature() {
  await pngFromSvg(featureSvg(), path.join(googleDir, "feature-graphic-1024x500.png"), { alpha: false });
}

function manifestRows() {
  const rows = [
    ["assets/store/icon/icon-master-1024.png", "Shared", "Master icon source", ""],
    ["assets/store/icon/maskable-512.png", "Android/PWA", "Maskable icon support", ""],
    ["assets/store/app-store/app-icon-1024.png", "Apple", "App icon", ""],
    ["assets/store/google-play/app-icon-512.png", "Google Play", "App icon", ""],
    ["assets/store/google-play/feature-graphic-1024x500.png", "Google Play", "Feature graphic", "Wird Al-Asas feature graphic with phone preview and Kufic accent."],
  ];
  for (const shot of screenshots) {
    rows.push([`assets/store/app-store/${shot.apple}`, "Apple", "iPhone screenshot", ""]);
    rows.push([`assets/store/google-play/${shot.google}`, "Google Play", "Phone screenshot", shot.alt]);
  }
  return rows;
}

async function imageInfo(file) {
  const metadata = await sharp(file).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha === true,
    size: statSync(file).size,
  };
}

async function writeManifest() {
  const preflightPath = path.join(storeDir, "preflight.json");
  const preflight = JSON.parse(readFileSync(preflightPath, "utf8"));
  const lines = [
    "# Store Asset Manifest",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Preflight",
    "",
    `- Phone-only status: ${preflight.phoneOnlyStatus ?? preflight.status}`,
    `- Status: ${preflight.status}`,
    `- Blockers: ${preflight.blockers?.length ? preflight.blockers.join("; ") : "none"}`,
    "",
    "## Assets",
    "",
    "| Path | Target | Upload location | Dimensions | Format | Alpha | Size | Google Play alt text |",
    "|---|---|---|---:|---|---|---:|---|",
  ];

  for (const [relativePath, target, upload, alt] of manifestRows()) {
    const absolutePath = path.join(root, relativePath);
    const info = await imageInfo(absolutePath);
    lines.push(
      `| \`${relativePath}\` | ${target} | ${upload} | ${info.width}x${info.height} | ${info.format} | ${info.hasAlpha ? "yes" : "no"} | ${info.size} bytes | ${alt ? esc(alt) : ""} |`
    );
  }

  lines.push(
    "",
    "## Validation Notes",
    "",
    "- Run `node scripts/store-assets/validate-assets.mjs` before upload.",
    "- Apple upload readiness remains blocked until the iOS iPhone-only/iPad screenshot preflight blocker is resolved.",
  );

  writeFileSync(path.join(storeDir, "ASSET_MANIFEST.md"), `${lines.join("\n")}\n`);
}

await writeIcons();
await writeScreenshots();
await writeFeature();
await writeManifest();

console.log("Composed store assets into assets/store/");
