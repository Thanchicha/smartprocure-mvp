/**
 * i18n.js — SmartProcure Internationalisation
 * Supports Thai (th) and English (en).
 * Usage: changeLanguage('en') / changeLanguage('th')
 */

const DICT = {
  th: {
    /* Login */
    "login.subtitle": "Hotel Food Order Calculator",
    "login.credit": "by ปะการัง Supply",
    "login.heading": "เข้าสู่ระบบ",
    "login.subheading": "กรอกข้อมูลบัญชีผู้ใช้ของคุณ",
    "login.username": "Username",
    "login.password": "Password",
    "login.submit": "เข้าสู่ระบบ",
    "login.error": "Username หรือ Password ไม่ถูกต้อง",
    /* Navbar */
    "nav.tagline": "Hotel Food Order Calculator",
    "nav.logout": "ออกจากระบบ →",
    /* Dashboard */
    "dash.title": "Hotel Food Order Calculator",
    "dash.sub":
      "คำนวณยอดสั่งวัตถุดิบตามจำนวนผู้เข้าพัก — แม่นยำ ±5% ลดของเหลือ",
    "dash.hotelInfo": "ข้อมูลโรงแรม",
    "dash.totalRooms": "จำนวนห้องทั้งหมด",
    "dash.occupancy": "Occupancy Rate (%)",
    "dash.guestsPerRoom": "ผู้เข้าพัก / ห้อง",
    "dash.buffer": "Buffer เผื่อขาด",
    "dash.selectMeal": "เลือกมื้ออาหาร",
    "dash.breakfast": "เช้า (Breakfast)",
    "dash.lunch": "กลางวัน (Lunch)",
    "dash.dinner": "เย็น (Dinner)",
    "dash.cardGuests": "ผู้รับประทานมื้อนี้",
    "dash.cardBase": "ฐานที่ต้องการ",
    "dash.cardRec": "แนะนำสั่ง (+5%)",
    "dash.cardCost": "ค่าใช้จ่ายมื้อนี้",
    "dash.unitPerson": "คน",
    "dash.unitKg": "กก.",
    "dash.ingredients": "รายการวัตถุดิบ",
    "dash.export": "↓ Export CSV",
    "dash.empty": "ยังไม่มีรายการ กรุณาเพิ่มวัตถุดิบด้านล่าง",
    "dash.newName": "ชื่อวัตถุดิบ",
    "dash.newCat": "หมวดหมู่",
    "dash.newGrams": "กรัม/คน",
    "dash.newPrice": "ราคา/กก. (฿)",
    "dash.addBtn": "+ เพิ่มรายการ",
    "dash.dailySummary": "สรุปทั้งวัน",
    "dash.chartBar": "กก. น้ำหนักรวม แยกมื้อ",
    "dash.chartPie": "สัดส่วนหมวดหมู่รวมทั้งวัน",
    "dash.footer":
      "SmartProcure © 2024 by ปะการัง Supply — สูตร: (กรัม/คน × ผู้รับประทาน / 1000) × (1 + Buffer%)",
    /* Table Headers */
    "th.name": "วัตถุดิบ",
    "th.category": "หมวด",
    "th.grams": "กรัม/คน",
    "th.base": "ฐาน (กก.)",
    "th.rec": "แนะนำสั่ง (กก.)",
    "th.buffer": "% เผื่อ",
    "th.price": "ราคา/กก. (฿)",
    "th.cost": "ค่าใช้จ่าย (฿)",
    /* Meal labels */
    "meal.breakfast": "เช้า",
    "meal.lunch": "กลางวัน",
    "meal.dinner": "เย็น",
    "meal.total": "รวมทั้งวัน",
  },
  en: {
    /* Login */
    "login.subtitle": "Hotel Food Order Calculator",
    "login.credit": "by Pakarang Supply",
    "login.heading": "Sign In",
    "login.subheading": "Enter your account credentials",
    "login.username": "Username",
    "login.password": "Password",
    "login.submit": "Sign In",
    "login.error": "Incorrect username or password",
    /* Navbar */
    "nav.tagline": "Hotel Food Order Calculator",
    "nav.logout": "Sign Out →",
    /* Dashboard */
    "dash.title": "Hotel Food Order Calculator",
    "dash.sub":
      "Calculate ingredient orders by occupancy — Accurate ±5%, reduce waste",
    "dash.hotelInfo": "Hotel Information",
    "dash.totalRooms": "Total Rooms",
    "dash.occupancy": "Occupancy Rate (%)",
    "dash.guestsPerRoom": "Guests / Room",
    "dash.buffer": "Safety Buffer",
    "dash.selectMeal": "Select Meal",
    "dash.breakfast": "Breakfast",
    "dash.lunch": "Lunch",
    "dash.dinner": "Dinner",
    "dash.cardGuests": "Diners This Meal",
    "dash.cardBase": "Base Required",
    "dash.cardRec": "Recommended Order (+5%)",
    "dash.cardCost": "Meal Cost",
    "dash.unitPerson": "persons",
    "dash.unitKg": "kg",
    "dash.ingredients": "Ingredient List",
    "dash.export": "↓ Export CSV",
    "dash.empty": "No items yet. Add ingredients below.",
    "dash.newName": "Ingredient Name",
    "dash.newCat": "Category",
    "dash.newGrams": "g / person",
    "dash.newPrice": "Price / kg (฿)",
    "dash.addBtn": "+ Add Item",
    "dash.dailySummary": "Daily Summary",
    "dash.chartBar": "Total kg by Meal",
    "dash.chartPie": "Category Breakdown (All Meals)",
    "dash.footer":
      "SmartProcure © 2024 by Pakarang Supply — Formula: (g/person × diners / 1000) × (1 + Buffer%)",
    /* Table Headers */
    "th.name": "Ingredient",
    "th.category": "Category",
    "th.grams": "g / person",
    "th.base": "Base (kg)",
    "th.rec": "Order (kg)",
    "th.buffer": "Buffer %",
    "th.price": "Price/kg (฿)",
    "th.cost": "Cost (฿)",
    /* Meal labels */
    "meal.breakfast": "Breakfast",
    "meal.lunch": "Lunch",
    "meal.dinner": "Dinner",
    "meal.total": "All Day",
  },
};

// ── State ──────────────────────────────────────────────────
let currentLang = localStorage.getItem("sp_lang") || "th";

// ── Core ───────────────────────────────────────────────────
function t(key) {
  return (
    (DICT[currentLang] && DICT[currentLang][key]) || DICT["th"][key] || key
  );
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  // Update html lang attr
  document.documentElement.lang = currentLang;
  // Update lang button label (show opposite)
  const btn = document.getElementById("lang-btn");
  if (btn) btn.textContent = currentLang === "th" ? "EN" : "TH";
}

function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("sp_lang", lang);
  applyTranslations();
  // Let dashboard re-render dynamic content if loaded
  if (typeof recalculate === "function") recalculate();
}

function toggleLang() {
  changeLanguage(currentLang === "th" ? "en" : "th");
}

// ── Auto-apply on load ────────────────────────────────────
document.addEventListener("DOMContentLoaded", applyTranslations);
