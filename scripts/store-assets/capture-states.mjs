import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const captureDir = path.join(root, "assets/store/captures");
mkdirSync(captureDir, { recursive: true });

const viewport = { width: 390, height: 844 };
const route = "/";

const settings = {
  state: {
    resetHour: 5,
    hasOnboarded: true,
    feedbackMode: "haptic",
  },
  version: 5,
};

const theme = {
  state: {
    theme: "dark",
  },
  version: 0,
};

const session = ({
  activeIndex,
  counts,
  mode = "shortened",
  sessionStartedAt = 1780387200000,
}) => ({
  state: {
    counts,
    mode,
    sessionStartedAt,
    activeIndex,
  },
  version: 1,
});

const storage = (sessionState) => ({
  localStorage: {
    "wird-settings": settings,
    "wird-session": sessionState,
    "wird-theme": theme,
  },
});

const historyRecords = [
  ["2026-05-25", { 0: 20, 1: 20, 2: 10, 3: 10 }],
  ["2026-05-26", { 0: 20, 1: 20, 2: 10, 3: 10 }],
  ["2026-05-27", { 0: 20, 1: 20, 2: 10, 3: 10 }],
  ["2026-05-28", { 0: 20, 1: 12, 2: 0, 3: 0 }],
  ["2026-05-29", { 0: 20, 1: 20, 2: 10, 3: 10 }],
  ["2026-05-30", { 0: 20, 1: 20, 2: 10, 3: 10 }],
  ["2026-05-31", { 0: 20, 1: 20, 2: 10, 3: 10 }],
  ["2026-06-01", { 0: 12, 1: 7, 2: 0, 3: 0 }],
].map(([dayKey, counts], index) => ({
  dayKey,
  counts,
  mode: "shortened",
  completedAt: Date.UTC(2026, 4, 25 + index, 12, 0, 0),
}));

const indexedDBSeed = {
  name: "wird-alasas",
  version: 1,
  stores: {
    "daily-records": {
      keyPath: "dayKey",
      indexes: [{ name: "by-dayKey", keyPath: "dayKey" }],
      records: historyRecords,
    },
  },
};

const states = [
  {
    id: "daily-wird-counter",
    route,
    viewport,
    description: "Main counter with the first dhikr active and partial progress.",
    storage: storage(
      session({
        activeIndex: 0,
        counts: { 0: 7, 1: 0, 2: 0, 3: 0 },
      })
    ),
  },
  {
    id: "progress-completion",
    route,
    viewport,
    description: "Counter near completion to show progress and achievement.",
    storage: storage(
      session({
        activeIndex: 3,
        counts: { 0: 20, 1: 20, 2: 10, 3: 8 },
      })
    ),
  },
  {
    id: "four-adhkar-flow",
    route,
    viewport,
    description: "Later dhikr card active to show the four-part flow.",
    storage: storage(
      session({
        activeIndex: 2,
        counts: { 0: 20, 1: 14, 2: 4, 3: 0 },
      })
    ),
  },
  {
    id: "history-streaks",
    route,
    viewport,
    description: "History sheet open with streak and calendar activity visible.",
    storage: storage(
      session({
        activeIndex: 0,
        counts: { 0: 12, 1: 7, 2: 0, 3: 0 },
      })
    ),
    indexedDB: indexedDBSeed,
    actions: [
      {
        type: "click",
        target: { role: "button", name: "History" },
        description: "Open the History sheet after localStorage injection and reload.",
      },
    ],
  },
  {
    id: "reset-settings",
    route,
    viewport,
    description: "Settings sheet open to show mode, feedback, and daily reset time.",
    storage: storage(
      session({
        activeIndex: 0,
        counts: { 0: 5, 1: 0, 2: 0, 3: 0 },
      })
    ),
    actions: [
      {
        type: "click",
        target: { role: "button", name: "Settings" },
        description: "Open the Settings sheet after localStorage injection and reload.",
      },
    ],
  },
];

writeFileSync(path.join(captureDir, "states.json"), JSON.stringify(states, null, 2));
console.log(`Wrote ${states.length} capture states to assets/store/captures/states.json`);
