/**
 * ingredient-detail.js — SmartProcure Edit Ingredient Page
 * Reads ?id= from URL, loads item from db.js, allows save/delete.
 */

let detailItem = null;

function goBack() {
  history.length > 1 ? history.back() : location.replace("dashboard.html");
}

function getInputVal() {
  return {
    name: document.getElementById("d-name")?.value.trim() || "",
    category: document.getElementById("d-cat")?.value || "",
    pricePerKg: parseFloat(document.getElementById("d-price")?.value) || 0,
    gramsPerPerson: {
      breakfast:
        parseFloat(document.getElementById("d-g-breakfast")?.value) || 0,
      lunch: parseFloat(document.getElementById("d-g-lunch")?.value) || 0,
      dinner: parseFloat(document.getElementById("d-g-dinner")?.value) || 0,
    },
  };
}

function renderCalcPreview(item) {
  const meals = [
    { key: "breakfast", label: "🌅 เช้า", rate: 90 },
    { key: "lunch", label: "☀️ กลางวัน", rate: 70 },
    { key: "dinner", label: "🌙 เย็น", rate: 80 },
  ];
  const totalGuests = Math.round(80 * 0.75 * 1.8);
  const buffer = 5;
  const el = document.getElementById("detail-calc");
  if (!el) return;
  el.innerHTML = meals
    .map((m) => {
      const mg = Math.round((totalGuests * m.rate) / 100);
      const grams = (item.gramsPerPerson && item.gramsPerPerson[m.key]) || 0;
      const baseKg = (grams * mg) / 1000;
      const recKg = baseKg * (1 + buffer / 100);
      const cost = recKg * item.pricePerKg;
      return `<div class="stat-card blue">
      <p class="stat-label">${m.label} (${mg} คน)</p>
      <p class="stat-value">${recKg.toFixed(2)}</p>
      <p class="stat-unit">กก. → ${cost.toLocaleString("th-TH", { maximumFractionDigits: 0 })} ฿</p>
    </div>`;
    })
    .join("");
}

function saveDetail() {
  if (!detailItem) return;
  const vals = getInputVal();
  if (!vals.name) {
    alert("กรุณากรอกชื่อวัตถุดิบ");
    return;
  }

  const items = getAllItems();
  const idx = items.findIndex((i) => i.id === detailItem.id);
  if (idx === -1) {
    alert("ไม่พบรายการ");
    return;
  }

  items[idx] = { ...items[idx], ...vals };
  saveAll(items);

  // Flash feedback
  const btn = document.querySelector('[onclick="saveDetail()"]');
  if (btn) {
    btn.textContent = "✓ บันทึกแล้ว";
    setTimeout(() => {
      btn.textContent = "💾 บันทึก";
    }, 1500);
  }

  renderCalcPreview(items[idx]);
}

function deleteDetail() {
  if (!detailItem) return;
  if (!confirm(`ลบ "${detailItem.name}" ออกจากรายการ?`)) return;
  removeItemFromDB(detailItem.id);
  location.replace("dashboard.html");
}

function boot() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    showNotFound();
    return;
  }

  const item = getAllItems().find((i) => i.id === id);
  if (!item) {
    showNotFound();
    return;
  }
  detailItem = item;

  document.getElementById("detail-title").textContent = item.name;
  document.getElementById("detail-cat").textContent = item.category;

  document.getElementById("d-name").value = item.name;
  document.getElementById("d-cat").value = item.category;
  document.getElementById("d-price").value = item.pricePerKg;

  const gpp = item.gramsPerPerson || {};
  document.getElementById("d-g-breakfast").value = gpp.breakfast || 0;
  document.getElementById("d-g-lunch").value = gpp.lunch || 0;
  document.getElementById("d-g-dinner").value = gpp.dinner || 0;

  renderCalcPreview(item);

  // Live preview on input change
  ["d-g-breakfast", "d-g-lunch", "d-g-dinner", "d-price"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      const v = getInputVal();
      renderCalcPreview({ ...detailItem, ...v });
    });
  });
}

function showNotFound() {
  document.getElementById("not-found").classList.remove("hidden");
  document.getElementById("detail-form").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", boot);
