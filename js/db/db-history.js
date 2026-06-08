/**
 * db-history.js — SmartProcure Order History (MVP stub)
 * Manages order history via localStorage key 'sp_history_v1'
 *
 * Record schema:
 * {
 *   date: String,           // ISO date string
 *   meal: String,           // 'breakfast' | 'lunch' | 'dinner'
 *   totalGuests: Number,
 *   orderedItems: Array<{ id, name, kgOrdered, cost }>
 * }
 */

const DB_HISTORY_KEY = 'sp_history_v1';

function getAllHistory() {
  try { return JSON.parse(localStorage.getItem(DB_HISTORY_KEY)) || []; }
  catch { return []; }
}

function addHistoryRecord(record) {
  const history = getAllHistory();
  history.unshift(record); // newest first
  localStorage.setItem(DB_HISTORY_KEY, JSON.stringify(history));
}

function clearHistory() {
  localStorage.removeItem(DB_HISTORY_KEY);
}
