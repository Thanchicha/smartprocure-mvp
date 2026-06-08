/**
 * db-items.js — SmartProcure Master Item Data v3
 * Schema: item.meals = { breakfast: { active, grams }, lunch: { active, grams }, dinner: { active, grams } }
 */

const DB_ITEMS_KEY = 'sp_items_v3';

/* ── Helper: convert old gramsPerPerson → new meals schema ── */
function _mkMeals(b, l, d) {
  return {
    breakfast: { active: b > 0, grams: b },
    lunch:     { active: l > 0, grams: l },
    dinner:    { active: d > 0, grams: d },
  };
}

/* ── Master seed data (new schema) ── */
const SEED_ITEMS = [
  /* 1. ชิ้นส่วนหมู */
  { id:'p01', name:'สันคอหมู',       category:'ชิ้นส่วนหมู',             meals:_mkMeals(80,150,180), pricePerKg:195 },
  { id:'p02', name:'สันในหมู',        category:'ชิ้นส่วนหมู',             meals:_mkMeals(0,140,170),  pricePerKg:220 },
  { id:'p03', name:'หมูสามชั้น',      category:'ชิ้นส่วนหมู',             meals:_mkMeals(60,130,150), pricePerKg:175 },
  { id:'p04', name:'ซี่โครงหมู',      category:'ชิ้นส่วนหมู',             meals:_mkMeals(0,160,200),  pricePerKg:185 },
  { id:'p05', name:'หมูสับ',          category:'ชิ้นส่วนหมู',             meals:_mkMeals(80,120,120), pricePerKg:155 },
  { id:'p06', name:'หมูบด',           category:'ชิ้นส่วนหมู',             meals:_mkMeals(70,110,110), pricePerKg:150 },
  { id:'p07', name:'ขาหมู',           category:'ชิ้นส่วนหมู',             meals:_mkMeals(0,200,250),  pricePerKg:165 },
  { id:'p08', name:'หมูเนื้อแดง',     category:'ชิ้นส่วนหมู',             meals:_mkMeals(0,130,150),  pricePerKg:180 },
  /* 2. หมูแปรรูป */
  { id:'pp01', name:'เบคอน',          category:'หมูแปรรูป',               meals:_mkMeals(80,0,0),     pricePerKg:320 },
  { id:'pp02', name:'แฮม (สไลด์)',    category:'หมูแปรรูป',               meals:_mkMeals(70,60,0),    pricePerKg:280 },
  { id:'pp03', name:'หมูยอ',          category:'หมูแปรรูป',               meals:_mkMeals(50,40,0),    pricePerKg:210 },
  { id:'pp04', name:'ไส้กรอกหมู (ใหญ่)',category:'หมูแปรรูป',            meals:_mkMeals(80,60,60),   pricePerKg:245 },
  { id:'pp05', name:'กุนเชียง',       category:'หมูแปรรูป',               meals:_mkMeals(40,40,0),    pricePerKg:260 },
  /* 3. หมูกระทะ/ชาบู */
  { id:'sh01', name:'หมูชาบู (สันคอสไลด์)', category:'หมูกระทะ/ชาบู',  meals:_mkMeals(0,150,200),  pricePerKg:230 },
  { id:'sh02', name:'หมูกระทะ (สามชั้นสไลด์)',category:'หมูกระทะ/ชาบู',meals:_mkMeals(0,140,190),  pricePerKg:210 },
  { id:'sh03', name:'หมูชาบู (สันในสไลด์)', category:'หมูกระทะ/ชาบู',  meals:_mkMeals(0,130,180),  pricePerKg:250 },
  { id:'sh04', name:'หมูเบคอนชาบู',   category:'หมูกระทะ/ชาบู',          meals:_mkMeals(0,100,130),  pricePerKg:340 },
  /* 4. ไก่/แปรรูป */
  { id:'c01', name:'อกไก่',           category:'ไก่/แปรรูป',              meals:_mkMeals(80,150,160), pricePerKg:85  },
  { id:'c02', name:'สะโพกไก่',        category:'ไก่/แปรรูป',              meals:_mkMeals(0,180,200),  pricePerKg:78  },
  { id:'c03', name:'ปีกไก่',          category:'ไก่/แปรรูป',              meals:_mkMeals(0,160,180),  pricePerKg:72  },
  { id:'c04', name:'ไก่บด',           category:'ไก่/แปรรูป',              meals:_mkMeals(70,100,100), pricePerKg:88  },
  { id:'c05', name:'ไส้อั่ว',         category:'ไก่/แปรรูป',              meals:_mkMeals(50,60,0),    pricePerKg:195 },
  { id:'c06', name:'ไก่ทอดชิ้น (Frozen)',category:'ไก่/แปรรูป',          meals:_mkMeals(80,120,100), pricePerKg:135 },
  { id:'c07', name:'แฟรงเฟิร์ตเตอร์ไก่',category:'ไก่/แปรรูป',          meals:_mkMeals(60,0,0),     pricePerKg:180 },
  /* 5. ชิ้นส่วนวัว */
  { id:'b01', name:'สันนอกวัว',       category:'ชิ้นส่วนวัว',             meals:_mkMeals(0,180,220),  pricePerKg:580 },
  { id:'b02', name:'สันในวัว',         category:'ชิ้นส่วนวัว',             meals:_mkMeals(0,160,200),  pricePerKg:650 },
  { id:'b03', name:'เนื้อสับวัว',      category:'ชิ้นส่วนวัว',             meals:_mkMeals(80,120,130), pricePerKg:380 },
  { id:'b04', name:'ชอร์ตริบส์วัว',   category:'ชิ้นส่วนวัว',             meals:_mkMeals(0,200,250),  pricePerKg:520 },
  { id:'b05', name:'เนื้อวัวบด',       category:'ชิ้นส่วนวัว',             meals:_mkMeals(70,110,110), pricePerKg:360 },
  /* 6. วัว/แปรรูป */
  { id:'pb01', name:'เนื้อวัวชาบูสไลด์', category:'วัว/แปรรูป',          meals:_mkMeals(0,150,180),  pricePerKg:480 },
  { id:'pb02', name:'เนื้อวัวอบ (Roast Beef)',category:'วัว/แปรรูป',      meals:_mkMeals(60,80,0),    pricePerKg:420 },
  { id:'pb03', name:'เนื้อวัวพริกไทยดำ', category:'วัว/แปรรูป',           meals:_mkMeals(0,130,150),  pricePerKg:390 },
  { id:'pb04', name:'แฮมเบอร์เกอร์แพตตี้',category:'วัว/แปรรูป',         meals:_mkMeals(90,0,130),   pricePerKg:310 },
  /* 7. เป็ด/แปรรูป */
  { id:'d01', name:'อกเป็ด',          category:'เป็ด/แปรรูป',             meals:_mkMeals(0,150,180),  pricePerKg:360 },
  { id:'d02', name:'เป็ดพะโล้ (สำเร็จ)',category:'เป็ด/แปรรูป',           meals:_mkMeals(0,160,180),  pricePerKg:290 },
  { id:'d03', name:'เป็ดสไลด์ชาบู',   category:'เป็ด/แปรรูป',             meals:_mkMeals(0,130,160),  pricePerKg:340 },
  { id:'d04', name:'น่องเป็ดรมควัน',  category:'เป็ด/แปรรูป',             meals:_mkMeals(60,0,0),     pricePerKg:420 },
  /* 8. กุ้ง */
  { id:'s01', name:'กุ้งแวนนาไม (ปอกเปลือก)', category:'กุ้ง',           meals:_mkMeals(60,120,150), pricePerKg:280 },
  { id:'s02', name:'กุ้งกุลาดำ (ทั้งตัว)',    category:'กุ้ง',            meals:_mkMeals(0,140,180),  pricePerKg:350 },
  { id:'s03', name:'กุ้งแช่บ๊วย (Sashimi)',   category:'กุ้ง',            meals:_mkMeals(0,100,130),  pricePerKg:420 },
  { id:'s04', name:'กุ้งชุบแป้งทอด (Frozen)', category:'กุ้ง',            meals:_mkMeals(60,80,80),   pricePerKg:230 },
  /* 9. หมึก */
  { id:'sq01', name:'หมึกกล้วย',       category:'หมึก',                   meals:_mkMeals(0,120,150),  pricePerKg:195 },
  { id:'sq02', name:'หมึกหอม (วงแหวน)',category:'หมึก',                   meals:_mkMeals(0,100,130),  pricePerKg:240 },
  { id:'sq03', name:'ปลาหมึกยักษ์',    category:'หมึก',                   meals:_mkMeals(0,130,160),  pricePerKg:310 },
  { id:'sq04', name:'หมึกสาย',         category:'หมึก',                   meals:_mkMeals(0,90,120),   pricePerKg:380 },
  /* 10. ปู */
  { id:'cr01', name:'ปูม้า (ทั้งตัว)', category:'ปู',                     meals:_mkMeals(0,200,250),  pricePerKg:320 },
  { id:'cr02', name:'เนื้อปูอัด (Imitation)',category:'ปู',               meals:_mkMeals(40,80,80),   pricePerKg:145 },
  { id:'cr03', name:'ก้ามปูทะเล',      category:'ปู',                     meals:_mkMeals(0,160,200),  pricePerKg:490 },
  /* 11. ลูกชิ้น/ไส้กรอก & ของทานเล่น */
  { id:'mb01', name:'ลูกชิ้นหมู',      category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น', meals:_mkMeals(40,80,80),   pricePerKg:130 },
  { id:'mb02', name:'ลูกชิ้นไก่',      category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น', meals:_mkMeals(40,80,80),   pricePerKg:120 },
  { id:'mb03', name:'ลูกชิ้นปลา',      category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น', meals:_mkMeals(30,60,60),   pricePerKg:115 },
  { id:'mb04', name:'ไส้กรอกเวียนนา',  category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น', meals:_mkMeals(80,40,0),    pricePerKg:145 },
  { id:'mb05', name:'ปอเปี๊ยะทอด (Frozen)',category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น', meals:_mkMeals(50,60,60),   pricePerKg:165 },
  { id:'mb06', name:'ทอดมันปลา',       category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น', meals:_mkMeals(0,70,70),    pricePerKg:175 },
  { id:'mb07', name:'ไก่ป๊อปคอร์น (Frozen)',category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น', meals:_mkMeals(60,60,60),   pricePerKg:155 },
];

/* ── Category → CSS badge class ── */
const CAT_BADGE = {
  'ชิ้นส่วนหมู':                  'badge-pork',
  'หมูแปรรูป':                     'badge-ppork',
  'หมูกระทะ/ชาบู':                'badge-shabu',
  'ไก่/แปรรูป':                    'badge-chicken',
  'ชิ้นส่วนวัว':                   'badge-beef',
  'วัว/แปรรูป':                    'badge-pbeef',
  'เป็ด/แปรรูป':                   'badge-duck',
  'กุ้ง':                          'badge-shrimp',
  'หมึก':                          'badge-squid',
  'ปู':                            'badge-crab',
  'ลูกชิ้น/ไส้กรอก & ของทานเล่น': 'badge-ball',
};

/* ── Category → Chart color ── */
const CAT_COLOR = {
  'ชิ้นส่วนหมู':                  '#EC4899',
  'หมูแปรรูป':                     '#F472B6',
  'หมูกระทะ/ชาบู':                '#FB923C',
  'ไก่/แปรรูป':                    '#EAB308',
  'ชิ้นส่วนวัว':                   '#EF4444',
  'วัว/แปรรูป':                    '#F97316',
  'เป็ด/แปรรูป':                   '#22C55E',
  'กุ้ง':                          '#E11D48',
  'หมึก':                          '#3B82F6',
  'ปู':                            '#14B8A6',
  'ลูกชิ้น/ไส้กรอก & ของทานเล่น': '#8B5CF6',
};

/* ── CRUD API ── */
function getAllItems() {
  try { return JSON.parse(localStorage.getItem(DB_ITEMS_KEY)) || []; }
  catch { return []; }
}
function _saveAll(items) {
  localStorage.setItem(DB_ITEMS_KEY, JSON.stringify(items));
}
function saveAll(items) { _saveAll(items); }

function initDB() {
  if (!localStorage.getItem(DB_ITEMS_KEY)) {
    _saveAll(SEED_ITEMS);
  }
}

function addItemToDB(item) {
  const items = getAllItems();
  items.push(item);
  _saveAll(items);
}

function removeItemFromDB(id) {
  _saveAll(getAllItems().filter(i => i.id !== id));
}

/* Update grams AND active flag for a meal */
function updateItemMeal(id, meal, active, grams) {
  const items = getAllItems();
  const item  = items.find(i => i.id === id);
  if (!item) return;
  if (!item.meals) item.meals = {};
  item.meals[meal] = { active: !!active, grams: Number(grams) || 0 };
  _saveAll(items);
}

/* Legacy shim used by old callers — updates grams only, keeps active unchanged */
function updateItemGrams(id, meal, value) {
  const items = getAllItems();
  const item  = items.find(i => i.id === id);
  if (!item) return;
  if (!item.meals) item.meals = {};
  if (!item.meals[meal]) item.meals[meal] = { active: true, grams: 0 };
  item.meals[meal].grams = Number(value) || 0;
  _saveAll(items);
}

function getGrams(item, meal) {
  return item.meals?.[meal]?.grams || 0;
}

function isMealActive(item, meal) {
  return item.meals?.[meal]?.active === true;
}

/* ── Auto-init ── */
initDB();
