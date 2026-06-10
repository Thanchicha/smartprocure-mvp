/**
 * main.js — ศูนย์ควบคุมและเชื่อมโยง Event Listener ต่างๆ
 */

function onMethodChange() {
  const method = document.getElementById("calc-method-select").value;
  const divRooms = document.getElementById("container-total-rooms");
  const divOcc = document.getElementById("container-occupancy-rate");
  const divOccupied = document.getElementById("container-occupied-rooms");
  const divGpr = document.getElementById("container-guests-per-room");
  const divExact = document.getElementById("container-exact-guests");
  
  const inpRooms = document.getElementById("total-rooms");
  const inpOcc = document.getElementById("occupancy-rate");
  const inpOccupied = document.getElementById("occupied-rooms");
  const inpGpr = document.getElementById("guests-per-room");
  const inpExact = document.getElementById("exact-guests");

  inpRooms.disabled = false; inpOcc.disabled = false; inpOccupied.disabled = false;
  inpGpr.disabled = false; inpExact.disabled = false;
  
  if (method === "method1") {
    divRooms.style.display = "block"; divOcc.style.display = "block"; divOccupied.style.display = "block";
    divGpr.style.display = "block"; divExact.style.display = "block";
    inpOccupied.disabled = true; inpExact.disabled = true;
    inpOccupied.style.backgroundColor = "var(--off-white)"; inpExact.style.backgroundColor = "var(--off-white)";
  } else if (method === "method2") {
    divRooms.style.display = "none"; divOcc.style.display = "none"; divOccupied.style.display = "block";
    divGpr.style.display = "block"; divExact.style.display = "block";
    inpExact.disabled = true; inpExact.style.backgroundColor = "var(--off-white)"; inpOccupied.style.backgroundColor = "var(--white)";
  } else if (method === "method3") {
    divRooms.style.display = "none"; divOcc.style.display = "none"; divOccupied.style.display = "none";
    divGpr.style.display = "none"; divExact.style.display = "block";
    inpExact.style.backgroundColor = "var(--white)";
  }
  recalculate();
}

function onOccupiedRoomsInput() {
  const method = document.getElementById("calc-method-select").value;
  if (method === "method2") {
    const occupiedRooms = parseFloat(document.getElementById("occupied-rooms").value) || 0;
    const guestsPerRoom = parseFloat(document.getElementById("guests-per-room").value) || 1.8;
    document.getElementById("exact-guests").value = Math.round(occupiedRooms * guestsPerRoom);
  }
  recalculate();
}

function recalculate() {
  const method = document.getElementById("calc-method-select")?.value || "method1";
  const bufferRate = parseFloat(document.getElementById("buffer-rate")?.value) || 5;
  
  let totalRooms = parseFloat(document.getElementById("total-rooms")?.value) || 80;
  let occupancyRate = parseFloat(document.getElementById("occupancy-rate")?.value) || 75;
  let occupiedRooms = parseFloat(document.getElementById("occupied-rooms")?.value) || 60;
  let guestsPerRoom = parseFloat(document.getElementById("guests-per-room")?.value) || 1.8;
  let totalGuests = parseFloat(document.getElementById("exact-guests")?.value) || 108;

  if (method === "method1") {
    occupiedRooms = Math.round(totalRooms * (occupancyRate / 100));
    totalGuests = Math.round(occupiedRooms * guestsPerRoom);
    if (document.getElementById("occupied-rooms")) document.getElementById("occupied-rooms").value = occupiedRooms;
    if (document.getElementById("exact-guests")) document.getElementById("exact-guests").value = totalGuests;
  } else if (method === "method2") {
    totalGuests = Math.round(occupiedRooms * guestsPerRoom);
    if (document.getElementById("exact-guests")) document.getElementById("exact-guests").value = totalGuests;
  } 

  const cfg = getConfig();
  const ms = cfg.mealSettings[activeMeal];
  const mealGuests = Math.round(totalGuests * (ms.mealRate / 100));
  const bufferFactor = ms.bufferFactor;
  const items = getAllItems().filter(i => isMealActive(i, activeMeal));

  const noteEl = document.getElementById('hotel-summary');
  if (noteEl) {
    if (method === "method1") noteEl.innerHTML = `ห้องทั้งหมด ${totalRooms} ห้อง × อัตราเข้าพัก ${occupancyRate}% = พักจริง ${occupiedRooms} ห้อง → แขกรวม ≈ ${totalGuests} คน`;
    else if (method === "method2") noteEl.innerHTML = `พักจริง ${occupiedRooms} ห้อง × ${guestsPerRoom} คน/ห้อง = แขกรวม ≈ ${totalGuests} คน`;
    else noteEl.innerHTML = `ผู้เข้าพักจริงสุทธิรวม ${totalGuests} คน`;
  }
  
  const targetGuests = Math.round(totalGuests * (1 + (bufferRate / 100)));
  const mealNoteEl = document.getElementById('meal-summary');
  if (mealNoteEl) {
    mealNoteEl.innerHTML = `จำนวนแขกพักจริง ${totalGuests} คน × เผื่อสูญเสีย ${bufferRate}% = จำนวนแนะนำให้สั่งสำหรับ ${targetGuests} คน`;
  }

  let baseTotal = 0, recTotal = 0, costTotal = 0;
  items.forEach(item => {
    const r = calcRow(item, activeMeal, mealGuests, bufferFactor, bufferRate);
    baseTotal += r.baseKg; recTotal += r.recommendedKg; costTotal += r.cost;
  });

  setText('card-guests', mealGuests.toLocaleString());
  setText('card-base', baseTotal.toFixed(2));
  setText('card-rec', recTotal.toFixed(2));
  setText('card-cost', costTotal.toLocaleString('th-TH', { maximumFractionDigits: 0 }));
  
  const recLabel = document.getElementById('card-rec-label');
  if (recLabel) recLabel.textContent = `แนะนำสั่ง (+${bufferRate}%)`;

  renderTable(items, mealGuests, bufferFactor, bufferRate);
  renderAccordion(items, mealGuests, bufferFactor, bufferRate);
  renderDaily(totalRooms, occupancyRate, guestsPerRoom, bufferRate, cfg);
}

