const LOG_KEY = "mottazen_notify_sent";

interface SentEntry {
  date: string;
  tags: string[];
}

function readLog(): SentEntry {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return { date: "", tags: [] };
    return JSON.parse(raw) as SentEntry;
  } catch {
    return { date: "", tags: [] };
  }
}

function writeLog(entry: SentEntry) {
  localStorage.setItem(LOG_KEY, JSON.stringify(entry));
}

export function getSentTagsToday(dateKey: string): Set<string> {
  const log = readLog();
  if (log.date !== dateKey) return new Set();
  return new Set(log.tags);
}

export function markTagSent(dateKey: string, tag: string) {
  const log = readLog();
  if (log.date !== dateKey) {
    writeLog({ date: dateKey, tags: [tag] });
    return;
  }
  if (log.tags.includes(tag)) return;
  writeLog({ date: dateKey, tags: [...log.tags, tag] });
}

export function clearNotifyLog() {
  localStorage.removeItem(LOG_KEY);
}
