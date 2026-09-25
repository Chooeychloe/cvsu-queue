// Formats a sequence number into a queue code, e.g. ("REG-", 7) -> "REG-007"
export function formatQueueCode(prefix, sequenceNo) {
  return `${prefix}${String(sequenceNo).padStart(3, '0')}`;
}

// Returns today's date as YYYY-MM-DD (used to scope daily sequence numbers)
export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}
