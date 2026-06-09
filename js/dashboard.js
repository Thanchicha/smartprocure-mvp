/**
 * dashboard.js — SmartProcure Core Engine v3
 * 4-Step calculation, meal-aware items, duplicate modal, reset seed
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

/* ─────────────────────────────────────────────
   STEP 1–4 CALCULATION ENGINE
───────────────────────────────────────────── */
function calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom) {
  return Math.round(totalRooms * (occupancyRate / 100) * guestsPerRoom);
}

function calcMealGuests(totalGuests, mealRate) {
  return Math.round(totalGuests * (mealRate / 100));
}

function calcRow(item, meal, mealGuests, bufferFactor, bufferRate) {
  const grams         = getGrams(item, meal);
  const baseKg        = (grams * mealGuests * bufferFactor) / 1000;
  const recommendedKg = baseKg * (1 + bufferRate / 100);
  const cost          = recommendedKg * item.pricePerKg;
  return { grams, baseKg, recommendedKg, cost };
}

function getHotelInputs() {
  return {
    totalRooms:    parseFloat(document.getElementById('total-rooms')?.value)     || 80,
    occupancyRate: parseFloat(document.getElementById('occupancy-rate')?.value)  || 75,
    guestsPerRoom: parseFloat(document.getElementById('guests-per-room')?.value) || 1.8,
    bufferRate:    parseFloat(document.getElementById('buffer-rate')?.value)     || 5,
  };
}

/* ─────────────────────────────────────────────
   MAIN RECALCULATE
───────────────────────────────────────────── */
function recalculate() {
  const { totalRooms, occupancyRate, guestsPerRoom, bufferRate } = getHotelInputs();
  const cfg          = getConfig();
  const totalGuests  = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom);
  const ms           = cfg.mealSettings[activeMeal];
  const mealGuests   = calcMealGuests(totalGuests, ms.mealRate);
  const bufferFactor = ms.bufferFactor;
  const items        = getAllItems().filter(i => isMealActive(i, activeMeal));

  const noteEl = document.getElementById('hotel-summary');
  if (noteEl) noteEl.innerHTML =
    `ห้องทั้งหมด <strong>${totalRooms}</strong> ห้อง × อัตรา <strong>${occupancyRate}%</strong> × <strong>${guestsPerRoom}</strong> คน/ห้อง = <strong>${totalGuests}</strong> คน`;
  const mealNoteEl = document.getElementById('meal-summary');
  if (mealNoteEl) mealNoteEl.innerHTML =
    `มื้อ${MEAL_META[activeMeal].label}: <strong>${ms.mealRate}%</strong> ≈ <strong>${mealGuests}</strong> คน · BufferFactor <strong>${bufferFactor}×</strong>`;

  let baseTotal = 0, recTotal = 0, costTotal = 0;
  items.forEach(item => {
    const r = calcRow(item, activeMeal, mealGuests, bufferFactor, bufferRate);
    baseTotal += r.baseKg;
    recTotal  += r.recommendedKg;
    costTotal += r.cost;
  });

  setText('card-guests', mealGuests.toLocaleString());
  setText('card-base',   baseTotal.toFixed(2));
  setText('card-rec',    recTotal.toFixed(2));
  setText('card-cost',   costTotal.toLocaleString('th-TH', { maximumFractionDigits: 0 }));
  const recLabel = document.getElementById('card-rec-label');
  if (recLabel) recLabel.textContent = `แนะนำสั่ง (+${bufferRate}%)`;

  renderTable(items, mealGuests, bufferFactor, bufferRate);
  renderAccordion(items, mealGuests, bufferFactor, bufferRate);
  renderDaily(totalRooms, occupancyRate, guestsPerRoom, bufferRate, cfg);
}

/* ─────────────────────────────────────────────
   GROUP BY CATEGORY
───────────────────────────────────────────── */
function groupByCategory(items) {
  const order = [], map = {};
  items.forEach(item => {
    if (!map[item.category]) { map[item.category] = []; order.push(item.category); }
    map[item.category].push(item);
  });
  return { order, map };
}

