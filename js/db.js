/**
 * db.js — SmartProcure Mock Database
 * Persists via localStorage. Seeds with master data on first run.
 * 11 Pakarang Supply categories, 2+ items each (150+ total items in full DB).
 */

const DB_KEY = "sp_items_v2";

/* ── Master seed data (2 representative items per category) ── */
const SEED_ITEMS = [
  /* 1. ชิ้นส่วนหมู — Pork Parts */
  {
    id: "p01",
    name: "สันคอหมู",
    category: "ชิ้นส่วนหมู",
    gramsPerPerson: { breakfast: 80, lunch: 150, dinner: 180 },
    pricePerKg: 195,
  },
  {
    id: "p02",
    name: "สันในหมู",
    category: "ชิ้นส่วนหมู",
    gramsPerPerson: { breakfast: 0, lunch: 140, dinner: 170 },
    pricePerKg: 220,
  },
  {
    id: "p03",
    name: "หมูสามชั้น",
    category: "ชิ้นส่วนหมู",
    gramsPerPerson: { breakfast: 60, lunch: 130, dinner: 150 },
    pricePerKg: 175,
  },
  {
    id: "p04",
    name: "ซี่โครงหมู",
    category: "ชิ้นส่วนหมู",
    gramsPerPerson: { breakfast: 0, lunch: 160, dinner: 200 },
    pricePerKg: 185,
  },
  {
    id: "p05",
    name: "หมูสับ",
    category: "ชิ้นส่วนหมู",
    gramsPerPerson: { breakfast: 80, lunch: 120, dinner: 120 },
    pricePerKg: 155,
  },
  {
    id: "p06",
    name: "หมูบด",
    category: "ชิ้นส่วนหมู",
    gramsPerPerson: { breakfast: 70, lunch: 110, dinner: 110 },
    pricePerKg: 150,
  },
  {
    id: "p07",
    name: "ขาหมู",
    category: "ชิ้นส่วนหมู",
    gramsPerPerson: { breakfast: 0, lunch: 200, dinner: 250 },
    pricePerKg: 165,
  },
  {
    id: "p08",
    name: "หมูเนื้อแดง",
    category: "ชิ้นส่วนหมู",
    gramsPerPerson: { breakfast: 0, lunch: 130, dinner: 150 },
    pricePerKg: 180,
  },

  /* 2. หมูแปรรูป — Processed Pork */
  {
    id: "pp01",
    name: "เบคอน",
    category: "หมูแปรรูป",
    gramsPerPerson: { breakfast: 80, lunch: 0, dinner: 0 },
    pricePerKg: 320,
  },
  {
    id: "pp02",
    name: "แฮม (สไลด์)",
    category: "หมูแปรรูป",
    gramsPerPerson: { breakfast: 70, lunch: 60, dinner: 0 },
    pricePerKg: 280,
  },
  {
    id: "pp03",
    name: "หมูยอ",
    category: "หมูแปรรูป",
    gramsPerPerson: { breakfast: 50, lunch: 40, dinner: 0 },
    pricePerKg: 210,
  },
  {
    id: "pp04",
    name: "ไส้กรอกหมู (ใหญ่)",
    category: "หมูแปรรูป",
    gramsPerPerson: { breakfast: 80, lunch: 60, dinner: 60 },
    pricePerKg: 245,
  },
  {
    id: "pp05",
    name: "กุนเชียง",
    category: "หมูแปรรูป",
    gramsPerPerson: { breakfast: 40, lunch: 40, dinner: 0 },
    pricePerKg: 260,
  },

  /* 3. หมูกระทะ/ชาบู — Shabu Pork */
  {
    id: "sh01",
    name: "หมูชาบู (สันคอสไลด์)",
    category: "หมูกระทะ/ชาบู",
    gramsPerPerson: { breakfast: 0, lunch: 150, dinner: 200 },
    pricePerKg: 230,
  },
  {
    id: "sh02",
    name: "หมูกระทะ (สามชั้นสไลด์)",
    category: "หมูกระทะ/ชาบู",
    gramsPerPerson: { breakfast: 0, lunch: 140, dinner: 190 },
    pricePerKg: 210,
  },
  {
    id: "sh03",
    name: "หมูชาบู (สันในสไลด์)",
    category: "หมูกระทะ/ชาบู",
    gramsPerPerson: { breakfast: 0, lunch: 130, dinner: 180 },
    pricePerKg: 250,
  },
  {
    id: "sh04",
    name: "หมูเบคอนชาบู",
    category: "หมูกระทะ/ชาบู",
    gramsPerPerson: { breakfast: 0, lunch: 100, dinner: 130 },
    pricePerKg: 340,
  },

  /* 4. ไก่/แปรรูป — Chicken & Processed */
  {
    id: "c01",
    name: "อกไก่",
    category: "ไก่/แปรรูป",
    gramsPerPerson: { breakfast: 80, lunch: 150, dinner: 160 },
    pricePerKg: 85,
  },
  {
    id: "c02",
    name: "สะโพกไก่",
    category: "ไก่/แปรรูป",
    gramsPerPerson: { breakfast: 0, lunch: 180, dinner: 200 },
    pricePerKg: 78,
  },
  {
    id: "c03",
    name: "ปีกไก่",
    category: "ไก่/แปรรูป",
    gramsPerPerson: { breakfast: 0, lunch: 160, dinner: 180 },
    pricePerKg: 72,
  },
  {
    id: "c04",
    name: "ไก่บด",
    category: "ไก่/แปรรูป",
    gramsPerPerson: { breakfast: 70, lunch: 100, dinner: 100 },
    pricePerKg: 88,
  },
  {
    id: "c05",
    name: "ไส้อั่ว",
    category: "ไก่/แปรรูป",
    gramsPerPerson: { breakfast: 50, lunch: 60, dinner: 0 },
    pricePerKg: 195,
  },
  {
    id: "c06",
    name: "ไก่ทอดชิ้น (Frozen)",
    category: "ไก่/แปรรูป",
    gramsPerPerson: { breakfast: 80, lunch: 120, dinner: 100 },
    pricePerKg: 135,
  },
  {
    id: "c07",
    name: "แฟรงเฟิร์ตเตอร์ไก่",
    category: "ไก่/แปรรูป",
    gramsPerPerson: { breakfast: 60, lunch: 0, dinner: 0 },
    pricePerKg: 180,
  },

  /* 5. ชิ้นส่วนวัว — Beef Parts */
  {
    id: "b01",
    name: "สันนอกวัว",
    category: "ชิ้นส่วนวัว",
    gramsPerPerson: { breakfast: 0, lunch: 180, dinner: 220 },
    pricePerKg: 580,
  },
  {
    id: "b02",
    name: "สันในวัว",
    category: "ชิ้นส่วนวัว",
    gramsPerPerson: { breakfast: 0, lunch: 160, dinner: 200 },
    pricePerKg: 650,
  },
  {
    id: "b03",
    name: "เนื้อสับวัว",
    category: "ชิ้นส่วนวัว",
    gramsPerPerson: { breakfast: 80, lunch: 120, dinner: 130 },
    pricePerKg: 380,
  },
  {
    id: "b04",
    name: "ชอร์ตริบส์วัว",
    category: "ชิ้นส่วนวัว",
    gramsPerPerson: { breakfast: 0, lunch: 200, dinner: 250 },
    pricePerKg: 520,
  },
  {
    id: "b05",
    name: "เนื้อวัวบด",
    category: "ชิ้นส่วนวัว",
    gramsPerPerson: { breakfast: 70, lunch: 110, dinner: 110 },
    pricePerKg: 360,
  },

  /* 6. วัว/แปรรูป — Processed Beef */
  {
    id: "pb01",
    name: "เนื้อวัวชาบูสไลด์",
    category: "วัว/แปรรูป",
    gramsPerPerson: { breakfast: 0, lunch: 150, dinner: 180 },
    pricePerKg: 480,
  },
  {
    id: "pb02",
    name: "เนื้อวัวอบ (Roast Beef)",
    category: "วัว/แปรรูป",
    gramsPerPerson: { breakfast: 60, lunch: 80, dinner: 0 },
    pricePerKg: 420,
  },
  {
    id: "pb03",
    name: "เนื้อวัวพริกไทยดำ",
    category: "วัว/แปรรูป",
    gramsPerPerson: { breakfast: 0, lunch: 130, dinner: 150 },
    pricePerKg: 390,
  },
  {
    id: "pb04",
    name: "แฮมเบอร์เกอร์แพตตี้",
    category: "วัว/แปรรูป",
    gramsPerPerson: { breakfast: 90, lunch: 0, dinner: 130 },
    pricePerKg: 310,
  },

  /* 7. เป็ด/แปรรูป — Duck & Processed */
  {
    id: "d01",
    name: "อกเป็ด",
    category: "เป็ด/แปรรูป",
    gramsPerPerson: { breakfast: 0, lunch: 150, dinner: 180 },
    pricePerKg: 360,
  },
  {
    id: "d02",
    name: "เป็ดพะโล้ (สำเร็จ)",
    category: "เป็ด/แปรรูป",
    gramsPerPerson: { breakfast: 0, lunch: 160, dinner: 180 },
    pricePerKg: 290,
  },
  {
    id: "d03",
    name: "เป็ดสไลด์ชาบู",
    category: "เป็ด/แปรรูป",
    gramsPerPerson: { breakfast: 0, lunch: 130, dinner: 160 },
    pricePerKg: 340,
  },
  {
    id: "d04",
    name: "น่องเป็ดรมควัน",
    category: "เป็ด/แปรรูป",
    gramsPerPerson: { breakfast: 60, lunch: 0, dinner: 0 },
    pricePerKg: 420,
  },

  /* 8. กุ้ง — Shrimp */
  {
    id: "s01",
    name: "กุ้งแวนนาไม (ปอกเปลือก)",
    category: "กุ้ง",
    gramsPerPerson: { breakfast: 60, lunch: 120, dinner: 150 },
    pricePerKg: 280,
  },
  {
    id: "s02",
    name: "กุ้งกุลาดำ (ทั้งตัว)",
    category: "กุ้ง",
    gramsPerPerson: { breakfast: 0, lunch: 140, dinner: 180 },
    pricePerKg: 350,
  },
  {
    id: "s03",
    name: "กุ้งแช่บ๊วย (Sashimi)",
    category: "กุ้ง",
    gramsPerPerson: { breakfast: 0, lunch: 100, dinner: 130 },
    pricePerKg: 420,
  },
  {
    id: "s04",
    name: "กุ้งชุบแป้งทอด (Frozen)",
    category: "กุ้ง",
    gramsPerPerson: { breakfast: 60, lunch: 80, dinner: 80 },
    pricePerKg: 230,
  },

  /* 9. หมึก — Squid */
  {
    id: "sq01",
    name: "หมึกกล้วย",
    category: "หมึก",
    gramsPerPerson: { breakfast: 0, lunch: 120, dinner: 150 },
    pricePerKg: 195,
  },
  {
    id: "sq02",
    name: "หมึกหอม (วงแหวน)",
    category: "หมึก",
    gramsPerPerson: { breakfast: 0, lunch: 100, dinner: 130 },
    pricePerKg: 240,
  },
  {
    id: "sq03",
    name: "ปลาหมึกยักษ์",
    category: "หมึก",
    gramsPerPerson: { breakfast: 0, lunch: 130, dinner: 160 },
    pricePerKg: 310,
  },
  {
    id: "sq04",
    name: "หมึกสาย",
    category: "หมึก",
    gramsPerPerson: { breakfast: 0, lunch: 90, dinner: 120 },
    pricePerKg: 380,
  },

  /* 10. ปู — Crab */
  {
    id: "cr01",
    name: "ปูม้า (ทั้งตัว)",
    category: "ปู",
    gramsPerPerson: { breakfast: 0, lunch: 200, dinner: 250 },
    pricePerKg: 320,
  },
  {
    id: "cr02",
    name: "เนื้อปูอัด (Imitation)",
    category: "ปู",
    gramsPerPerson: { breakfast: 40, lunch: 80, dinner: 80 },
    pricePerKg: 145,
  },
  {
    id: "cr03",
    name: "ก้ามปูทะเล",
    category: "ปู",
    gramsPerPerson: { breakfast: 0, lunch: 160, dinner: 200 },
    pricePerKg: 490,
  },

  /* 11. ลูกชิ้น/ไส้กรอก & ของทานเล่น — Meatballs & Snacks */
  {
    id: "mb01",
    name: "ลูกชิ้นหมู",
    category: "ลูกชิ้น/ไส้กรอก & ของทานเล่น",
    gramsPerPerson: { breakfast: 40, lunch: 80, dinner: 80 },
    pricePerKg: 130,
  },
  {
    id: "mb02",
    name: "ลูกชิ้นไก่",
    category: "ลูกชิ้น/ไส้กรอก & ของทานเล่น",
    gramsPerPerson: { breakfast: 40, lunch: 80, dinner: 80 },
    pricePerKg: 120,
  },
  {
    id: "mb03",
    name: "ลูกชิ้นปลา",
    category: "ลูกชิ้น/ไส้กรอก & ของทานเล่น",
    gramsPerPerson: { breakfast: 30, lunch: 60, dinner: 60 },
    pricePerKg: 115,
  },
  {
    id: "mb04",
    name: "ไส้กรอกเวียนนา",
    category: "ลูกชิ้น/ไส้กรอก & ของทานเล่น",
    gramsPerPerson: { breakfast: 80, lunch: 40, dinner: 0 },
    pricePerKg: 145,
  },
  {
    id: "mb05",
    name: "ปอเปี๊ยะทอด (Frozen)",
    category: "ลูกชิ้น/ไส้กรอก & ของทานเล่น",
    gramsPerPerson: { breakfast: 50, lunch: 60, dinner: 60 },
    pricePerKg: 165,
  },
  {
    id: "mb06",
    name: "ทอดมันปลา",
    category: "ลูกชิ้น/ไส้กรอก & ของทานเล่น",
    gramsPerPerson: { breakfast: 0, lunch: 70, dinner: 70 },
    pricePerKg: 175,
  },
  {
    id: "mb07",
    name: "ไก่ป๊อปคอร์น (Frozen)",
    category: "ลูกชิ้น/ไส้กรอก & ของทานเล่น",
    gramsPerPerson: { breakfast: 60, lunch: 60, dinner: 60 },
    pricePerKg: 155,
  },
];

