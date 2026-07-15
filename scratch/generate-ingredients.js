const fs = require('fs');
const path = require('path');

const CATEGORIES = [
  'ชิ้นส่วนหมู', 'หมูแปรรูป', 'หมูกระทะ/ชาบู', 
  'ชิ้นส่วนไก่', 'ไก่/หมัก/แปรรูป', 'ชิ้นส่วนเป็ด', 
  'ชิ้นส่วนวัว', 'วัว/แปรรูป', 'ลูกชิ้น/ไส้กรอก & ของทานเล่น', 
  'กุ้ง', 'หมึก', 'ปู'
];

const CAT_BADGE = {
  'ชิ้นส่วนหมู':'badge-pink','หมูแปรรูป':'badge-fuchsia','หมูกระทะ/ชาบู':'badge-orange',
  'ชิ้นส่วนไก่':'badge-yellow','ไก่/หมัก/แปรรูป':'badge-yellow','ชิ้นส่วนเป็ด':'badge-green',
  'ชิ้นส่วนวัว':'badge-red','วัว/แปรรูป':'badge-amber',
  'ลูกชิ้น/ไส้กรอก & ของทานเล่น':'badge-purple',
  'กุ้ง':'badge-rose','หมึก':'badge-blue','ปู':'badge-teal'
};

const CAT_COLOR = {
  'ชิ้นส่วนหมู':'#EC4899','หมูแปรรูป':'#F472B6','หมูกระทะ/ชาบู':'#FB923C',
  'ชิ้นส่วนไก่':'#EAB308','ไก่/หมัก/แปรรูป':'#CA8A04','ชิ้นส่วนเป็ด':'#22C55E',
  'ชิ้นส่วนวัว':'#EF4444','วัว/แปรรูป':'#F97316',
  'ลูกชิ้น/ไส้กรอก & ของทานเล่น':'#8B5CF6',
  'กุ้ง':'#E11D48','หมึก':'#3B82F6','ปู':'#14B8A6'
};

// Bases for generating names
const bases = {
  'ชิ้นส่วนหมู': ['หมูสามชั้น', 'หมูสันคอ', 'หมูสันใน', 'หมูสันนอก', 'ซี่โครงหมู', 'กระดูกอ่อน', 'ขาหมู', 'หัวหมู', 'เครื่องในหมู', 'ตับหมู'],
  'หมูแปรรูป': ['เบคอน', 'แฮมหมู', 'หมูยอ', 'กุนเชียง', 'ไส้กรอกหมู', 'หมูเด้ง', 'หมูบด', 'แคบหมู'],
  'หมูกระทะ/ชาบู': ['สามชั้นสไลด์', 'สันคอสไลด์', 'หมูนุ่ม', 'หมูหมักงา', 'เบคอนสไลด์', 'หมูหมักพริกไทยดำ'],
  'ชิ้นส่วนไก่': ['อกไก่', 'น่องไก่', 'สะโพกไก่', 'ปีกบนไก่', 'ปีกกลางไก่', 'ปลายปีกไก่', 'โครงไก่', 'ตีนไก่', 'เครื่องในไก่', 'ตับไก่', 'กึ๋นไก่', 'หัวใจไก่', 'เนื้อไก่บด'],
  'ไก่/หมัก/แปรรูป': ['ไก่ป๊อป', 'นักเก็ตไก่', 'ไก่จ๊อ', 'ไก่ทอดกระเทียม', 'ไก่นิวออร์ลีนส์', 'อกไก่นุ่ม', 'ไก่ยอ', 'สเต็กไก่'],
  'ชิ้นส่วนเป็ด': ['อกเป็ด', 'น่องเป็ด', 'เป็ดย่าง (ครึ่งตัว)', 'เนื้อเป็ดพะโล้', 'ตีนเป็ด', 'ปากเป็ด', 'เครื่องในเป็ด', 'ตับเป็ด', 'เป็ดสด (ตัว)', 'โครงเป็ด'],
  'ชิ้นส่วนวัว': ['เนื้อสันใน', 'เนื้อสันนอก', 'เนื้อริบอาย', 'เนื้อเสือร้องไห้', 'น่องลาย', 'เครื่องในวัว', 'ผ้าขี้ริ้ว'],
  'วัว/แปรรูป': ['เนื้อบด', 'ลูกชิ้นเนื้อ', 'เนื้อแดดเดียว', 'เบอร์เกอร์เนื้อ', 'ไส้กรอกเนื้อ'],
  'ลูกชิ้น/ไส้กรอก & ของทานเล่น': ['ลูกชิ้นหมู', 'ลูกชิ้นปลา', 'ลูกชิ้นกุ้ง', 'ไส้กรอกแดง', 'ปูอัด', 'เฟรนช์ฟรายส์', 'เกี๊ยวซ่า', 'เต้าหู้ปลา'],
  'กุ้ง': ['กุ้งขาว', 'กุ้งแชบ๊วย', 'กุ้งกุลาดำ', 'กุ้งแม่น้ำ', 'กุ้งฝอย', 'เนื้อกุ้งแกะ'],
  'หมึก': ['หมึกกล้วย', 'หมึกหอม', 'หมึกกระดอง', 'หมึกสาย', 'หนวดหมึก'],
  'ปู': ['ปูม้า', 'ปูทะเล', 'เนื้อปูก้อน', 'กรรเชียงปู']
};

