// SmartProcure — Calculator Page

const CalculatorPage = (() => {
  let state = {
    id: null,
    plan_date: new Date().toISOString().slice(0,10),
    days: 1,
    meals: {
      breakfast: { mealRate: 90, items: [] },
      lunch:     { mealRate: 60, items: [] },
      dinner:    { mealRate: 70, items: [] },
    },
    currentMeal: 'breakfast',
  };

  function getProfile(){
    try { return JSON.parse(localStorage.getItem('sp_profile')||'{}'); } catch{ return {}; }
  }

  function getTotalGuests(){
    const p = getProfile();
    if(p.useManualGuests) return Number(p.manualGuests)||0;
    return Calc.totalGuests(Number(p.totalRooms)||0, Number(p.occupancyRate)||0, Number(p.guestsPerRoom)||1);
  }

  function getMealGuests(mealKey){
    return Calc.mealGuests(getTotalGuests(), state.meals[mealKey].mealRate);
  }

  function computeSummary(){
    const map = {};
    const MEAL_KEYS = ['breakfast','lunch','dinner'];
    MEAL_KEYS.forEach(mk => {
      const mg = getMealGuests(mk);
      state.meals[mk].items.forEach(item => {
        const ing = getIngredientById(item.ingredientId);
        if(!ing) return;
        const bufRate = (item.bufferRate !== undefined) ? item.bufferRate : (ing.bufferRate || getProfile().bufferRate || 5);
        const row = Calc.itemRow({
          gramsPerPerson: item.gramsPerPerson || 0,
          mealGuests: mg,
          bufferRate: bufRate,
          pricePerKg: item.pricePerKg || ing.pricePerKg,
          unit: ing.unit, unitSize: ing.unitSize || 1,
        });
        if(!map[ing.id]){
          map[ing.id] = {
            ingredientId: ing.id, code: ing.code, name: ing.name,
            category: ing.category, unit: ing.unit, unitSize: ing.unitSize||1,
            pricePerKg: item.pricePerKg || ing.pricePerKg,
            recommendedKg: 0, orderKg: 0, cost: 0,
            moq: ing.moq || 0,
          };
        }
        map[ing.id].recommendedKg += row.recommendedKg;
        map[ing.id].orderKg += row.orderKg;
        map[ing.id].cost += row.cost;
      });
    });
    return Object.values(map);
  }

  function computeMealSummary(){
    const MEAL_KEYS = ['breakfast','lunch','dinner'];
    return MEAL_KEYS.map(mk => {
      const mg = getMealGuests(mk);
      let totalKg = 0, totalCost = 0;
      state.meals[mk].items.forEach(item => {
        const ing = getIngredientById(item.ingredientId);
        if(!ing) return;
        const bufRate = (item.bufferRate !== undefined) ? item.bufferRate : (ing.bufferRate || getProfile().bufferRate || 5);
        const row = Calc.itemRow({
          gramsPerPerson: item.gramsPerPerson || 0,
          mealGuests: mg,
          bufferRate: bufRate,
          pricePerKg: item.pricePerKg || ing.pricePerKg,
          unit: ing.unit, unitSize: ing.unitSize || 1,
        });
        totalKg += row.orderKg;
        totalCost += row.cost;
      });
      return { mk, mg, totalKg, totalCost };
    });
  }

  function renderMealTab(){
    const mk = state.currentMeal;
    const meal = state.meals[mk];
    const mg = getMealGuests(mk);
    const bufRate = getProfile().bufferRate || 5;
    const MEAL_LABELS = { breakfast: 'มื้อเช้า', lunch: 'มื้อกลางวัน', dinner: 'มื้อเย็น' };

    let rows = '';
    if(!meal.items.length){
      rows = `<tr><td colspan="8" style="text-align:center;padding:32px;color:#94A3B8;font-style:italic">ยังไม่มีรายการ — ค้นหาเพิ่มด้านล่าง</td></tr>`;
    } else {
      let totalCost = 0;
      meal.items.forEach((item, idx) => {
        const ing = getIngredientById(item.ingredientId);
        if(!ing) return;
        const iBuf = (item.bufferRate !== undefined) ? item.bufferRate : (ing.bufferRate || bufRate);
        const row = Calc.itemRow({
          gramsPerPerson: item.gramsPerPerson || 0, mealGuests: mg,
          bufferRate: iBuf,
          pricePerKg: item.pricePerKg || ing.pricePerKg,
          unit: ing.unit, unitSize: ing.unitSize || 1,
        });
        totalCost += row.cost;
        rows += `<tr>
          <td>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="width:8px;height:8px;border-radius:50%;background:${catColor(ing.category)};flex-shrink:0;display:inline-block"></span>
              <div><div class="td-name">${ing.name}</div><div class="td-code">${ing.code}</div></div>
            </div>
          </td>
          <td class="c">${catBadgeHtml(ing.category)}</td>
          <td class="c"><input type="number" class="inline-input item-grams" data-idx="${idx}" min="0" value="${item.gramsPerPerson||0}" /></td>
          <td class="r"><span style="color:#1D4ED8;font-weight:600">${row.recommendedKg.toFixed(2)} กก.</span></td>
          <td class="r"><strong>${row.orderDisplay}</strong></td>
          <td class="c">
            <div style="display:flex;align-items:center;gap:4px">
              <input type="range" class="item-buf-range" data-idx="${idx}" min="0" max="50" value="${iBuf}" style="width:80px;accent-color:#F97316" />
              <span class="item-buf-val" style="font-size:11px;color:#64748B;width:28px">${iBuf}%</span>
            </div>
          </td>
          <td class="r"><input type="number" class="inline-input inline-input-lg item-price" data-idx="${idx}" min="0" value="${item.pricePerKg||ing.pricePerKg}" /></td>
          <td class="r"><strong style="color:#F97316">฿${UI.fmtMoney(row.cost)}</strong></td>
          <td class="c"><button class="btn-danger item-remove" data-idx="${idx}">x</button></td>
        </tr>`;
      });

      rows += ``;
    }

    const mealContent = document.getElementById('meal-tab-content');
    if(!mealContent) return;
    mealContent.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <h3>${MEAL_LABELS[mk]}</h3>
          <div style="display:flex;align-items:center;gap:10px">
            <label style="font-size:12px;color:#64748B">% ที่ทาน:</label>
            <input type="number" id="meal-rate-inp" min="0" max="100" value="${meal.mealRate}" style="width:60px" />
            <span style="font-size:12px;color:#64748B">= <strong>${mg}</strong> คน</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>วัตถุดิบ</th><th class="c">หมวด</th>
              <th class="c">กรัม/คน</th><th class="r">ต้องใช้ (กก.)</th>
              <th class="r">สั่งจริง</th><th class="c">Buffer%</th>
              <th class="r">ราคา/กก.</th><th class="r">รวม (฿)</th><th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px" id="search-row">
        <div id="meal-search-wrap" style="flex:1"></div>
      </div>`;

    document.getElementById('meal-rate-inp').addEventListener('change', e => {
      state.meals[mk].mealRate = Number(e.target.value) || 0;
      renderMealTab(); renderDashboard();
    });
    mealContent.querySelectorAll('.item-grams').forEach(inp => {
      inp.addEventListener('change', e => {
        state.meals[mk].items[+inp.dataset.idx].gramsPerPerson = Number(e.target.value) || 0;
        renderMealTab(); renderDashboard();
      });
    });
    mealContent.querySelectorAll('.item-price').forEach(inp => {
      inp.addEventListener('change', e => {
        state.meals[mk].items[+inp.dataset.idx].pricePerKg = Number(e.target.value) || 0;
        renderMealTab(); renderDashboard();
      });
    });
    mealContent.querySelectorAll('.item-buf-range').forEach(inp => {
      inp.addEventListener('input', e => {
        const idx = +inp.dataset.idx;
        const val = Number(e.target.value);
        state.meals[mk].items[idx].bufferRate = val;
        const valEl = inp.parentElement.querySelector('.item-buf-val');
        if(valEl) valEl.textContent = val + '%';
      });
      inp.addEventListener('change', e => {
        state.meals[mk].items[+inp.dataset.idx].bufferRate = Number(e.target.value);
        renderMealTab(); renderDashboard();
      });
    });
    mealContent.querySelectorAll('.item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        state.meals[mk].items.splice(+btn.dataset.idx, 1);
        renderMealTab(); renderDashboard();
      });
    });
    UI.makeSearch('meal-search-wrap', item => {
      if(state.meals[mk].items.find(i => i.ingredientId === item.id)){
        UI.toast('มีสินค้านี้แล้ว', 'error'); return;
      }
      state.meals[mk].items.push({
        ingredientId: item.id,
        gramsPerPerson: item.defaultGrams?.[mk] || 0,
        pricePerKg: item.pricePerKg,
        bufferRate: item.bufferRate,
      });
      renderMealTab(); renderDashboard();
    });
  }

  // ========== DASHBOARD ==========
  function renderDashboard(){
    const el = document.getElementById('dashboard-section');
    if(!el) return;

    const mealData = computeMealSummary();
    const [bf, ln, dn] = mealData;
    const totalKg = bf.totalKg + ln.totalKg + dn.totalKg;
    const totalCost = bf.totalCost + ln.totalCost + dn.totalCost;
    const MEAL_LABELS_TH = { breakfast:'เช้า', lunch:'กลางวัน', dinner:'เย็น' };
    const MEAL_COLORS = { breakfast:'#F59E0B', lunch:'#3B82F6', dinner:'#7C3AED' };
    const MEAL_KEYS = ['breakfast','lunch','dinner'];

    // meal summary cards
    const mealCards = MEAL_KEYS.map(mk => {
      const d = mealData.find(m => m.mk === mk);
      return `<div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px 16px">
        <div style="font-size:12px;font-weight:700;color:${MEAL_COLORS[mk]};margin-bottom:6px">${MEAL_LABELS_TH[mk]} (${d.mg} คน)</div>
        <div style="font-size:22px;font-weight:700;color:#1E293B">${d.totalKg.toFixed(1)} กก.</div>
        <div style="font-size:12px;color:#64748B;margin-top:2px">฿${UI.fmtMoney(d.totalCost)}</div>
      </div>`;
    }).join('');

    // Bar chart (SVG)
    const maxKg = Math.max(totalKg * 0.5, ...mealData.map(m => m.totalKg), 1);
    const BAR_H = 120, BAR_W = 60, BAR_GAP = 50, LEFT_PAD = 50;
    const svgW = LEFT_PAD + (BAR_W + BAR_GAP) * 3 + 20;
    function barPath(idx, kg){
      const bh = Math.max(2, (kg / maxKg) * BAR_H);
      const x = LEFT_PAD + idx * (BAR_W + BAR_GAP);
      const y = BAR_H - bh + 10;
      return { x, y, bh };
    }
    const yTicks = [0, Math.round(maxKg*0.25), Math.round(maxKg*0.5), Math.round(maxKg*0.75), Math.round(maxKg)];
    let barSvg = `<div style="overflow-x:auto; max-width:100%"><svg width="${svgW}" height="${BAR_H+60}" style="overflow:visible">`;
    yTicks.forEach(t => {
      const y = BAR_H - (t/maxKg)*BAR_H + 10;
      barSvg += `<line x1="${LEFT_PAD-8}" y1="${y}" x2="${svgW-10}" y2="${y}" stroke="#E2E8F0" stroke-width="1"/>
        <text x="${LEFT_PAD-12}" y="${y+4}" font-size="10" fill="#94A3B8" text-anchor="end">${t} กก.</text>`;
    });
    MEAL_KEYS.forEach((mk, i) => {
      const d = mealData.find(m => m.mk === mk);
      const { x, y, bh } = barPath(i, d.totalKg);
      barSvg += `<rect x="${x}" y="${y}" width="${BAR_W}" height="${bh}" rx="4" fill="${MEAL_COLORS[mk]}" opacity="0.85"/>
        <text x="${x+BAR_W/2}" y="${BAR_H+26}" font-size="12" fill="#475569" text-anchor="middle">${MEAL_LABELS_TH[mk]}</text>
        <text x="${x+BAR_W/2}" y="${y-4}" font-size="11" fill="${MEAL_COLORS[mk]}" text-anchor="middle" font-weight="700">${d.totalKg.toFixed(1)}</text>`;
    });
    barSvg += `</svg></div>`;

    // Donut chart (SVG)
    const summaryItems = computeSummary();
    const catMap = {};
    summaryItems.forEach(item => {
      catMap[item.category] = (catMap[item.category]||0) + item.orderKg;
    });
    const catEntries = Object.entries(catMap).filter(([,v])=>v>0);
    const totalCatKg = catEntries.reduce((a,[,v])=>a+v,0);
    let donutSvg = `<svg width="180" height="180" viewBox="0 0 180 180">`;
    if(catEntries.length > 0){
      let angle = -90;
      catEntries.forEach(([cat, kg]) => {
        const pct = kg / totalCatKg;
        const deg = pct * 360;
        const r = 70, cx = 90, cy = 90, ri = 42;
        const toRad = d => d * Math.PI / 180;
        const x1 = cx + r * Math.cos(toRad(angle));
        const y1 = cy + r * Math.sin(toRad(angle));
        const x2 = cx + r * Math.cos(toRad(angle + deg));
        const y2 = cy + r * Math.sin(toRad(angle + deg));
        const xi1 = cx + ri * Math.cos(toRad(angle));
        const yi1 = cy + ri * Math.sin(toRad(angle));
        const xi2 = cx + ri * Math.cos(toRad(angle + deg));
        const yi2 = cy + ri * Math.sin(toRad(angle + deg));
        const large = deg > 180 ? 1 : 0;
        donutSvg += `<path d="M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi2.toFixed(2)},${yi2.toFixed(2)} A${ri},${ri} 0 ${large},0 ${xi1.toFixed(2)},${yi1.toFixed(2)} Z" fill="${catColor(cat)}" opacity="0.85"/>`;
        angle += deg;
      });
      donutSvg += `<circle cx="90" cy="90" r="38" fill="white"/>
        <text x="90" y="86" text-anchor="middle" font-size="13" font-weight="700" fill="#1E293B">${totalCatKg.toFixed(1)}</text>
        <text x="90" y="102" text-anchor="middle" font-size="10" fill="#64748B">กก. รวม</text>`;
    } else {
      donutSvg += `<circle cx="90" cy="90" r="70" fill="#F1F5F9"/><circle cx="90" cy="90" r="42" fill="white"/>
        <text x="90" y="94" text-anchor="middle" font-size="11" fill="#94A3B8">ยังไม่มีข้อมูล</text>`;
    }
    donutSvg += `</svg>`;

    // legend
    const legend = catEntries.map(([cat, kg]) =>
      `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#475569;white-space:nowrap">
        <span style="width:10px;height:10px;border-radius:50%;background:${catColor(cat)};flex-shrink:0"></span>
        ${cat}: ${kg.toFixed(2)} กก.
      </span>`
    ).join('');

    // Final order table
    const days = state.days || 1;
    const orderItems = summaryItems.map(item => {
      const netKg = item.orderKg * days;
      const netCost = item.cost * days;
      const ord = Calc.orderQty(netKg, item.unit, item.unitSize||1);
      return { ...item, netKg, netCost, ordDisplay: ord.display };
    }).sort((a,b) => b.netKg - a.netKg);
    const grandTotal = orderItems.reduce((a,i)=>a+i.netCost,0);

    const orderRows = orderItems.length
      ? orderItems.map(item => {
          const moqSt = Calc.moqStatus(item.netKg, item.moq);
          return `<tr>
            <td><span style="font-size:11px;color:#94A3B8">${item.code}</span></td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="width:8px;height:8px;border-radius:50%;background:${catColor(item.category)};flex-shrink:0;display:inline-block"></span>
                <span style="font-weight:600">${item.name}</span>
              </div>
            </td>
            <td class="c">${catBadgeHtml(item.category)}</td>
            <td class="r" style="color:#1D4ED8;font-weight:600">${item.netKg.toFixed(1)} กก.</td>
            <td class="r"><strong>${item.ordDisplay}</strong></td>
            <td class="r">฿${UI.fmtMoney(item.pricePerKg)}/${item.unit==='pack'?'แพ็ค':'กก.'}</td>
            <td class="r" style="color:#F97316;font-weight:700">฿${UI.fmtMoney(item.netCost)}</td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="7" style="text-align:center;padding:32px;color:#94A3B8">ยังไม่มีรายการ</td></tr>`;

    const formulaNote = `
      <div style="font-size:11px;color:#94A3B8;margin-top:10px;line-height:1.8">
        สูตร: (กรัม/คน × ผู้รับประทานมื้อนั้น ÷ 1000) × (1 + Buffer%) = ปริมาณที่ต้องใช้ — ปัดขึ้นตามขนาดบรรจุ/ชั้นต่ำแต่ละสินค้า = ยอดสั่งจริง<br>
        คอลัมน์ <strong>เผื่อ</strong> = ส่วนที่เกินมาจากการปัดหน่วยขาย
      </div>`;

    el.innerHTML = `
      <!-- Meal summary cards -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <h3>สรุปแต่ละมื้อ (ต่อวัน)</h3>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:6px">
              <label style="font-size:12px;color:#64748B">บันทึกของวันที่:</label>
              <input type="date" id="plan-date-inp" value="${state.plan_date}" style="width:130px; font-size:12px; padding:4px 8px" />
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <label style="font-size:12px;color:#64748B">จำนวนวัน:</label>
              <input type="number" id="days-inp" min="1" value="${days}" style="width:60px" />
            </div>
          </div>
        </div>
        <div class="card-body">
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            ${mealCards}
            <div style="flex:1;background:#1E3A5F;border-radius:10px;padding:14px 16px;min-width:120px">
              <div style="font-size:12px;font-weight:700;color:#93C5FD;margin-bottom:6px">รวม/วัน</div>
              <div style="font-size:22px;font-weight:700;color:white">${totalKg.toFixed(1)} กก.</div>
              <div style="font-size:12px;color:#60A5FA;margin-top:2px">฿${UI.fmtMoney(totalCost)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><h3>กก. สั่งจริง แต่ละมื้อ (ต่อวัน)</h3></div>
          <div class="card-body" style="overflow-x:auto">${barSvg}</div>
        </div>
        <div class="card">
          <div class="card-header"><h3>สัดส่วนหมวด (ต่อวัน)</h3></div>
          <div class="card-body" style="display:flex;flex-direction:column;align-items:center;gap:10px">
            ${donutSvg}
            <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${legend||'<span style="font-size:12px;color:#94A3B8">ยังไม่มีข้อมูล</span>'}</div>
          </div>
        </div>
      </div>
      ${formulaNote}

      <!-- Order table -->
      <div class="card" style="margin-top:16px">
        <div class="card-header">
          <h3>ยอดสั่งจริง (รวมทุกมื้อ × ${days} วัน)</h3>
          <div style="font-size:18px;font-weight:700;color:#F97316">รวมทั้งสิ้น ฿${UI.fmtMoney(grandTotal)}</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>รหัส</th><th>สินค้า</th><th class="c">หมวด</th>
              <th class="r">ต้องใช้ (กก.)</th><th class="r">สั่ง</th>
              <th class="r">ราคา/หน่วย</th><th class="r">รวม</th>
            </tr></thead>
            <tbody>${orderRows}</tbody>
            ${orderItems.length ? `<tfoot><tr>
              <td colspan="6" style="text-align:right">ยอดรวมทั้งสิ้น</td>
              <td style="color:#FDBA74">฿${UI.fmtMoney(grandTotal)}</td>
            </tr></tfoot>` : ''}
          </table>
        </div>
        <div style="display:flex;gap:10px;padding:16px 20px;border-top:1px solid #F1F5F9;flex-wrap:wrap">
          <button id="btn-save-plan" class="btn-primary">บันทึกแผน</button>
          <button id="btn-quote" class="btn-secondary">ขอใบเสนอราคา</button>
          <button id="btn-print" class="btn-secondary">พิมพ์ / บันทึก PDF</button>
        </div>
        <div style="font-size:11px;color:#94A3B8;padding:0 20px 14px">
          ราคาเป็นราคาขายส่ง อ้างอิงจากแคตตาล็อกปัจจุบัน • ยอด "สั่งจริง" ปัดขึ้นตามขนาดบรรจุและยอดสั่งขั้นต่ำแต่ละสินค้า • ราคาสุดท้ายยืนยันอีกครั้งในใบเสนอราคา
        </div>
      </div>`;

    document.getElementById('days-inp')?.addEventListener('change', e => {
      state.days = Math.max(1, Number(e.target.value)||1);
      renderDashboard();
    });
    document.getElementById('plan-date-inp')?.addEventListener('change', e => {
      state.plan_date = e.target.value || new Date().toISOString().slice(0,10);
    });
    document.getElementById('btn-save-plan')?.addEventListener('click', savePlan);
    document.getElementById('btn-print')?.addEventListener('click', () => window.print());
    document.getElementById('btn-quote')?.addEventListener('click', () => UI.toast('ฟีเจอร์ใบเสนอราคากำลังพัฒนา'));
  }

  function savePlan(){
    const p = getProfile();
    if(!p.businessName){ UI.toast('กรุณากรอกข้อมูลโรงแรมในหน้า "โปรไฟล์" ก่อน', 'error'); return; }
    const items = computeSummary();
    const total = items.reduce((a,i)=>a+i.cost,0);
    const plan = {
      id: state.id || undefined,
      plan_date: state.plan_date,
      business_name: p.businessName, contact_name: p.contactName||'',
      contact_phone: p.contactPhone||'', delivery_address: p.deliveryAddress||'',
      customer_type: p.customerType||'โรงแรม',
      total_rooms: p.totalRooms, occupancy_rate: p.occupancyRate,
      guests_per_room: p.guestsPerRoom, buffer_rate: p.bufferRate,
      days: state.days, total_guests: getTotalGuests(),
      meals: JSON.parse(JSON.stringify(state.meals)),
      summary_items: items, total_cost: total * state.days, status: 'confirmed',
    };
    DB.savePlan(plan);
    UI.toast('บันทึกแผนเรียบร้อย');
    showPage('daily-plans');
  }

  function render(container){
    const p = getProfile();

    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">คำนวณยอดสั่งซื้อ</div>
        <div class="section-sub">เพิ่มวัตถุดิบแต่ละมื้อ ระบบจะคำนวณและสรุปยอดด้านล่างอัตโนมัติ</div>
      </div>

      <!-- Guest Configuration -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><h3>ข้อมูลผู้เข้าพักและการเผื่อขาด</h3></div>
        <div class="card-body">
          <div style="margin-bottom:12px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
              <input type="checkbox" id="calc-use-manual" ${p.useManualGuests?'checked':''} style="width:16px;height:16px;accent-color:#F97316" />
              กำหนดจำนวนแขกเอง (ไม่คำนวณจากห้อง)
            </label>
          </div>
          <div id="calc-room-fields" class="grid-4" style="${p.useManualGuests?'display:none;':''}margin-bottom:16px">
            <div class="form-group">
              <label>จำนวนห้องทั้งหมด</label>
              <input type="number" id="calc-total-rooms" min="1" value="${p.totalRooms||80}" />
            </div>
            <div class="form-group">
              <label>อัตราเข้าพัก (%)</label>
              <input type="number" id="calc-occ-rate" min="0" max="100" value="${p.occupancyRate||75}" />
            </div>
            <div class="form-group">
              <label>ผู้เข้าพัก/ห้อง</label>
              <input type="number" id="calc-guests-room" min="0.1" step="0.1" value="${p.guestsPerRoom||1.8}" />
            </div>
            <div class="form-group">
              <label>Buffer เผื่อขาด (%)</label>
              <input type="number" id="calc-buf-rate" min="0" value="${p.bufferRate||5}" />
            </div>
          </div>
          <div id="calc-manual-fields" style="${!p.useManualGuests?'display:none;':''}margin-bottom:16px">
            <div class="form-group" style="max-width:200px">
              <label>จำนวนแขก (คน)</label>
              <input type="number" id="calc-manual-guests" min="1" value="${p.manualGuests||100}" />
            </div>
            <div class="form-group" style="max-width:200px">
              <label>Buffer เผื่อขาด (%)</label>
              <input type="number" id="calc-manual-buf" min="0" value="${p.bufferRate||5}" />
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:16px">
            <div class="pill">แขกทั้งหมด: <strong id="calc-guests-disp">${getTotalGuests()}</strong> คน</div>
          </div>
        </div>
      </div>

      <!-- Meal Tabs -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-body">
          <div class="tab-bar">
            <button class="tab-btn ${state.currentMeal==='breakfast'?'active':''}" data-meal="breakfast">มื้อเช้า</button>
            <button class="tab-btn ${state.currentMeal==='lunch'?'active':''}" data-meal="lunch">มื้อกลางวัน</button>
            <button class="tab-btn ${state.currentMeal==='dinner'?'active':''}" data-meal="dinner">มื้อเย็น</button>
          </div>
          <div id="meal-tab-content"></div>
        </div>
      </div>

      <!-- Dashboard -->
      <div id="dashboard-section"></div>
    `;

    // Guest config logic
    function saveAndRefresh() {
      const p = getProfile();
      p.useManualGuests = document.getElementById('calc-use-manual').checked;
      p.totalRooms = Number(document.getElementById('calc-total-rooms').value) || 0;
      p.occupancyRate = Number(document.getElementById('calc-occ-rate').value) || 0;
      p.guestsPerRoom = Number(document.getElementById('calc-guests-room').value) || 1;
      p.manualGuests = Number(document.getElementById('calc-manual-guests').value) || 0;
      p.bufferRate = p.useManualGuests ? (Number(document.getElementById('calc-manual-buf').value) || 0) : (Number(document.getElementById('calc-buf-rate').value) || 0);
      
      localStorage.setItem('sp_profile', JSON.stringify(p));
      document.getElementById('calc-guests-disp').textContent = getTotalGuests();
      renderMealTab();
      renderDashboard();
    }

    document.getElementById('calc-use-manual').addEventListener('change', e => {
      document.getElementById('calc-room-fields').style.display = e.target.checked ? 'none' : '';
      document.getElementById('calc-manual-fields').style.display = e.target.checked ? '' : 'none';
      saveAndRefresh();
    });

    ['calc-total-rooms','calc-occ-rate','calc-guests-room','calc-buf-rate','calc-manual-guests','calc-manual-buf'].forEach(id => {
      document.getElementById(id).addEventListener('change', saveAndRefresh);
    });

    container.querySelectorAll('.tab-btn[data-meal]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentMeal = btn.dataset.meal;
        container.querySelectorAll('.tab-btn[data-meal]').forEach(b => b.classList.toggle('active', b === btn));
        renderMealTab();
      });
    });

    renderMealTab();
    renderDashboard();
  }

  function loadPlan(plan) {
    state.id = plan.id;
    state.plan_date = plan.plan_date;
    state.days = plan.days;
    state.meals = JSON.parse(JSON.stringify(plan.meals));
    state.currentMeal = 'breakfast';
  }

  return { render, loadPlan };
})();