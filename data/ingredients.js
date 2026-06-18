// SmartProcure — Ingredient Data

const CATEGORIES = ['ชิ้นส่วนหมู','หมูแปรรูป','หมูกระทะ/ชาบู','ไก่/แปรรูป','ชิ้นส่วนวัว','วัว/แปรรูป','เป็ด/แปรรูป','กุ้ง','หมึก','ปู','ลูกชิ้น/ไส้กรอก & ของทานเล่น','ปลา','ผัก/ผลไม้','ไข่/นม/เนย','แป้ง/ข้าว/เส้น','เครื่องปรุง'];

const CAT_BADGE = {
  'ชิ้นส่วนหมู':'badge-pink','หมูแปรรูป':'badge-fuchsia','หมูกระทะ/ชาบู':'badge-orange',
  'ไก่/แปรรูป':'badge-yellow','ชิ้นส่วนวัว':'badge-red','วัว/แปรรูป':'badge-amber',
  'เป็ด/แปรรูป':'badge-green','กุ้ง':'badge-rose','หมึก':'badge-blue','ปู':'badge-teal',
  'ลูกชิ้น/ไส้กรอก & ของทานเล่น':'badge-purple','ปลา':'badge-cyan',
  'ผัก/ผลไม้':'badge-lime','ไข่/นม/เนย':'badge-sky','แป้ง/ข้าว/เส้น':'badge-stone','เครื่องปรุง':'badge-indigo'
};

const CAT_COLOR = {
  'ชิ้นส่วนหมู':'#EC4899','หมูแปรรูป':'#F472B6','หมูกระทะ/ชาบู':'#FB923C',
  'ไก่/แปรรูป':'#EAB308','ชิ้นส่วนวัว':'#EF4444','วัว/แปรรูป':'#F97316',
  'เป็ด/แปรรูป':'#22C55E','กุ้ง':'#E11D48','หมึก':'#3B82F6','ปู':'#14B8A6',
  'ลูกชิ้น/ไส้กรอก & ของทานเล่น':'#8B5CF6','ปลา':'#06B6D4','ผัก/ผลไม้':'#84CC16',
  'ไข่/นม/เนย':'#0EA5E9','แป้ง/ข้าว/เส้น':'#78716C','เครื่องปรุง':'#6366F1'
};