const suffixes = [' (เกรด A)', ' (เกรด B)', ' หั่นชิ้น', ' สไลด์บาง', ' แช่แข็ง', ' สด', ' แบบแม็คโคร', ' ไซส์ S', ' ไซส์ M', ' ไซส์ L', ' ติดมัน', ' ลอกหนัง', ' (แบรนด์ CP)', ' (แบรนด์ Betagro)'];

function generateCategoryItems(catName, codePrefix, minCount) {
  const items = [];
  let count = 1;
  const baseList = bases[catName] || ['สินค้า'];
  
  while (items.length < minCount) {
    baseList.forEach(base => {
      if (items.length >= minCount) return;
      
      // Generate multiple variations for each base to reach the minCount
      // First variation is just the base name
      if (!items.some(i => i.name === base)) {
        items.push({
          id: `${codePrefix}_${count.toString().padStart(3, '0')}`,
          code: `${codePrefix}${count.toString().padStart(3, '0')}`,
          name: base,
          category: catName,
          pricePerKg: Math.floor(40 + Math.random() * 300),
          unit: 'kg',
          moq: Math.floor(1 + Math.random() * 9)
        });
        count++;
      }
      
      // Variations
      suffixes.forEach(suffix => {
        if (items.length >= minCount) return;
        const varName = base + suffix;
        if (!items.some(i => i.name === varName)) {
           items.push({
            id: `${codePrefix}_${count.toString().padStart(3, '0')}`,
            code: `${codePrefix}${count.toString().padStart(3, '0')}`,
            name: varName,
            category: catName,
            pricePerKg: Math.floor(40 + Math.random() * 300),
            unit: 'kg',
            moq: Math.floor(1 + Math.random() * 9)
          });
          count++;
        }
      });
    });
  }
  return items;
}

const allIngredients = [
  ...generateCategoryItems('ชิ้นส่วนหมู', 'P', 20),
  ...generateCategoryItems('หมูแปรรูป', 'PP', 15),
  ...generateCategoryItems('หมูกระทะ/ชาบู', 'PS', 10),
  ...generateCategoryItems('ชิ้นส่วนไก่', 'C', 40),
  ...generateCategoryItems('ไก่/หมัก/แปรรูป', 'CP', 30),
  ...generateCategoryItems('ชิ้นส่วนเป็ด', 'D', 35),
  ...generateCategoryItems('ชิ้นส่วนวัว', 'B', 10),
  ...generateCategoryItems('วัว/แปรรูป', 'BP', 8),
  ...generateCategoryItems('ลูกชิ้น/ไส้กรอก & ของทานเล่น', 'S', 10),
  ...generateCategoryItems('กุ้ง', 'SH', 15),
  ...generateCategoryItems('หมึก', 'SQ', 8),
  ...generateCategoryItems('ปู', 'CR', 5)
];

const fileContent = `/* eslint-disable */
// SmartProcure — Ingredient Data (Generated)

const CATEGORIES = ${JSON.stringify(CATEGORIES)};

const CAT_BADGE = ${JSON.stringify(CAT_BADGE, null, 2)};

const CAT_COLOR = ${JSON.stringify(CAT_COLOR, null, 2)};

const INGREDIENTS = ${JSON.stringify(allIngredients, null, 2)};

// Helper
function getIngredientById(id){ return INGREDIENTS.find(i=>i.id===id); }
function searchIngredients(q){
  if(!q) return INGREDIENTS.slice(0, 50);
  const lw = q.toLowerCase();
  return INGREDIENTS.filter(i=> i.name.toLowerCase().includes(lw) || i.code.toLowerCase().includes(lw) || i.category.toLowerCase().includes(lw)).slice(0,50);
}
function catBadgeHtml(cat) {
  const cls = CAT_BADGE[cat]||'badge-gray';
  return \`<span class="badge \${cls}">\${cat}</span>\`;
}
`;

fs.writeFileSync(path.join(__dirname, '../data/ingredients.js'), fileContent, 'utf-8');
console.log('Successfully generated data/ingredients.js with ' + allIngredients.length + ' items.');