function saveMealCfg(meal, field, value) {
  const cfg = getConfig();
  cfg.mealSettings[meal][field] = parseFloat(value) || 0;
  saveConfig(cfg);
  recalculate();
}

function addItem() {
  const name = document.getElementById('new-name')?.value.trim();
  const cat = document.getElementById('new-cat')?.value;
  const price = parseFloat(document.getElementById('new-price')?.value) || 0;
  if (!name) { alert('กรุณากรอกชื่อวัตถุดิบ'); return; }

  const existing = itemExistsByName(name);
  if (existing) { showDupModal(existing); return; }

  const meals = {}; let anyActive = false;
  MEAL_KEYS.forEach(meal => {
    const cb = document.getElementById(`new-cb-${meal}`), gr = document.getElementById(`new-g-${meal}`);
    const active = cb?.checked || false, grams = active ? (parseFloat(gr?.value) || 0) : 0;
    meals[meal] = { active, grams }; if (active) anyActive = true;
  });

  if (!anyActive) { alert('กรุณาเลือกอย่างน้อย 1 มื้อ'); return; }

  addItemToDB({ id: 'u' + Date.now(), name, category: cat, meals, pricePerKg: price });

  document.getElementById('new-name').value = ''; document.getElementById('new-price').value = 0;
  MEAL_KEYS.forEach(meal => {
    const cb = document.getElementById(`new-cb-${meal}`), gr = document.getElementById(`new-g-${meal}`);
    if (cb) cb.checked = false; if (gr) { gr.value = 100; gr.closest('.new-grams-row')?.classList.add('hidden'); }
  });
  recalculate();
}

function deleteItem(id) { removeItemFromDB(id); recalculate(); }
function saveEdit() {
  if (!editingItemId) return;
  MEAL_KEYS.forEach(meal => {
    const cb = document.getElementById(`em-cb-${meal}`), inp = document.getElementById(`em-g-${meal}`);
    updateItemMeal(editingItemId, meal, cb?.checked || false, parseFloat(inp?.value) || 0);
  });
  closeEditModal(); recalculate();
}
function deleteFromModal() {
  if (!editingItemId) return;
  if (!confirm('ลบวัตถุดิบนี้ออกจากรายการ?')) return;
  removeItemFromDB(editingItemId); closeEditModal(); recalculate();
}

function handleResetSeed() {
  if (!confirm('รีเซ็ตข้อมูลตัวอย่างหรือไม่?\nรายการที่มีชื่อซ้ำจะไม่ถูก overwrite')) return;
  const added = seedDefaultItems();
  recalculate();
  showToast(added > 0 ? `เพิ่มข้อมูลตัวอย่าง ${added} รายการแล้ว` : 'ไม่มีรายการใหม่ (มีครบแล้ว)');
}

function selectMeal(meal) {
  activeMeal = meal;
  document.querySelectorAll('#meal-tabs .tab').forEach(btn => { btn.className = 'tab' + (btn.dataset.meal === meal ? ' active' : ''); });
  recalculate();
}

function exportCSV() {
  const { totalRooms, occupancyRate, guestsPerRoom, bufferRate } = getHotelInputs();
  const cfg = getConfig(), ms = cfg.mealSettings[activeMeal], tg = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom), mg = calcMealGuests(tg, ms.mealRate);
  const items = getAllItems().filter(i => isMealActive(i, activeMeal)), today = new Date().toISOString().slice(0,10), label = MEAL_META[activeMeal].label;
  const headers = ['ชื่อวัตถุดิบ','หมวดหมู่','กรัม/คน','แขก(คน)','ฐาน(กก.)','แนะนำสั่ง(กก.)','ราคา/กก.','ค่าใช้จ่าย(฿)'];
  const rows = items.map(item => {
    const { grams, baseKg, recommendedKg, cost } = calcRow(item, activeMeal, mg, ms.bufferFactor, bufferRate);
    return [item.name, item.category, grams, mg, baseKg.toFixed(2), recommendedKg.toFixed(2), item.pricePerKg, cost.toFixed(0)];
  });
  const csv = '\uFEFF' + [headers,...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'),{href:url,download:`SmartProcure_${label}_${today}.csv`});
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
  renderMealConfig();
  onMethodChange();
  initAutocomplete();
  
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => recalculate(), 150);
  });
});