const INGREDIENTS = [
  // ชิ้นส่วนหมู
  {id:'p01',code:'PKR-001',name:'สันคอหมู',category:'ชิ้นส่วนหมู',pricePerKg:195,moq:5,bufferRate:5,unit:'kg',defaultGrams:{breakfast:80,lunch:150,dinner:180}},
  {id:'p02',code:'PKR-002',name:'สันในหมู',category:'ชิ้นส่วนหมู',pricePerKg:220,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:140,dinner:170}},
  {id:'p03',code:'PKR-003',name:'หมูสามชั้น',category:'ชิ้นส่วนหมู',pricePerKg:175,moq:5,bufferRate:5,unit:'kg',defaultGrams:{breakfast:60,lunch:130,dinner:150}},
  {id:'p04',code:'PKR-004',name:'ซี่โครงหมู',category:'ชิ้นส่วนหมู',pricePerKg:185,moq:5,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:160,dinner:200}},
  {id:'p05',code:'PKR-005',name:'หมูสับ',category:'ชิ้นส่วนหมู',pricePerKg:155,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:80,lunch:120,dinner:120}},
  {id:'p06',code:'PKR-006',name:'หมูบด',category:'ชิ้นส่วนหมู',pricePerKg:150,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:70,lunch:110,dinner:110}},
  {id:'p07',code:'PKR-007',name:'ขาหมู',category:'ชิ้นส่วนหมู',pricePerKg:165,moq:5,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:200,dinner:250}},
  {id:'p08',code:'PKR-008',name:'หมูเนื้อแดง',category:'ชิ้นส่วนหมู',pricePerKg:180,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:130,dinner:150}},
  // หมูแปรรูป
  {id:'pp01',code:'PKR-101',name:'เบคอน',category:'หมูแปรรูป',pricePerKg:320,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:80,lunch:0,dinner:0}},
  {id:'pp02',code:'PKR-102',name:'แฮม (สไลด์)',category:'หมูแปรรูป',pricePerKg:280,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:70,lunch:60,dinner:0}},
  {id:'pp03',code:'PKR-103',name:'หมูยอ',category:'หมูแปรรูป',pricePerKg:210,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:50,lunch:40,dinner:0}},
  {id:'pp04',code:'PKR-104',name:'ไส้กรอกหมู (ใหญ่)',category:'หมูแปรรูป',pricePerKg:245,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:80,lunch:60,dinner:60}},
  {id:'pp05',code:'PKR-105',name:'กุนเชียง',category:'หมูแปรรูป',pricePerKg:260,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:40,lunch:40,dinner:0}},
  {id:'pp06',code:'PKR-106',name:'หมูยอแม่กลอง BB',category:'หมูแปรรูป',pricePerKg:95,moq:3,bufferRate:16,unit:'kg',defaultGrams:{breakfast:80,lunch:60,dinner:60}},
  // หมูกระทะ/ชาบู
  {id:'sh01',code:'PKR-201',name:'หมูชาบู (สันคอสไลด์)',category:'หมูกระทะ/ชาบู',pricePerKg:230,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:150,dinner:200}},
  {id:'sh02',code:'PKR-202',name:'หมูกระทะ (สามชั้นสไลด์)',category:'หมูกระทะ/ชาบู',pricePerKg:210,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:140,dinner:190}},
  {id:'sh03',code:'PKR-203',name:'หมูชาบู (สันในสไลด์)',category:'หมูกระทะ/ชาบู',pricePerKg:250,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:130,dinner:180}},
  // ไก่/แปรรูป
  {id:'c01',code:'PKR-301',name:'อกไก่ BB',category:'ไก่/แปรรูป',pricePerKg:85,moq:5,bufferRate:5,unit:'kg',defaultGrams:{breakfast:80,lunch:150,dinner:160}},
  {id:'c02',code:'PKR-302',name:'สะโพกไก่',category:'ไก่/แปรรูป',pricePerKg:78,moq:5,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:180,dinner:200}},
  {id:'c03',code:'PKR-303',name:'ปีกไก่',category:'ไก่/แปรรูป',pricePerKg:72,moq:5,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:160,dinner:180}},
  {id:'c04',code:'PKR-304',name:'ไก่บด',category:'ไก่/แปรรูป',pricePerKg:88,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:70,lunch:100,dinner:100}},
  {id:'c05',code:'PKR-305',name:'ไส้อั่ว',category:'ไก่/แปรรูป',pricePerKg:195,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:50,lunch:60,dinner:0}},
  {id:'c06',code:'PKR-306',name:'ไก่ BB (CJ-8)',category:'ไก่/แปรรูป',pricePerKg:70,moq:5,bufferRate:20,unit:'kg',defaultGrams:{breakfast:80,lunch:120,dinner:100}},
  {id:'c07',code:'PKR-307',name:'แฟรงเฟิร์ตเตอร์ไก่',category:'ไก่/แปรรูป',pricePerKg:180,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:60,lunch:0,dinner:0}},
  // ชิ้นส่วนวัว
  {id:'b01',code:'PKR-401',name:'สันนอกวัว',category:'ชิ้นส่วนวัว',pricePerKg:580,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:180,dinner:220}},
  {id:'b02',code:'PKR-402',name:'สันในวัว JKB-6065',category:'ชิ้นส่วนวัว',pricePerKg:105,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:160,dinner:200}},
  {id:'b03',code:'PKR-403',name:'เนื้อสับวัว',category:'ชิ้นส่วนวัว',pricePerKg:380,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:80,lunch:120,dinner:130}},
  {id:'b04',code:'PKR-404',name:'ชอร์ตริบส์วัว',category:'ชิ้นส่วนวัว',pricePerKg:520,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:200,dinner:250}},
  {id:'b05',code:'PKR-405',name:'เนื้อวัวบด',category:'ชิ้นส่วนวัว',pricePerKg:360,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:70,lunch:110,dinner:110}},
  // วัว/แปรรูป
  {id:'pb01',code:'PKR-501',name:'เนื้อวัวชาบูสไลด์',category:'วัว/แปรรูป',pricePerKg:480,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:150,dinner:180}},
  {id:'pb02',code:'PKR-502',name:'เนื้อวัวอบ (Roast Beef)',category:'วัว/แปรรูป',pricePerKg:420,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:60,lunch:80,dinner:0}},
  {id:'pb03',code:'PKR-503',name:'แฮมเบอร์เกอร์แพตตี้',category:'วัว/แปรรูป',pricePerKg:310,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:90,lunch:0,dinner:130}},
  // เป็ด/แปรรูป
  {id:'d01',code:'PKR-601',name:'อกเป็ด',category:'เป็ด/แปรรูป',pricePerKg:360,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:150,dinner:180}},
  {id:'d02',code:'PKR-602',name:'เป็ดพะโล้ (สำเร็จ)',category:'เป็ด/แปรรูป',pricePerKg:290,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:160,dinner:180}},
  {id:'d03',code:'PKR-603',name:'น่องเป็ดรมควัน',category:'เป็ด/แปรรูป',pricePerKg:420,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:60,lunch:0,dinner:0}},
  // กุ้ง
  {id:'s01',code:'PKR-701',name:'กุ้งแวนนาไม (ปอกเปลือก)',category:'กุ้ง',pricePerKg:280,moq:3,bufferRate:10,unit:'kg',defaultGrams:{breakfast:60,lunch:120,dinner:150}},
  {id:'s02',code:'PKR-702',name:'กุ้งกุลาดำ (ทั้งตัว)',category:'กุ้ง',pricePerKg:350,moq:3,bufferRate:10,unit:'kg',defaultGrams:{breakfast:0,lunch:140,dinner:180}},
  {id:'s03',code:'PKR-703',name:'กุ้งโอคัคแกะ 1 กก.',category:'กุ้ง',pricePerKg:265,moq:1,bufferRate:0,unit:'pack',unitSize:1,defaultGrams:{breakfast:0,lunch:100,dinner:130}},
  {id:'s04',code:'PKR-704',name:'กุ้งชุบแป้งทอด (Frozen)',category:'กุ้ง',pricePerKg:230,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:60,lunch:80,dinner:80}},
  // หมึก
  {id:'sq01',code:'PKR-801',name:'หมึกกล้วย',category:'หมึก',pricePerKg:195,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:120,dinner:150}},
  {id:'sq02',code:'PKR-802',name:'หมึกหอม (วงแหวน)',category:'หมึก',pricePerKg:240,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:100,dinner:130}},
  {id:'sq03',code:'PKR-803',name:'หมึกแห้งเจาะตา JKB-260',category:'หมึก',pricePerKg:335,moq:3,bufferRate:0,unit:'kg',defaultGrams:{breakfast:0,lunch:80,dinner:100}},
  // ปู
  {id:'cr01',code:'PKR-901',name:'ปูม้า (ทั้งตัว)',category:'ปู',pricePerKg:320,moq:3,bufferRate:10,unit:'kg',defaultGrams:{breakfast:0,lunch:200,dinner:250}},
  {id:'cr02',code:'PKR-902',name:'เนื้อปูอัด (Imitation)',category:'ปู',pricePerKg:145,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:40,lunch:80,dinner:80}},
  {id:'cr03',code:'PKR-903',name:'ก้ามปูทะเล',category:'ปู',pricePerKg:490,moq:2,bufferRate:10,unit:'kg',defaultGrams:{breakfast:0,lunch:160,dinner:200}},
  // ลูกชิ้น/ไส้กรอก
  {id:'mb01',code:'PKR-1001',name:'ลูกชิ้นหมู',category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น',pricePerKg:130,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:40,lunch:80,dinner:80}},
  {id:'mb02',code:'PKR-1002',name:'ลูกชิ้นไก่',category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น',pricePerKg:120,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:40,lunch:80,dinner:80}},
  {id:'mb03',code:'PKR-1003',name:'ลูกชิ้นปลา',category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น',pricePerKg:115,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:30,lunch:60,dinner:60}},
  {id:'mb04',code:'PKR-1004',name:'ไส้กรอกเวียนนา',category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น',pricePerKg:145,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:80,lunch:40,dinner:0}},
  {id:'mb05',code:'PKR-1005',name:'MIX เกาหลี (JKB-350)',category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น',pricePerKg:125,moq:1,bufferRate:20,unit:'pack',unitSize:3,defaultGrams:{breakfast:50,lunch:60,dinner:60}},
  {id:'mb06',code:'PKR-1006',name:'ทอดมันปลา',category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น',pricePerKg:175,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:70,dinner:70}},
  {id:'mb07',code:'PKR-1007',name:'ชีสโตะ ชีสดิป (JKB-4111)',category:'ลูกชิ้น/ไส้กรอก & ของทานเล่น',pricePerKg:56,moq:1,bufferRate:65,unit:'pack',unitSize:0.4,defaultGrams:{breakfast:30,lunch:25,dinner:25}},
  // ปลา
  {id:'f01',code:'PKR-1101',name:'ปลาซาบะนอร์เวย์ (JKB-232)',category:'ปลา',pricePerKg:175,moq:1,bufferRate:0,unit:'pack',unitSize:1,defaultGrams:{breakfast:0,lunch:100,dinner:130}},
  {id:'f02',code:'PKR-1102',name:'ปลาแซลมอนสไลด์',category:'ปลา',pricePerKg:680,moq:1,bufferRate:5,unit:'kg',defaultGrams:{breakfast:50,lunch:80,dinner:100}},
  {id:'f03',code:'PKR-1103',name:'ปลาดอรี่ (Fillet)',category:'ปลา',pricePerKg:120,moq:3,bufferRate:5,unit:'kg',defaultGrams:{breakfast:0,lunch:120,dinner:150}},
  {id:'f04',code:'PKR-1104',name:'เล้งหมู (JKB-4030)',category:'ปลา',pricePerKg:70,moq:3,bufferRate:20,unit:'kg',defaultGrams:{breakfast:0,lunch:100,dinner:120}},
  // ไข่/นม/เนย
  {id:'e01',code:'PKR-1201',name:'ไข่ไก่ (แผง 30 ฟอง)',category:'ไข่/นม/เนย',pricePerKg:65,moq:1,bufferRate:5,unit:'kg',defaultGrams:{breakfast:100,lunch:80,dinner:0}},
  {id:'e02',code:'PKR-1202',name:'เนยสด (Unsalted)',category:'ไข่/นม/เนย',pricePerKg:280,moq:1,bufferRate:5,unit:'kg',defaultGrams:{breakfast:20,lunch:15,dinner:15}},
  {id:'e03',code:'PKR-1203',name:'นมสด UHT',category:'ไข่/นม/เนย',pricePerKg:45,moq:2,bufferRate:5,unit:'kg',defaultGrams:{breakfast:200,lunch:0,dinner:0}},
];

function getIngredientById(id){ return INGREDIENTS.find(i=>i.id===id); }
function searchIngredients(q){
  if(!q) return INGREDIENTS.slice(0,20);
  q=q.toLowerCase().trim();
  return INGREDIENTS.filter(i=>i.name.toLowerCase().includes(q)||i.code.toLowerCase().includes(q)||i.category.toLowerCase().includes(q)).slice(0,20);
}
function catBadgeClass(cat){ return CAT_BADGE[cat]||'badge-stone'; }
function catColor(cat){ return CAT_COLOR[cat]||'#9CA3AF'; }
function catBadgeHtml(cat){ return `<span class="badge ${catBadgeClass(cat)}">${cat}</span>`; }