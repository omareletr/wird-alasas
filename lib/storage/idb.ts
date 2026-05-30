/**
 * Typed IndexedDB helpers using idb v8.
 * Guards against SSR — all operations are no-ops when window is unavailable.
 */

import type { DBSchema, IDBPDatabase } from "idb";
import type { DailyRecord } from "./schema";

interface WirdDB extends DBSchema {
  "daily-records": {
    key: string;
    value: DailyRecord;
    indexes: { "by-dayKey": string };
  };
}

const DB_NAME = "wird-alasas";
const DB_VERSION = 1;

/** Singleton promise — avoids re-opening the DB on every call. */
let dbPromise: Promise<IDBPDatabase<WirdDB>> | null = null;

function getDB(): Promise<IDBPDatabase<WirdDB>> | null {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    // Lazy import to avoid bundling idb in SSR paths
    dbPromise = import("idb").then(({ openDB }) =>
      openDB<WirdDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          const store = db.createObjectStore("daily-records", {
            keyPath: "dayKey",
          });
          store.createIndex("by-dayKey", "dayKey");
        },
      })
    );
  }
  return dbPromise;
}

/** Upsert a daily record. Returns the dayKey of the stored record. */
export async function addDailyRecord(record: DailyRecord): Promise<string> {
  const db = getDB();
  if (!db) return record.dayKey;
  return (await db).put("daily-records", record);
}

/** Return all archived daily records, unordered. */
export async function getAllDailyRecords(): Promise<DailyRecord[]> {
  const db = getDB();
  if (!db) return [];
  return (await db).getAll("daily-records");
}

/** Return a single daily record by dayKey, or undefined if not found. */
export async function getDailyRecord(
  dayKey: string
): Promise<DailyRecord | undefined> {
  const db = getDB();
  if (!db) return undefined;
  return (await db).get("daily-records", dayKey);
}