/* ─────────────────────────────────────────────
   DESKTOP TABLE
───────────────────────────────────────────── */
function renderTable(items, mealGuests, bufferFactor, bufferRate) {
  const tbody = document.getElementById('table-body');
  const empty = document.getElementById('empty-msg');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = '';
    empty && empty.classList.remove('hidden');
    return;
  }
  empty && empty.classList.add('hidden');

  const { order, map } = groupByCategory(items);
  let html = '';

  order.forEach(cat => {
    const catItems = map[cat];
    let catCost = 0;
    catItems.forEach(item => { catCost += calcRow(item, activeMeal, mealGuests, bufferFactor, bufferRate).cost; });

    html += `<tr class="cat-header-row">
      <td colspan="8" style="padding:0.5rem 0.875rem">
        <span class="badge ${CAT_BADGE[cat]||'badge-other'}" style="margin-right:0.5rem">${esc(cat)}</span>
        <span style="font-size:0.75rem;color:var(--muted)">${catItems.length} รายการ</span>
        <span style="float:right;font-weight:600;color:var(--orange)">฿${catCost.toLocaleString('th-TH',{maximumFractionDigits:0})}</span>
      </td><td></td>
    </tr>`;

    catItems.forEach(item => {
      const { grams, baseKg, recommendedKg, cost } = calcRow(item, activeMeal, mealGuests, bufferFactor, bufferRate);
      html += `<tr>
        <td><span style="display:inline-flex;align-items:center;gap:6px">
          <span style="width:7px;height:7px;border-radius:50%;background:var(--navy);opacity:.3;flex-shrink:0;display:inline-block"></span>
          <span style="font-weight:500">${esc(item.name)}</span>
        </span></td>
        <td><span class="badge ${CAT_BADGE[item.category]||'badge-other'}">${esc(item.category)}</span></td>
        <td class="tc">${grams}</td>
        <td class="tr" style="color:var(--muted)">${mealGuests.toLocaleString()}</td>
        <td class="tr" style="color:var(--muted)">${baseKg.toFixed(2)}</td>
        <td class="tr" style="font-weight:500">${recommendedKg.toFixed(2)}</td>
        <td class="tr" style="color:var(--muted)">${item.pricePerKg.toLocaleString()}</td>
        <td class="tr" style="font-weight:600;color:var(--orange)">${cost.toLocaleString('th-TH',{maximumFractionDigits:0})}</td>
        <td class="tc">
          <div style="display:flex;gap:4px;justify-content:center">
            <button class="edit-btn" onclick="openEditModal('${item.id}')">✎</button>
            <button class="del-btn" onclick="deleteItem('${item.id}')">✕</button>
          </div>
        </td>
      </tr>`;
    });
  });

  tbody.innerHTML = html;
}

/* ─────────────────────────────────────────────
   ACCORDION (MOBILE / TABLET)
───────────────────────────────────────────── */
function renderAccordion(items, mealGuests, bufferFactor, bufferRate) {
  const container = document.getElementById('accordion-list');
  if (!container) return;
  if (items.length === 0) { container.innerHTML = ''; return; }

  const { order, map } = groupByCategory(items);
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  let html = '';

  order.forEach(cat => {
    const catItems = map[cat];
    let catCost = 0;
    catItems.forEach(i => { catCost += calcRow(i, activeMeal, mealGuests, bufferFactor, bufferRate).cost; });

    if (accordionState[cat] === undefined) accordionState[cat] = false;
    const isOpen = accordionState[cat];
    const badge  = CAT_BADGE[cat] || 'badge-other';

    html += `<div class="ac-group">
      <button class="ac-header ${isOpen?'open':''}" onclick="toggleAccordion('${esc(cat)}')">
        <span class="ac-left">
          <span class="badge ${badge}">${esc(cat)}</span>
          <span class="ac-count">${catItems.length} รายการ</span>
        </span>
        <span class="ac-right">
          <span class="ac-total">฿${catCost.toLocaleString('th-TH',{maximumFractionDigits:0})}</span>
          <span class="ac-arrow ${isOpen?'open':''}">▼</span>
        </span>
      </button>
      <div class="ac-body ${isOpen?'open':''}">`;

    catItems.forEach(item => {
      const { grams, baseKg, recommendedKg, cost } = calcRow(item, activeMeal, mealGuests, bufferFactor, bufferRate);
      if (isTablet) {
        html += `<div class="ac-item tablet">
          <div class="ac-item-header">
            <span class="ac-item-name">${esc(item.name)}</span>
            <button class="edit-btn" onclick="openEditModal('${item.id}')">✎ แก้ไข</button>
          </div>
          <div class="ac-item-grid">
            <div class="ac-field"><span class="ac-flabel">กรัม/คน</span><span class="ac-fval">${grams}</span></div>
            <div class="ac-field"><span class="ac-flabel">แขก (คน)</span><span class="ac-fval">${mealGuests.toLocaleString()}</span></div>
            <div class="ac-field"><span class="ac-flabel">ฐาน (กก.)</span><span class="ac-fval">${baseKg.toFixed(2)}</span></div>
            <div class="ac-field"><span class="ac-flabel">แนะนำสั่ง (กก.)</span><span class="ac-fval bold">${recommendedKg.toFixed(2)}</span></div>
            <div class="ac-field"><span class="ac-flabel">ราคา/กก.</span><span class="ac-fval">${item.pricePerKg.toLocaleString()}</span></div>
            <div class="ac-field"><span class="ac-flabel">ค่าใช้จ่าย</span><span class="ac-fval orange bold">฿${cost.toLocaleString('th-TH',{maximumFractionDigits:0})}</span></div>
          </div>
        </div>`;
      } else {
        html += `<div class="ac-item mobile">
          <span class="ac-item-name">${esc(item.name)}</span>
          <span class="ac-item-price">${item.pricePerKg.toLocaleString()} ฿/กก.</span>
          <span class="ac-item-cost orange">฿${cost.toLocaleString('th-TH',{maximumFractionDigits:0})}</span>
          <button class="edit-btn" onclick="openEditModal('${item.id}')">✎</button>
        </div>`;
      }
    });
    html += `</div></div>`;
  });

  container.innerHTML = html;
}

function toggleAccordion(cat) {
  accordionState[cat] = !accordionState[cat];
  const { totalRooms, occupancyRate, guestsPerRoom, bufferRate } = getHotelInputs();
  const cfg   = getConfig();
  const tg    = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom);
  const ms    = cfg.mealSettings[activeMeal];
  const mg    = calcMealGuests(tg, ms.mealRate);
  const items = getAllItems().filter(i => isMealActive(i, activeMeal));
  renderAccordion(items, mg, ms.bufferFactor, bufferRate);
}

/* ─────────────────────────────────────────────
   MEAL CONFIG SECTION
───────────────────────────────────────────── */
function renderMealConfig() {
  const container = document.getElementById('meal-config-cards');
  if (!container) return;
  const cfg = getConfig();

  container.innerHTML = MEAL_KEYS.map(meal => {
    const ms   = cfg.mealSettings[meal];
    const meta = MEAL_META[meal];
    return `<div class="meal-cfg-card">
      <div class="meal-cfg-header">
        <span class="meal-cfg-icon">${meta.icon}</span>
        <span class="meal-cfg-label">${meta.label}</span>
      </div>
      <div class="field-group">
        <label class="field-label">สัดส่วนแขก (%)</label>
        <input type="number" class="field-input" min="0" max="100" value="${ms.mealRate}"
          onchange="saveMealCfg('${meal}','mealRate',this.value)" />
      </div>
      <div class="field-group" style="margin-top:0.5rem">
        <label class="field-label">BufferFactor (× เผื่อบุฟเฟต์)</label>
        <input type="number" class="field-input" min="1" step="0.05" value="${ms.bufferFactor}"
          onchange="saveMealCfg('${meal}','bufferFactor',this.value)" />
      </div>
    </div>`;
  }).join('');
}

function saveMealCfg(meal, field, value) {
  const cfg = getConfig();
  cfg.mealSettings[meal][field] = parseFloat(value) || 0;
  saveConfig(cfg);
  recalculate();
}

/* ─────────────────────────────────────────────
   DAILY SUMMARY & CHARTS
───────────────────────────────────────────── */
function renderDaily(totalRooms, occupancyRate, guestsPerRoom, bufferRate, cfg) {
  const dailyEl = document.getElementById('daily-cards');
  const barEl   = document.getElementById('bar-chart');
  const canvas  = document.getElementById('pie-canvas');
  const legEl   = document.getElementById('pie-legend');
  const allItems = getAllItems();

  const meals = {};
  let grandKg = 0, grandCost = 0;

  MEAL_KEYS.forEach(key => {
    const ms    = cfg.mealSettings[key];
    const tg    = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom);
    const mg    = calcMealGuests(tg, ms.mealRate);
    const items = allItems.filter(i => isMealActive(i, key));
    let kg = 0, cost = 0;
    items.forEach(item => {
      const r = calcRow(item, key, mg, ms.bufferFactor, bufferRate);
      kg   += r.recommendedKg;
      cost += r.cost;
    });
    meals[key] = { label: MEAL_META[key].label, kg, cost, mg, color: MEAL_META[key].barColor };
    grandKg   += kg;
    grandCost += cost;
  });

  if (dailyEl) {
    dailyEl.innerHTML =
      Object.values(meals).map(m => `
        <div class="daily-card">
          <p class="dc-label">${m.label} (${m.mg.toLocaleString()} คน)</p>
          <p class="dc-value">${m.kg.toFixed(1)} กก.</p>
          <p class="dc-cost">${m.cost.toLocaleString('th-TH',{maximumFractionDigits:0})} ฿</p>
        </div>`).join('') +
      `<div class="daily-card dark">
        <p class="dc-label-dk">รวมทั้งวัน</p>
        <p class="dc-value-dk">${grandKg.toFixed(1)} กก.</p>
        <p class="dc-cost-dk">${grandCost.toLocaleString('th-TH',{maximumFractionDigits:0})} ฿</p>
      </div>`;
  }

  if (barEl) {
    const maxKg = Math.max(...Object.values(meals).map(m => m.kg), 0.01);
    barEl.innerHTML = Object.entries(meals).map(([, m]) => {
      const pct = Math.max((m.kg / maxKg) * 100, 2);
      return `<div class="bar-col">
        <span class="bar-value">${m.kg.toFixed(1)}</span>
        <div class="bar-spacer"><div class="bar-fill" style="height:${pct}%;background:${m.color}"></div></div>
        <span class="bar-label">${m.label}</span>
      </div>`;
    }).join('');
  }

  const catMap = {};
  MEAL_KEYS.forEach(key => {
    const ms    = cfg.mealSettings[key];
    const tg    = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom);
    const mg    = calcMealGuests(tg, ms.mealRate);
    const items = allItems.filter(i => isMealActive(i, key));
    items.forEach(item => {
      const { recommendedKg } = calcRow(item, key, mg, ms.bufferFactor, bufferRate);
      catMap[item.category] = (catMap[item.category] || 0) + recommendedKg;
    });
  });

  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const total  = sorted.reduce((s, [, v]) => s + v, 0);

  if (canvas) {
    const wrap = canvas.parentElement;
    const size = Math.max(Math.min(wrap ? Math.floor(wrap.clientWidth * 0.45) : 160, 160), 120);
    canvas.width = size; canvas.height = size;
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';

    const ctx = canvas.getContext('2d');
    const cx = size / 2, cy = size / 2, r = cx * 0.9, ir = cx * 0.45;
    ctx.clearRect(0, 0, size, size);

    if (total > 0) {
      let angle = -Math.PI / 2;
      const slices = [];
      sorted.forEach(([cat, kg]) => {
        const sweep = (kg / total) * 2 * Math.PI;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,angle,angle+sweep); ctx.closePath();
        ctx.fillStyle = CAT_COLOR[cat] || '#9CA3AF'; ctx.fill();
        slices.push({ cat, kg, start: angle, end: angle + sweep, color: CAT_COLOR[cat] || '#9CA3AF' });
        angle += sweep;
      });
      ctx.beginPath(); ctx.arc(cx,cy,ir,0,2*Math.PI); ctx.fillStyle='#fff'; ctx.fill();
      ctx.fillStyle='#1E3A5F'; ctx.textAlign='center';
      ctx.font=`bold ${Math.round(size*0.08)}px Prompt,sans-serif`;
      ctx.fillText(total.toFixed(1), cx, cy - 2);
      ctx.font=`${Math.round(size*0.065)}px Prompt,sans-serif`;
      ctx.fillStyle='#6B7280';
      ctx.fillText('กก.', cx, cy + size * 0.085);

      let tip = document.getElementById('sp-pie-tip');
      if (!tip) { tip = document.createElement('div'); tip.id='sp-pie-tip'; tip.className='pie-tip'; document.body.appendChild(tip); }
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx=(e.clientX-rect.left)*(size/rect.width), sy=(e.clientY-rect.top)*(size/rect.height);
        const dx=sx-cx,dy=sy-cy,dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<ir||dist>r){tip.style.display='none';return;}
        let a=Math.atan2(dy,dx); if(a<-Math.PI/2) a+=2*Math.PI;
        const s=slices.find(sl=>a>=sl.start&&a<sl.end);
        if(s){tip.style.display='block';tip.style.left=(e.clientX+14)+'px';tip.style.top=(e.clientY-24)+'px';
          tip.innerHTML=`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px;vertical-align:middle"></span>${esc(s.cat)}: <strong>${s.kg.toFixed(1)} กก.</strong> (${((s.kg/total)*100).toFixed(1)}%)`;}
        else tip.style.display='none';
      };
      canvas.onmouseleave = () => { tip.style.display='none'; };
    } else {
      ctx.fillStyle='#E5E7EB'; ctx.beginPath(); ctx.arc(cx,cy,r,0,2*Math.PI); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,cy,ir,0,2*Math.PI); ctx.fill();
      ctx.fillStyle='#9CA3AF'; ctx.textAlign='center'; ctx.font='11px Prompt,sans-serif';
      ctx.fillText('ไม่มีข้อมูล', cx, cy+4);
    }
  }

  if (legEl) {
    legEl.innerHTML = sorted.map(([cat, kg]) =>
      `<div class="pie-item"><div class="pie-dot" style="background:${CAT_COLOR[cat]||'#9CA3AF'}"></div>
       <span class="pie-cat">${esc(cat)}</span><span class="pie-val">${kg.toFixed(1)}</span></div>`
    ).join('');
  }
}

/* ─────────────────────────────────────────────
   TOGGLE NEW-ITEM GRAMS VISIBILITY
───────────────────────────────────────────── */
function toggleNewGrams(meal) {
  const cb  = document.getElementById(`new-cb-${meal}`);
  const row = document.getElementById(`new-grams-row-${meal}`);
  if (row) row.classList.toggle('hidden', !cb?.checked);
}

/* ─────────────────────────────────────────────
   ADD ITEM (with duplicate check)
───────────────────────────────────────────── */
function addItem() {
  const name  = document.getElementById('new-name')?.value.trim();
  const cat   = document.getElementById('new-cat')?.value;
  const price = parseFloat(document.getElementById('new-price')?.value) || 0;

  if (!name) { alert('กรุณากรอกชื่อวัตถุดิบ'); return; }

  // Duplicate check — show modal instead of alert
  const existing = itemExistsByName(name);
  if (existing) { showDupModal(existing); return; }

  // Build meals object from checkboxes
  const meals = {};
  let anyActive = false;
  MEAL_KEYS.forEach(meal => {
    const cb = document.getElementById(`new-cb-${meal}`);
    const gr = document.getElementById(`new-g-${meal}`);
    const active = cb?.checked || false;
    const grams  = active ? (parseFloat(gr?.value) || 0) : 0;
    meals[meal]  = { active, grams };
    if (active) anyActive = true;
  });

  if (!anyActive) { alert('กรุณาเลือกอย่างน้อย 1 มื้อ'); return; }

  addItemToDB({ id: 'u' + Date.now(), name, category: cat, meals, pricePerKg: price });

  document.getElementById('new-name').value  = '';
  document.getElementById('new-price').value = 0;
  MEAL_KEYS.forEach(meal => {
    const cb = document.getElementById(`new-cb-${meal}`);
    const gr = document.getElementById(`new-g-${meal}`);
    if (cb) cb.checked = false;
    if (gr) { gr.value = 100; gr.closest('.new-grams-row')?.classList.add('hidden'); }
  });
  recalculate();
}

function deleteItem(id) {
  removeItemFromDB(id);
  recalculate();
}

/* ─────────────────────────────────────────────
   RESET SEED
───────────────────────────────────────────── */
function handleResetSeed() {
  if (!confirm('รีเซ็ตข้อมูลตัวอย่างหรือไม่?\nรายการที่มีชื่อซ้ำจะไม่ถูก overwrite')) return;
  const added = seedDefaultItems();
  recalculate();
  showToast(added > 0 ? `เพิ่มข้อมูลตัวอย่าง ${added} รายการแล้ว` : 'ไม่มีรายการใหม่ (มีครบแล้ว)');
}

/* ─────────────────────────────────────────────
   TOAST NOTIFICATION
───────────────────────────────────────────── */
function showToast(msg) {
  let toast = document.getElementById('sp-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sp-toast';
    toast.style.cssText = `
      position:fixed;bottom:1.5rem;right:1.5rem;z-index:1000;
      background:var(--navy);color:#fff;font-family:var(--font);
      font-size:0.875rem;padding:0.75rem 1.25rem;border-radius:0.625rem;
      box-shadow:0 4px 20px rgba(0,0,0,0.2);
      opacity:0;transition:opacity 0.25s;pointer-events:none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

/* ─────────────────────────────────────────────
   MEAL TAB
───────────────────────────────────────────── */
function selectMeal(meal) {
  activeMeal = meal;
  document.querySelectorAll('#meal-tabs .tab').forEach(btn => {
    btn.className = 'tab' + (btn.dataset.meal === meal ? ' active' : '');
  });
  recalculate();
}

/* ─────────────────────────────────────────────
   DUPLICATE MODAL
───────────────────────────────────────────── */
function showDupModal(item) {
  // Build meal info rows
  const mealRows = MEAL_KEYS
    .filter(m => isMealActive(item, m))
    .map(m => `<div class="dup-row">
      <span class="dup-label">${MEAL_META[m].icon} ${MEAL_META[m].label}</span>
      <span class="dup-val">${getGrams(item, m)} กรัม/คน</span>
    </div>`).join('');

  const info = document.getElementById('dup-info');
  if (info) info.innerHTML = `
    <div class="dup-row"><span class="dup-label">ชื่อ</span><span class="dup-val bold">${esc(item.name)}</span></div>
    <div class="dup-row"><span class="dup-label">หมวดหมู่</span><span class="dup-val">${esc(item.category)}</span></div>
    <div class="dup-row"><span class="dup-label">ราคา/กก.</span><span class="dup-val">${item.pricePerKg.toLocaleString()} ฿</span></div>
    ${mealRows ? `<div style="margin-top:0.5rem;font-size:0.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;padding:0.25rem 0">มื้อที่ใช้</div>${mealRows}` : ''}
  `;

  // Wire the edit button to open edit modal for this item
  const editBtn = document.getElementById('dup-edit-btn');
  if (editBtn) {
    editBtn.onclick = () => openEditModalFromDuplicate(item.id);
  }

  document.getElementById('dup-modal')?.classList.remove('hidden');
}

function openEditModalFromDuplicate(id) {
  document.getElementById('dup-modal')?.classList.add('hidden');
  openEditModal(id);
}

function closeDupModal(e) {
  if (e && e.target !== document.getElementById('dup-modal')) return;
  document.getElementById('dup-modal')?.classList.add('hidden');
}

/* ─────────────────────────────────────────────
   EDIT MODAL
───────────────────────────────────────────── */
function openEditModal(id) {
  const item = getAllItems().find(i => i.id === id);
  if (!item) return;
  editingItemId = id;

  setText('em-name',  item.name);
  setText('em-cat',   item.category);
  setText('em-price', item.pricePerKg.toLocaleString() + ' ฿/กก.');

  MEAL_KEYS.forEach(meal => {
    const cb  = document.getElementById(`em-cb-${meal}`);
    const inp = document.getElementById(`em-g-${meal}`);
    const row = document.getElementById(`em-grams-row-${meal}`);
    const active = isMealActive(item, meal);
    const grams  = getGrams(item, meal);
    if (cb)  cb.checked = active;
    if (inp) inp.value  = grams;
    if (row) row.style.display = active ? 'flex' : 'none';
  });

  updateEditCalc(item);
  document.getElementById('edit-modal')?.classList.remove('hidden');
}

function toggleEditMealRow(meal) {
  const cb  = document.getElementById(`em-cb-${meal}`);
  const row = document.getElementById(`em-grams-row-${meal}`);
  if (row) row.style.display = cb?.checked ? 'flex' : 'none';
  const item = editingItemId ? getAllItems().find(i => i.id === editingItemId) : null;
  if (item) updateEditCalc(item);
}

function updateEditCalc(item) {
  const { totalRooms, occupancyRate, guestsPerRoom, bufferRate } = getHotelInputs();
  const cfg = getConfig();
  const ms  = cfg.mealSettings[activeMeal];
  const tg  = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom);
  const mg  = calcMealGuests(tg, ms.mealRate);

  const cb    = document.getElementById(`em-cb-${activeMeal}`);
  const inp   = document.getElementById(`em-g-${activeMeal}`);
  const grams = cb?.checked ? (parseFloat(inp?.value) || 0) : 0;

  const baseKg        = (grams * mg * ms.bufferFactor) / 1000;
  const recommendedKg = baseKg * (1 + bufferRate / 100);
  const cost          = recommendedKg * item.pricePerKg;

  setText('em-base', baseKg.toFixed(2) + ' กก.');
  setText('em-rec',  recommendedKg.toFixed(2) + ' กก.');
  setText('em-cost', cost.toLocaleString('th-TH',{maximumFractionDigits:0}) + ' ฿');
  const recLabel = document.getElementById('em-rec-label');
  if (recLabel) recLabel.textContent = `แนะนำสั่ง (+${bufferRate}%)`;
}

function saveEdit() {
  if (!editingItemId) return;
  MEAL_KEYS.forEach(meal => {
    const cb  = document.getElementById(`em-cb-${meal}`);
    const inp = document.getElementById(`em-g-${meal}`);
    updateItemMeal(editingItemId, meal, cb?.checked || false, parseFloat(inp?.value) || 0);
  });
  closeEditModal();
  recalculate();
}

function deleteFromModal() {
  if (!editingItemId) return;
  if (!confirm('ลบวัตถุดิบนี้ออกจากรายการ?')) return;
  removeItemFromDB(editingItemId);
  closeEditModal();
  recalculate();
}

function closeEditModal(e) {
  if (e && e.target !== document.getElementById('edit-modal')) return;
  document.getElementById('edit-modal')?.classList.add('hidden');
  editingItemId = null;
}

/* ─────────────────────────────────────────────
   CSV EXPORT
───────────────────────────────────────────── */
function exportCSV() {
  const { totalRooms, occupancyRate, guestsPerRoom, bufferRate } = getHotelInputs();
  const cfg   = getConfig();
  const ms    = cfg.mealSettings[activeMeal];
  const tg    = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom);
  const mg    = calcMealGuests(tg, ms.mealRate);
  const items = getAllItems().filter(i => isMealActive(i, activeMeal));
  const today = new Date().toISOString().slice(0,10);
  const label = MEAL_META[activeMeal].label;

  const headers = ['ชื่อวัตถุดิบ','หมวดหมู่','กรัม/คน','แขก(คน)','ฐาน(กก.)','แนะนำสั่ง(กก.)','ราคา/กก.','ค่าใช้จ่าย(฿)'];
  const rows = items.map(item => {
    const { grams, baseKg, recommendedKg, cost } = calcRow(item, activeMeal, mg, ms.bufferFactor, bufferRate);
    return [item.name, item.category, grams, mg, baseKg.toFixed(2), recommendedKg.toFixed(2), item.pricePerKg, cost.toFixed(0)];
  });
  const csv  = '\uFEFF' + [headers,...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'),{href:url,download:`SmartProcure_${label}_${today}.csv`});
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────── */
function setText(id, text) { const el=document.getElementById(id); if(el) el.textContent=text; }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ─────────────────────────────────────────────
   AUTOCOMPLETE
───────────────────────────────────────────── */
function initAutocomplete() {
  const inp = document.getElementById('new-name');
  if (!inp) return;
  const wrap = document.createElement('div');
  wrap.className = 'autocomplete-wrap';
  inp.parentNode.insertBefore(wrap, inp);
  wrap.appendChild(inp);
  const drop = document.createElement('div');
  drop.className = 'autocomplete-drop'; drop.id = 'ac-drop';
  wrap.appendChild(drop);

  function openDrop(items, query) {
    if (!query) { closeDrop(); return; }
    const q = query.toLowerCase();
    const matches = items.filter(i => i.name.toLowerCase().includes(q)).slice(0,5);
    if (matches.length === 0) {
      drop.innerHTML = `<div class="autocomplete-empty">ไม่พบวัตถุดิบ — กรอกข้อมูลเองได้เลย</div>`;
    } else {
      drop.innerHTML = matches.map(item => {
        const idx = item.name.toLowerCase().indexOf(q);
        const pre=esc(item.name.slice(0,idx)), hi=esc(item.name.slice(idx,idx+query.length)), post=esc(item.name.slice(idx+query.length));
        return `<div class="autocomplete-item" data-id="${item.id}"><span>${pre}<span class="ac-match">${hi}</span>${post}</span><span class="ac-badge">${esc(item.category)}</span></div>`;
      }).join('');
      drop.querySelectorAll('.autocomplete-item').forEach(el => {
        el.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const item = items.find(i => i.id === el.dataset.id);
          if (!item) return;
          inp.value = item.name;
          const catSel   = document.getElementById('new-cat');
          const priceInp = document.getElementById('new-price');
          if (catSel)   catSel.value   = item.category;
          if (priceInp) priceInp.value = item.pricePerKg;
          MEAL_KEYS.forEach(meal => {
            const cb = document.getElementById(`new-cb-${meal}`);
            const gr = document.getElementById(`new-g-${meal}`);
            const row = gr?.closest('.new-grams-row');
            if (cb && item.meals?.[meal]) {
              cb.checked = item.meals[meal].active;
              if (gr) gr.value = item.meals[meal].grams;
              if (row) row.classList.toggle('hidden', !cb.checked);
            }
          });
          closeDrop();
        });
      });
    }
    drop.classList.add('open');
  }
  function closeDrop() { drop.classList.remove('open'); drop.innerHTML=''; }
  inp.addEventListener('input', () => openDrop(getAllItems(), inp.value.trim()));
  inp.addEventListener('keydown', e => { if(e.key==='Escape') closeDrop(); });
  document.addEventListener('click', e => { if(!wrap.contains(e.target)) closeDrop(); });
}

/* ─────────────────────────────────────────────
   BOOT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderMealConfig();
  recalculate();
  initAutocomplete();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => recalculate(), 150);
  });
});