/* ── Category → CSS badge class mapping ── */
const CAT_BADGE = {
  ชิ้นส่วนหมู: "badge-pork",
  หมูแปรรูป: "badge-ppork",
  "หมูกระทะ/ชาบู": "badge-shabu",
  "ไก่/แปรรูป": "badge-chicken",
  ชิ้นส่วนวัว: "badge-beef",
  "วัว/แปรรูป": "badge-pbeef",
  "เป็ด/แปรรูป": "badge-duck",
  กุ้ง: "badge-shrimp",
  หมึก: "badge-squid",
  ปู: "badge-crab",
  "ลูกชิ้น/ไส้กรอก & ของทานเล่น": "badge-ball",
};

/* ── Chart color per category ── */
const CAT_COLOR = {
  ชิ้นส่วนหมู: "#EC4899",
  หมูแปรรูป: "#F472B6",
  "หมูกระทะ/ชาบู": "#FB923C",
  "ไก่/แปรรูป": "#EAB308",
  ชิ้นส่วนวัว: "#EF4444",
  "วัว/แปรรูป": "#F97316",
  "เป็ด/แปรรูป": "#22C55E",
  กุ้ง: "#E11D48",
  หมึก: "#3B82F6",
  ปู: "#14B8A6",
  "ลูกชิ้น/ไส้กรอก & ของทานเล่น": "#8B5CF6",
};

/* ── CRUD API ── */
function getAllItems() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAll(items) {
  localStorage.setItem(DB_KEY, JSON.stringify(items));
}

function initDB() {
  if (!localStorage.getItem(DB_KEY)) {
    saveAll(SEED_ITEMS);
  }
}

function addItemToDB(item) {
  const items = getAllItems();
  items.push(item);
  saveAll(items);
}

function removeItemFromDB(id) {
  saveAll(getAllItems().filter((i) => i.id !== id));
}

function updateItemGrams(id, meal, value) {
  const items = getAllItems();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  if (typeof item.gramsPerPerson === "object") {
    item.gramsPerPerson[meal] = value;
  } else {
    item.gramsPerPerson = value;
  }
  saveAll(items);
}

function getGrams(item, meal) {
  if (typeof item.gramsPerPerson === "object") {
    return item.gramsPerPerson[meal] || 0;
  }
  return item.gramsPerPerson || 0;
}

/* ── Auto-init ── */
initDB();
