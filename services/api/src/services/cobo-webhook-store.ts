export interface CoboWebhookRecord {
  id: string;
  receivedAt: string;
  channel: "webhook" | "callback";
  environment: string;
  eventType?: string;
  payload: unknown;
}

const MAX_RECORDS = 100;
const records: CoboWebhookRecord[] = [];

export function appendCoboWebhookRecord(record: Omit<CoboWebhookRecord, "id" | "receivedAt">): CoboWebhookRecord {
  const entry: CoboWebhookRecord = {
    id: `cobo-${Date.now()}-${records.length + 1}`,
    receivedAt: new Date().toISOString(),
    ...record
  };

  records.unshift(entry);
  if (records.length > MAX_RECORDS) {
    records.length = MAX_RECORDS;
  }

  return entry;
}

export function listCoboWebhookRecords(limit = 20): CoboWebhookRecord[] {
  return records.slice(0, limit);
}
