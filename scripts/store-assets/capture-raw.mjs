import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const captureDir = path.join(root, "assets/store/captures");
const states = JSON.parse(
  readFileSync(path.join(captureDir, "states.json"), "utf8")
);
const baseUrl = process.env.STORE_CAPTURE_BASE_URL ?? "http://localhost:3001";

mkdirSync(captureDir, { recursive: true });

async function seedIndexedDB(page, seed) {
  if (!seed) return;
  await page.evaluate(async (dbSeed) => {
    await new Promise((resolve, reject) => {
      const deleteReq = indexedDB.deleteDatabase(dbSeed.name);
      deleteReq.onerror = () => reject(deleteReq.error);
      deleteReq.onsuccess = () => resolve();
      deleteReq.onblocked = () => resolve();
    });

    const db = await new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbSeed.name, dbSeed.version);
      openReq.onupgradeneeded = () => {
        const db = openReq.result;
        for (const [storeName, storeConfig] of Object.entries(dbSeed.stores)) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, {
              keyPath: storeConfig.keyPath,
            });
            for (const index of storeConfig.indexes ?? []) {
              store.createIndex(index.name, index.keyPath);
            }
          }
        }
      };
      openReq.onerror = () => reject(openReq.error);
      openReq.onsuccess = () => resolve(openReq.result);
    });

    await Promise.all(
      Object.entries(dbSeed.stores).map(
        ([storeName, storeConfig]) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            for (const record of storeConfig.records) {
              store.put(record);
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          })
      )
    );
    db.close();
  }, seed);
}

async function applyState(page, state) {
  await page.goto(`${baseUrl}/__store-capture-seed__`, { waitUntil: "domcontentloaded" });
  await page.evaluate((storage) => {
    localStorage.clear();
    for (const [key, value] of Object.entries(storage.localStorage)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, state.storage);
  await seedIndexedDB(page, state.indexedDB);
  await page.goto(`${baseUrl}${state.route}`, { waitUntil: "networkidle" });

  for (const action of state.actions ?? []) {
    if (action.type === "click" && action.target?.role === "button") {
      await page.getByRole("button", { name: action.target.name }).click();
      await page.getByRole("heading", { name: action.target.name }).waitFor({
        state: "visible",
        timeout: 5000,
      });
    }
  }
}

const browser = await chromium.launch({ headless: true });
try {
  for (const state of states) {
    const page = await browser.newPage({
      viewport: state.viewport,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    await applyState(page, state);
    await page.screenshot({
      path: path.join(captureDir, `${state.id}.png`),
      fullPage: false,
      omitBackground: false,
    });
    await page.close();
    console.log(`Captured ${state.id}.png`);
  }
} finally {
  await browser.close();
}
