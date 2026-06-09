/**
 * state.js — จัดการตัวแปร Global และการดึงข้อมูลพื้นฐานจากหน้าจอ
 */

/* ── Meal Meta ── */
const MEAL_META = {
  breakfast: { label: 'เช้า',      icon: '☀️',  barColor: '#4A6FD4' },
  lunch:     { label: 'กลางวัน',   icon: '🌤',  barColor: '#1A2F6E' },
  dinner:    { label: 'เย็น',      icon: '🌙',  barColor: '#0A1535' },
};
const MEAL_KEYS = ['breakfast', 'lunch', 'dinner'];

/* ── State ── */
let activeMeal     = 'breakfast';
let accordionState = {};
let editingItemId  = null;

/* ── DOM Input Getters ── */
function getHotelInputs() {
  return {
    totalRooms:    parseFloat(document.getElementById('total-rooms')?.value)     || 80,
    occupancyRate: parseFloat(document.getElementById('occupancy-rate')?.value)  || 75,
    guestsPerRoom: parseFloat(document.getElementById('guests-per-room')?.value) || 1.8,
    bufferRate:    parseFloat(document.getElementById('buffer-rate')?.value)     || 5,
  };
}

/* ── Utilities ── */
function setText(id, text) { const el = document.getElementById(id); if(el) el.textContent = text; }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }