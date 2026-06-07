/**
 * dashboard.js — SmartProcure Core Engine
 * Features: grouped table, accordion (mobile/tablet), duplicate modal,
 *           bar chart distinct colors, pie chart fix, edit page link, CSV export.
 */

/* ── Meal Config ── */
const MEAL_CFG = {
  breakfast: { key: "meal.breakfast", rate: 90, color: "#2145B0" },
  lunch: { key: "meal.lunch", rate: 70, color: "#1A2F6E" },
  dinner: { key: "meal.dinner", rate: 80, color: "#0F1A3E" },
};

/* ── State ── */
let activeMeal = "breakfast";
const accordionOpen = {}; // catName → bool

/* ── Inputs ── */
function getInputs() {
  return {
    totalRooms: parseFloat(document.getElementById("total-rooms")?.value) || 80,
    occupancyRate:
      parseFloat(document.getElementById("occupancy-rate")?.value) || 75,
    guestsPerRoom:
      parseFloat(document.getElementById("guests-per-room")?.value) || 1.8,
    bufferRate: parseFloat(document.getElementById("buffer-rate")?.value) || 5,
  };
}

/* ── Calculation ── */
function calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom) {
  return Math.round(totalRooms * (occupancyRate / 100) * guestsPerRoom);
}
function calcMealGuests(totalGuests, mealRate) {
  return Math.round(totalGuests * (mealRate / 100));
}
function calcRow(item, mealGuests, bufferRate, meal) {
  const grams = getGrams(item, meal);
  const baseKg = (grams * mealGuests) / 1000;
  const recommendedKg = baseKg * (1 + bufferRate / 100);
  const cost = recommendedKg * item.pricePerKg;
  return { grams, baseKg, recommendedKg, cost };
}

/* ── Group items by category ── */
function groupByCategory(items) {
  const map = {};
  items.forEach((item) => {
    if (!map[item.category]) map[item.category] = [];
    map[item.category].push(item);
  });
  return map;
}

/* ── Main Recalculate ── */
function recalculate() {
  const { totalRooms, occupancyRate, guestsPerRoom, bufferRate } = getInputs();
  const totalGuests = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom);
  const occupiedRooms = Math.round(totalRooms * (occupancyRate / 100));
  const mealRate = MEAL_CFG[activeMeal].rate;
  const mealGuests = calcMealGuests(totalGuests, mealRate);
  const items = getAllItems();

  /* Hotel summary */
  const hotelEl = document.getElementById("hotel-summary");
  if (hotelEl)
    hotelEl.innerHTML = `ห้องที่ใช้งาน: <strong>${occupiedRooms}</strong> ห้อง → ผู้เข้าพักรวม ≈ <strong>${totalGuests}</strong> คน`;

  /* Meal summary */
  const mealEl = document.getElementById("meal-summary");
  if (mealEl)
    mealEl.innerHTML = `มื้อนี้ (${mealRate}% ของผู้เข้าพัก) ≈ <strong>${mealGuests}</strong> คน`;

  /* Totals */
  let baseTotal = 0,
    recTotal = 0,
    costTotal = 0;
  items.forEach((item) => {
    const r = calcRow(item, mealGuests, bufferRate, activeMeal);
    baseTotal += r.baseKg;
    recTotal += r.recommendedKg;
    costTotal += r.cost;
  });

  setText("card-guests", mealGuests.toLocaleString());
  setText("card-base", baseTotal.toFixed(2));
  setText("card-rec", recTotal.toFixed(2));
  setText(
    "card-cost",
    costTotal.toLocaleString("th-TH", { maximumFractionDigits: 0 }),
  );
  const recLabel = document.getElementById("card-rec-label");
  if (recLabel) recLabel.textContent = `แนะนำสั่ง (+${bufferRate}%)`;

  renderTable(items, mealGuests, bufferRate);
  renderAccordion(items, mealGuests, bufferRate);
  renderDaily(items, totalRooms, occupancyRate, guestsPerRoom, bufferRate);
}

/* ── Desktop Table (grouped) ── */
function renderTable(items, mealGuests, bufferRate) {
  const tbody = document.getElementById("table-body");
  const empty = document.getElementById("empty-msg");
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }
  empty?.classList.add("hidden");

  const grouped = groupByCategory(items);
  let html = "";

  Object.entries(grouped).forEach(([cat, catItems]) => {
    // Category cost total
    let catCost = 0;
    catItems.forEach((item) => {
      catCost += calcRow(item, mealGuests, bufferRate, activeMeal).cost;
    });

    // Category header row
    html += `<tr class="cat-header-row">
      <td colspan="9">
        <span class="cat-header-name">${esc(cat)}</span>
        <span class="cat-header-cost">${catCost.toLocaleString("th-TH", { maximumFractionDigits: 0 })} ฿</span>
      </td>
    </tr>`;

    catItems.forEach((item) => {
      const { grams, baseKg, recommendedKg, cost } = calcRow(
        item,
        mealGuests,
        bufferRate,
        activeMeal,
      );
      html += `<tr>
        <td><span style="font-weight:500">${esc(item.name)}</span></td>
        <td><span class="badge ${CAT_BADGE[item.category] || "badge-other"}">${esc(item.category)}</span></td>
        <td class="tc">
          <input type="number" value="${grams}" min="0" data-id="${item.id}" data-meal="${activeMeal}"
            class="field-input" style="width:72px;text-align:center;padding:0.3rem 0.5rem"
            onchange="onGramsChange(this)" />
        </td>
        <td class="tr muted">${baseKg.toFixed(2)}</td>
        <td class="tr fw6">${recommendedKg.toFixed(2)}</td>
        <td>
          <div class="prog-wrap">
            <div class="prog-bg"><div class="prog-bar" style="width:${Math.min(bufferRate * 5, 100)}%"></div></div>
            <span class="prog-label">${bufferRate}%</span>
          </div>
        </td>
        <td class="tr muted">${item.pricePerKg.toLocaleString()}</td>
        <td class="tr fw6 orange">${cost.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</td>
        <td class="tc">
          <div style="display:flex;gap:4px;justify-content:center">
            <a href="ingredient-detail.html?id=${item.id}" class="btn-edit" title="แก้ไข">✏️</a>
            <button class="del-btn" onclick="deleteItem('${item.id}')">✕</button>
          </div>
        </td>
      </tr>`;
    });
  });

  tbody.innerHTML = html;
}

/* ── Mobile/Tablet Accordion ── */
function renderAccordion(items, mealGuests, bufferRate) {
  const wrap = document.getElementById("accordion-wrap");
  if (!wrap) return;

  if (items.length === 0) {
    wrap.innerHTML =
      '<div class="empty-state" style="padding:2rem">ยังไม่มีรายการ</div>';
    return;
  }

  const grouped = groupByCategory(items);
  let html = "";

  Object.entries(grouped).forEach(([cat, catItems]) => {
    let catCost = 0;
    catItems.forEach((item) => {
      catCost += calcRow(item, mealGuests, bufferRate, activeMeal).cost;
    });

    const isOpen = accordionOpen[cat] !== false; // default open
    const openCls = isOpen ? "open" : "";

    html += `<div class="acc-group">
      <div class="acc-header ${openCls}" onclick="toggleAccordion('${esc(cat)}')">
        <div class="acc-header-left">
          <span class="acc-cat-name">${esc(cat)}</span>
          <span class="acc-count">${catItems.length} รายการ</span>
        </div>
        <div class="acc-header-right">
          <span class="acc-cat-cost">${catCost.toLocaleString("th-TH", { maximumFractionDigits: 0 })} ฿</span>
          <span class="acc-arrow">${isOpen ? "▲" : "▼"}</span>
        </div>
      </div>
      <div class="acc-body" style="display:${isOpen ? "block" : "none"}">`;

    catItems.forEach((item) => {
      const { grams, baseKg, recommendedKg, cost } = calcRow(
        item,
        mealGuests,
        bufferRate,
        activeMeal,
      );
      html += `<div class="acc-item">
        <div class="acc-item-main">
          <span class="acc-item-name">${esc(item.name)}</span>
          <div class="acc-item-actions">
            <a href="ingredient-detail.html?id=${item.id}" class="btn-edit" title="แก้ไข">✏️</a>
            <button class="del-btn" onclick="deleteItem('${item.id}')">✕</button>
          </div>
        </div>
        <div class="acc-item-detail">
          <div class="acc-detail-row">
            <span class="acc-detail-label">กรัม/คน</span>
            <input type="number" value="${grams}" min="0" data-id="${item.id}" data-meal="${activeMeal}"
              class="field-input acc-grams-input" onchange="onGramsChange(this)" />
          </div>
          <div class="acc-detail-row tablet-only-flex">
            <span class="acc-detail-label">ฐาน (กก.)</span>
            <span class="acc-detail-val">${baseKg.toFixed(2)}</span>
          </div>
          <div class="acc-detail-row tablet-only-flex">
            <span class="acc-detail-label">แนะนำสั่ง</span>
            <span class="acc-detail-val fw6">${recommendedKg.toFixed(2)} กก.</span>
          </div>
          <div class="acc-detail-row tablet-only-flex">
            <span class="acc-detail-label">% เผื่อ</span>
            <span class="acc-detail-val">${bufferRate}%</span>
          </div>
          <div class="acc-detail-row">
            <span class="acc-detail-label">ราคา/กก.</span>
            <span class="acc-detail-val">${item.pricePerKg.toLocaleString()} ฿</span>
          </div>
          <div class="acc-detail-row">
            <span class="acc-detail-label">ค่าใช้จ่าย</span>
            <span class="acc-detail-val fw6 orange">${cost.toLocaleString("th-TH", { maximumFractionDigits: 0 })} ฿</span>
          </div>
        </div>
      </div>`;
    });

    html += `</div></div>`;
  });

  wrap.innerHTML = html;
}

function toggleAccordion(cat) {
  accordionOpen[cat] = accordionOpen[cat] === false ? true : false;
  const { bufferRate, totalRooms, occupancyRate, guestsPerRoom } = getInputs();
  const totalGuests = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom);
  const mealGuests = calcMealGuests(totalGuests, MEAL_CFG[activeMeal].rate);
  renderAccordion(getAllItems(), mealGuests, bufferRate);
}

/* ── Daily Summary + Charts ── */
function renderDaily(
  items,
  totalRooms,
  occupancyRate,
  guestsPerRoom,
  bufferRate,
) {
  const dailyEl = document.getElementById("daily-cards");
  const barEl = document.getElementById("bar-chart");
  const canvas = document.getElementById("pie-canvas");
  const legEl = document.getElementById("pie-legend");

  const meals = {};
  let grandKg = 0,
    grandCost = 0;

  Object.entries(MEAL_CFG).forEach(([key, cfg]) => {
    const tg = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom);
    const mg = calcMealGuests(tg, cfg.rate);
    let kg = 0,
      cost = 0;
    items.forEach((item) => {
      const r = calcRow(item, mg, bufferRate, key);
      kg += r.recommendedKg;
      cost += r.cost;
    });
    meals[key] = { label: t(cfg.key), kg, cost, mg, color: cfg.color };
    grandKg += kg;
    grandCost += cost;
  });

  /* Daily cards */
  if (dailyEl) {
    dailyEl.innerHTML =
      Object.values(meals)
        .map(
          (m) => `
        <div class="daily-card">
          <p class="dc-label">${m.label} (${m.mg.toLocaleString()} คน)</p>
          <p class="dc-value">${m.kg.toFixed(1)} กก.</p>
          <p class="dc-cost">${m.cost.toLocaleString("th-TH", { maximumFractionDigits: 0 })} ฿</p>
        </div>`,
        )
        .join("") +
      `<div class="daily-card dark">
        <p class="dc-label-dk">รวมทั้งวัน</p>
        <p class="dc-value-dk">${grandKg.toFixed(1)} กก.</p>
        <p class="dc-cost-dk">${grandCost.toLocaleString("th-TH", { maximumFractionDigits: 0 })} ฿</p>
      </div>`;
  }

  /* Bar chart — distinct navy shades */
  if (barEl) {
    const mealArr = Object.values(meals);
    const maxKg = Math.max(...mealArr.map((m) => m.kg), 0.01);
    barEl.innerHTML = mealArr
      .map((m) => {
        const pct = Math.max((m.kg / maxKg) * 100, 2);
        return `<div class="bar-col" title="${m.label}: ${m.kg.toFixed(1)} กก.">
        <span class="bar-value">${m.kg.toFixed(1)}</span>
        <div class="bar-spacer">
          <div class="bar-fill" style="height:${pct}%;background:${m.color}"></div>
        </div>
        <span class="bar-label">${m.label}</span>
      </div>`;
      })
      .join("");
  }

  /* Pie chart */
  const catMap = {};
  Object.keys(MEAL_CFG).forEach((key) => {
    const tg = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom);
    const mg = calcMealGuests(tg, MEAL_CFG[key].rate);
    items.forEach((item) => {
      const { recommendedKg } = calcRow(item, mg, bufferRate, key);
      catMap[item.category] = (catMap[item.category] || 0) + recommendedKg;
    });
  });

  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0);

  if (canvas) {
    // Ensure canvas is correct size regardless of CSS
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const cx = 80,
      cy = 80,
      r = 72,
      ir = 36;
    ctx.clearRect(0, 0, size, size);

    if (total > 0) {
      let angle = -Math.PI / 2;
      const slices = [];
      sorted.forEach(([cat, kg]) => {
        const sweep = (kg / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, angle, angle + sweep);
        ctx.closePath();
        ctx.fillStyle = CAT_COLOR[cat] || "#9CA3AF";
        ctx.fill();
        slices.push({
          cat,
          kg,
          start: angle,
          end: angle + sweep,
          color: CAT_COLOR[cat] || "#9CA3AF",
        });
        angle += sweep;
      });
      // Donut hole
      ctx.beginPath();
      ctx.arc(cx, cy, ir, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff";
      ctx.fill();
      // Center text
      ctx.fillStyle = "#1E3A5F";
      ctx.textAlign = "center";
      ctx.font = "bold 13px Prompt,sans-serif";
      ctx.fillText(total.toFixed(1), cx, cy - 2);
      ctx.font = "10px Prompt,sans-serif";
      ctx.fillStyle = "#6B7280";
      ctx.fillText("กก.", cx, cy + 13);

      // Tooltip
      let tip = document.getElementById("sp-pie-tip");
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "sp-pie-tip";
        tip.className = "pie-tip";
        document.body.appendChild(tip);
      }
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = size / rect.width;
        const scaleY = size / rect.height;
        const sx = (e.clientX - rect.left) * scaleX;
        const sy = (e.clientY - rect.top) * scaleY;
        const dx = sx - cx,
          dy = sy - cy,
          dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ir || dist > r) {
          tip.style.display = "none";
          return;
        }
        let a = Math.atan2(dy, dx);
        if (a < -Math.PI / 2) a += 2 * Math.PI;
        const s = slices.find((sl) => a >= sl.start && a < sl.end);
        if (s) {
          tip.style.display = "block";
          tip.style.left = e.clientX + 14 + "px";
          tip.style.top = e.clientY - 24 + "px";
          tip.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px;vertical-align:middle"></span>${esc(s.cat)}: <strong>${s.kg.toFixed(1)} กก.</strong> (${((s.kg / total) * 100).toFixed(1)}%)`;
        } else {
          tip.style.display = "none";
        }
      };
      canvas.onmouseleave = () => {
        tip.style.display = "none";
      };
    } else {
      ctx.fillStyle = "#E5E7EB";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx, cy, ir, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "#9CA3AF";
      ctx.textAlign = "center";
      ctx.font = "11px Prompt,sans-serif";
      ctx.fillText("ไม่มีข้อมูล", cx, cy + 4);
    }
  }

  if (legEl) {
    legEl.innerHTML = sorted
      .map(
        ([cat, kg]) => `
      <div class="pie-item" title="${cat}: ${kg.toFixed(1)} กก.">
        <div class="pie-dot" style="background:${CAT_COLOR[cat] || "#9CA3AF"}"></div>
        <span class="pie-cat">${esc(cat)}</span>
        <span class="pie-val">${kg.toFixed(1)}</span>
      </div>`,
      )
      .join("");
  }
}

/* ── CRUD ── */
function addItem() {
  const name = document.getElementById("new-name")?.value.trim();
  const cat = document.getElementById("new-cat")?.value;
  const grams = parseFloat(document.getElementById("new-grams")?.value) || 100;
  const price = parseFloat(document.getElementById("new-price")?.value) || 0;

  if (!name) {
    alert("กรุณากรอกชื่อวัตถุดิบ");
    return;
  }

  // Duplicate check (case-insensitive)
  const existing = getAllItems().find(
    (i) => i.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    showDupModal(existing);
    return;
  }

  addItemToDB({
    id: "u" + Date.now(),
    name,
    category: cat,
    gramsPerPerson: { breakfast: grams, lunch: grams, dinner: grams },
    pricePerKg: price,
  });

  document.getElementById("new-name").value = "";
  document.getElementById("new-grams").value = 100;
  document.getElementById("new-price").value = 0;
  recalculate();
}

function deleteItem(id) {
  removeItemFromDB(id);
  recalculate();
}

function onGramsChange(inp) {
  const val = parseFloat(inp.value) || 0;
  updateItemGrams(inp.dataset.id, inp.dataset.meal, val);
  recalculate();
}

/* ── Duplicate Modal ── */
function showDupModal(item) {
  const body = document.getElementById("modal-body");
  if (body) {
    body.innerHTML = `
      <div class="modal-item-info">
        <p><strong>${esc(item.name)}</strong></p>
        <p class="muted" style="font-size:.85rem">${esc(item.category)}</p>
        <p style="font-size:.85rem;margin-top:.5rem">ราคา/กก.: <strong>${item.pricePerKg.toLocaleString()} ฿</strong></p>
        <p style="font-size:.8rem;color:#6B7280;margin-top:.5rem">ต้องการแก้ไข? <a href="ingredient-detail.html?id=${item.id}" style="color:#F97316;text-decoration:underline">คลิกที่นี่</a></p>
      </div>`;
  }
  document.getElementById("dup-modal")?.classList.remove("hidden");
}
function closeDupModal() {
  document.getElementById("dup-modal")?.classList.add("hidden");
}

/* ── Meal Tab ── */
function selectMeal(meal) {
  activeMeal = meal;
  document.querySelectorAll("#meal-tabs .tab").forEach((btn) => {
    btn.className = "tab" + (btn.dataset.meal === meal ? " active" : "");
  });
  recalculate();
}

/* ── CSV Export ── */
function exportCSV() {
  const { bufferRate, totalRooms, occupancyRate, guestsPerRoom } = getInputs();
  const tg = calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom);
  const mg = calcMealGuests(tg, MEAL_CFG[activeMeal].rate);
  const items = getAllItems();
  const today = new Date().toISOString().slice(0, 10);
  const label = t(MEAL_CFG[activeMeal].key);

  const headers = [
    t("th.name"),
    t("th.category"),
    t("th.grams"),
    t("th.base"),
    t("th.rec"),
    t("th.price"),
    t("th.cost"),
  ];
  const rows = items.map((item) => {
    const { grams, baseKg, recommendedKg, cost } = calcRow(
      item,
      mg,
      bufferRate,
      activeMeal,
    );
    return [
      item.name,
      item.category,
      grams,
      baseKg.toFixed(2),
      recommendedKg.toFixed(2),
      item.pricePerKg,
      cost.toFixed(0),
    ];
  });

  const csv =
    "\uFEFF" +
    [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `SmartProcure_${label}_${today}.csv`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Autocomplete ── */
function initAutocomplete() {
  const inp = document.getElementById("new-name");
  const drop = document.getElementById("ac-drop");
  if (!inp || !drop) return;

  function openDrop(query) {
    if (!query) {
      closeDrop();
      return;
    }
    const q = query.toLowerCase();
    const matches = getAllItems()
      .filter((i) => i.name.toLowerCase().includes(q))
      .slice(0, 5);

    if (matches.length === 0) {
      drop.innerHTML = `<div class="autocomplete-empty">ไม่พบวัตถุดิบ — กรอกข้อมูลเองได้เลย</div>`;
    } else {
      drop.innerHTML = matches
        .map((item) => {
          const idx = item.name.toLowerCase().indexOf(q);
          const pre = esc(item.name.slice(0, idx));
          const hi = esc(item.name.slice(idx, idx + query.length));
          const post = esc(item.name.slice(idx + query.length));
          return `<div class="autocomplete-item" data-id="${item.id}">
          <span>${pre}<span class="ac-match">${hi}</span>${post}</span>
          <span class="ac-badge">${esc(item.category)}</span>
        </div>`;
        })
        .join("");
      drop.querySelectorAll(".autocomplete-item").forEach((el) => {
        el.addEventListener("mousedown", (e) => {
          e.preventDefault();
          const item = getAllItems().find((i) => i.id === el.dataset.id);
          if (!item) return;
          inp.value = item.name;
          const catSel = document.getElementById("new-cat");
          const priceInp = document.getElementById("new-price");
          if (catSel) catSel.value = item.category;
          if (priceInp) priceInp.value = item.pricePerKg;
          closeDrop();
        });
      });
    }
    drop.classList.add("open");
  }

  function closeDrop() {
    drop.classList.remove("open");
    drop.innerHTML = "";
  }

  inp.addEventListener("input", () => openDrop(inp.value.trim()));
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrop();
  });
  document.addEventListener("click", (e) => {
    if (!inp.closest(".autocomplete-wrap")?.contains(e.target)) closeDrop();
  });
}

/* ── Utilities ── */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ── Boot ── */
document.addEventListener("DOMContentLoaded", () => {
  recalculate();
  initAutocomplete();
});
