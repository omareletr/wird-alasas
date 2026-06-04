import type { DailyRecord } from "@/lib/storage/schema";

export function mergeDisplayRecords(
  archivedRecords: DailyRecord[],
  liveRecord: DailyRecord
): DailyRecord[] {
  const recordsByDay = new Map(archivedRecords.map((record) => [record.dayKey, record]));
  recordsByDay.set(liveRecord.dayKey, liveRecord);
  return Array.from(recordsByDay.values()).sort((a, b) =>
    a.dayKey < b.dayKey ? -1 : a.dayKey > b.dayKey ? 1 : 0
  );
}
