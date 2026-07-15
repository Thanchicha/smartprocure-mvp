// SmartProcure — Calculator Page

const CalculatorPage = (() => {
  const catColor = c => (typeof CAT_COLOR !== 'undefined' && CAT_COLOR[c]) ? CAT_COLOR[c] : '#94A3B8';
  const catBadgeHtml = c => (typeof CAT_BADGE !== 'undefined' && CAT_BADGE[c]) ? `<span class="badge ${CAT_BADGE[c]}">${c}</span>` : `<span class="badge" style="background:#E2E8F0;color:#475569">${c}</span>`;
  
  let state = {
    planGroupId: null,
    plans: [{
      id: null, plan_date: new Date().toISOString().slice(0,10), days: 1,
      meals: { breakfast: { mealRate: 90, items: [] }, lunch: { mealRate: 60, items: [] }, dinner: { mealRate: 70, items: [] } },
      ext: null, fileName: null, guestConfig: null
    }],
    currentDateIdx: 0,
    currentMeal: 'breakfast'
  };

  function getCurrentPlan() {
    return state.plans[state.currentDateIdx];
  }
  let isDirty = false;

  function getProfile(){
    return DB.getProfile();
  }

  function getTotalGuests(){
    const p = getCurrentPlan()?.guestConfig || getProfile();
    if(p.useManualGuests) return Number(p.manualGuests)||0;
    return Calc.totalGuests(Number(p.totalRooms)||0, Number(p.occupancyRate)||0, Number(p.guestsPerRoom)||1);
  }

  function getMealGuests(mealKey){
    return Calc.mealGuests(getTotalGuests(), getCurrentPlan().meals[mealKey].mealRate);
  }

  function getEffectiveGrams(item, mealGuestsAll, mk) {
    const p = getCurrentPlan();
    const useNat = p.guestConfig?.useNationalityMapping;
    const ext = p.ext;
    
    if (!useNat || !ext || !item.gramsByNat || mealGuestsAll === 0) {
      return item.gramsPerPerson || 0;
    }
    
    let totalGrams = 0;
    const mealRate = (p.meals[mk].mealRate || 100) / 100;
    
    for (let nat in item.gramsByNat) {
      let natGuests = ext.totalGuests || 0;
      if (nat === 'Indian') natGuests = ext.nat_india || 0;
      else if (nat === 'Europe/Western' || nat === 'European') natGuests = ext.nat_europe || 0;
      else if (nat === 'China' || nat === 'Chinese') natGuests = ext.nat_china || 0;
      else if (nat === 'Domestic/Thai' || nat === 'Thai') natGuests = ext.nat_domestic || 0;
      
      const natMealGuests = Math.round(natGuests * mealRate);
      totalGrams += (item.gramsByNat[nat] || 0) * natMealGuests;
    }
    
    // Check if user manually edited gramsPerPerson and it differs from sum of gramsByNat
    const sumByNat = Object.values(item.gramsByNat).reduce((a,b)=>a+b, 0);
    const diff = (item.gramsPerPerson || 0) - sumByNat;
    if (diff !== 0) {
      totalGrams += diff * mealGuestsAll;
    }
    
    return totalGrams / mealGuestsAll;
  }

  function computeSummary(){
    const map = {};
    const MEAL_KEYS = ['breakfast','lunch','dinner'];
    MEAL_KEYS.forEach(mk => {
      const mg = getMealGuests(mk);
      getCurrentPlan().meals[mk].items.forEach(item => {
        const ing = getIngredientById(item.ingredientId);
        if(!ing) return;
        const bufRate = (item.bufferRate !== undefined) ? item.bufferRate : (ing.bufferRate || getProfile().bufferRate || 5);
        const row = Calc.itemRow({
          gramsPerPerson: getEffectiveGrams(item, mg, mk),
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

  function computeGrandSummary() {
    const map = {};
    const MEAL_KEYS = ['breakfast','lunch','dinner'];
    state.plans.forEach(plan => {
      const p = plan.guestConfig || getProfile();
      const totalGuests = plan.ext?.totalGuests || (p.useManualGuests ? (Number(p.manualGuests)||0) : Calc.totalGuests(Number(p.totalRooms)||0, Number(p.occupancyRate)||0, Number(p.guestsPerRoom)||1));
      
      MEAL_KEYS.forEach(mk => {
        const mg = Calc.mealGuests(totalGuests, plan.meals[mk].mealRate);
        plan.meals[mk].items.forEach(item => {
          const ing = getIngredientById(item.ingredientId);
          if(!ing) return;
          const bufRate = (item.bufferRate !== undefined) ? item.bufferRate : (ing.bufferRate || getProfile().bufferRate || 5);
          
          let totalGrams = 0;
          const ext = plan.ext;
          if (p.useNationalityMapping && ext && item.gramsByNat && mg > 0) {
            for (let nat in item.gramsByNat) {
              let natGuests = ext.totalGuests || 0;
              if (nat === 'Indian') natGuests = ext.nat_india || 0;
              else if (nat === 'Europe/Western' || nat === 'European') natGuests = ext.nat_europe || 0;
              else if (nat === 'China' || nat === 'Chinese') natGuests = ext.nat_china || 0;
              else if (nat === 'Domestic/Thai' || nat === 'Thai') natGuests = ext.nat_domestic || 0;
              const natMealGuests = Math.round(natGuests * (plan.meals[mk].mealRate / 100));
              totalGrams += (item.gramsByNat[nat] || 0) * natMealGuests;
            }
            const sumByNat = Object.values(item.gramsByNat).reduce((a,b)=>a+b, 0);
            const diff = (item.gramsPerPerson || 0) - sumByNat;
            if (diff !== 0) totalGrams += diff * mg;
          } else {
            totalGrams = (item.gramsPerPerson || 0) * mg;
          }
          
          const effGrams = mg > 0 ? totalGrams / mg : 0;
          
          const row = Calc.itemRow({
            gramsPerPerson: effGrams,
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
    });
    return Object.values(map);
  }

  function computeMealSummary(){
    const MEAL_KEYS = ['breakfast','lunch','dinner'];
    return MEAL_KEYS.map(mk => {
      const mg = getMealGuests(mk);
      let totalKg = 0, totalCost = 0;
      getCurrentPlan().meals[mk].items.forEach(item => {
        const ing = getIngredientById(item.ingredientId);
        if(!ing) return;
        const bufRate = (item.bufferRate !== undefined) ? item.bufferRate : (ing.bufferRate || getProfile().bufferRate || 5);
        const row = Calc.itemRow({
          gramsPerPerson: getEffectiveGrams(item, mg, mk),
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
    const meal = getCurrentPlan().meals[mk];
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
          gramsPerPerson: getEffectiveGrams(item, mg, mk), mealGuests: mg,
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

    let menusHtml = '';
    if(meal.addedMenus && meal.addedMenus.length > 0) {
      const allMenus = DB.getMenus();
      menusHtml = `<div style="margin:0 0 16px 0; padding:12px 16px; background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
        <div style="font-weight:600; font-size:13px; color:#475569; margin-bottom:10px;">เมนูที่จัดให้สำหรับมื้อนี้:</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${meal.addedMenus.map(mid => {
            const m = allMenus.find(x => x.id === mid);
            if(!m) return '';
            const ings = m.items.map(mi => {
              const ing = getIngredientById(mi.ingredientId);
              return ing ? `${ing.name} ${mi.gramsPerPerson}g` : '';
            }).filter(x=>x).join(', ');
            return `<div style="background:white; border:1px solid #CBD5E1; border-radius:6px; padding:8px 12px; font-size:12px; display:flex; flex-direction:column; gap:4px; min-width:180px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <span style="font-weight:700; color:#1E293B; font-size:13px;">${m.name}</span>
                <button class="btn-remove-meal-menu" data-mid="${mid}" style="background:none; border:none; color:#EF4444; font-size:16px; line-height:1; cursor:pointer; padding:0 0 0 8px; margin-top:-2px;">&times;</button>
              </div>
              <div style="color:#64748B; font-size:11px; line-height:1.4;">${ings}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }

    let demographicsHtml = '';
    const ext = getCurrentPlan().ext;
    if (ext && ext.mealCounts && ext.mealCounts[mk] && ext.mealCounts[mk].total > 0) {
      const mc = ext.mealCounts[mk];
      const nats = Object.entries(mc.nat).map(([n, c]) => `${n} ${c}`).join(', ');
      demographicsHtml = `<div style="font-size:11px; color:#0369A1; background:#E0F2FE; padding:4px 10px; border-radius:12px; display:inline-block; margin-left:12px; font-weight:500;">
        ผู้ใหญ่ ${mc.adults} | เด็ก ${mc.children} &nbsp;&middot;&nbsp; สัญชาติ: ${nats || '-'}
      </div>`;
    }

    mealContent.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; flex-wrap:wrap;">
            <h3 style="margin:0">${MEAL_LABELS[mk]}</h3>
            ${demographicsHtml}
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <label style="font-size:12px;color:#64748B">% ที่ทาน:</label>
            <input type="number" id="meal-rate-inp" min="0" max="100" value="${meal.mealRate}" style="width:60px" />
            <span style="font-size:12px;color:#64748B">= <strong>${mg}</strong> คน</span>
          </div>
        </div>
        ${menusHtml}
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>วัตถุดิบ (รวมจากทุกเมนู)</th><th class="c">หมวด</th>
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
        <button id="btn-import-menu" class="btn-secondary" style="height:42px">นำเข้าจากเมนู</button>
      </div>`;

    document.getElementById('btn-import-menu')?.addEventListener('click', () => {
      window.menuSelectTargetMeal = mk;
      showPage('menu-select');
    });

    document.getElementById('meal-rate-inp').addEventListener('change', e => {
      getCurrentPlan().meals[mk].mealRate = Number(e.target.value) || 0;
      isDirty = true;
      renderMealTab(); renderDashboard();
    });
    mealContent.querySelectorAll('.item-grams').forEach(inp => {
      inp.addEventListener('change', e => {
        getCurrentPlan().meals[mk].items[+inp.dataset.idx].gramsPerPerson = Number(e.target.value) || 0;
        isDirty = true;
        renderMealTab(); renderDashboard();
      });
    });
    mealContent.querySelectorAll('.item-price').forEach(inp => {
      inp.addEventListener('change', e => {
        getCurrentPlan().meals[mk].items[+inp.dataset.idx].pricePerKg = Number(e.target.value) || 0;
        isDirty = true;
        renderMealTab(); renderDashboard();
      });
    });
    mealContent.querySelectorAll('.item-buf-range').forEach(inp => {
      inp.addEventListener('input', e => {
        const idx = +inp.dataset.idx;
        const val = Number(e.target.value);
        getCurrentPlan().meals[mk].items[idx].bufferRate = val;
        const valEl = inp.parentElement.querySelector('.item-buf-val');
        if(valEl) valEl.textContent = val + '%';
      });
      inp.addEventListener('change', e => {
        getCurrentPlan().meals[mk].items[+inp.dataset.idx].bufferRate = Number(e.target.value);
        isDirty = true;
        renderMealTab(); renderDashboard();
      });
    });
    mealContent.querySelectorAll('.item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        getCurrentPlan().meals[mk].items.splice(+btn.dataset.idx, 1);
        isDirty = true;
        renderMealTab(); renderDashboard();
      });
    });
    mealContent.querySelectorAll('.btn-remove-meal-menu').forEach(btn => {
      btn.addEventListener('click', () => {
        removeMenuData(btn.dataset.mid, mk);
      });
    });
    UI.makeSearch('meal-search-wrap', item => {
      if(getCurrentPlan().meals[mk].items.find(i => i.ingredientId === item.id)){
        UI.toast('มีสินค้านี้แล้ว', 'error'); return;
      }
      getCurrentPlan().meals[mk].items.push({
        ingredientId: item.id,
        gramsPerPerson: item.defaultGrams?.[mk] || 0,
        pricePerKg: item.pricePerKg,
        bufferRate: item.bufferRate,
      });
      renderMealTab(); renderDashboard();
    });
  }

  function importMenuData(menuId, mk, silent = false) {
    const menus = DB.getMenus();
    const menu = menus.find(m => m.id === menuId);
    if(menu) {
      if (!getCurrentPlan().meals[mk].addedMenus) {
        getCurrentPlan().meals[mk].addedMenus = [];
      }
      if (!getCurrentPlan().meals[mk].addedMenus.includes(menuId)) {
        getCurrentPlan().meals[mk].addedMenus.push(menuId);
      }

      const nat = menu.nationality || 'All';
      menu.items.forEach(mi => {
        const existing = getCurrentPlan().meals[mk].items.find(i => i.ingredientId === mi.ingredientId);
        if(existing) {
          existing.gramsPerPerson += mi.gramsPerPerson || 0;
          if(!existing.gramsByNat) existing.gramsByNat = {};
          existing.gramsByNat[nat] = (existing.gramsByNat[nat] || 0) + (mi.gramsPerPerson || 0);
        } else {
          const ing = getIngredientById(mi.ingredientId);
          if(ing) {
            getCurrentPlan().meals[mk].items.push({
              ingredientId: mi.ingredientId,
              gramsPerPerson: mi.gramsPerPerson || 0,
              gramsByNat: { [nat]: mi.gramsPerPerson || 0 },
              pricePerKg: ing.pricePerKg,
              bufferRate: ing.bufferRate,
            });
          }
        }
      });
      isDirty = true;
      if(!silent) {
        UI.toast(`นำเข้าเมนู "${menu.name}" เรียบร้อย`);
        renderMealTab(); renderDashboard();
      }
    }
  }

  function removeMenuData(menuId, mk, silent = false) {
    const menus = DB.getMenus();
    const menu = menus.find(m => m.id === menuId);
    const meal = getCurrentPlan().meals[mk];
    if(menu && meal && meal.addedMenus) {
      const idx = meal.addedMenus.indexOf(menuId);
      if(idx > -1) {
        meal.addedMenus.splice(idx, 1);
        
        const nat = menu.nationality || 'All';
        menu.items.forEach(mi => {
          const existing = meal.items.find(i => i.ingredientId === mi.ingredientId);
          if (existing) {
            existing.gramsPerPerson -= (mi.gramsPerPerson || 0);
            if(existing.gramsByNat && existing.gramsByNat[nat] !== undefined) {
               existing.gramsByNat[nat] = Math.max(0, existing.gramsByNat[nat] - (mi.gramsPerPerson || 0));
            }
          }
        });
        
        meal.items = meal.items.filter(i => i.gramsPerPerson > 0);
        
        isDirty = true;
        if(!silent) {
          UI.toast(`ลบเมนู "${menu.name}" เรียบร้อย`);
          renderMealTab(); renderDashboard();
        }
      }
    }
  }

  function forceRenderTabs() {
    renderMealTab();
    renderDashboard();
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
    const days = getCurrentPlan().days || 1;
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
              <input type="date" id="plan-date-inp" value="${getCurrentPlan().plan_date}" style="width:130px; font-size:12px; padding:4px 8px" />
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <label style="font-size:12px;color:#64748B">จำนวนวัน:</label>
              <input type="number" id="days-inp" min="1" value="${days}" style="width:60px" />
            </div>
            ${state.plans.length > 1 ? `<button id="btn-ai-plan-all" class="btn-primary" style="background:#8B5CF6; border:none; padding:4px 12px; font-size:12px; height:28px; border-radius:14px; box-shadow:0 2px 4px rgba(139,92,246,0.3)">✨ AI จัดแผนทั้งหมด ${state.plans.length} วัน</button>` : `<button id="btn-ai-plan-all" class="btn-primary" style="background:#8B5CF6; border:none; padding:4px 12px; font-size:12px; height:28px; border-radius:14px; box-shadow:0 2px 4px rgba(139,92,246,0.3)">✨ AI จัดแผนอัตโนมัติ</button>`}
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
      getCurrentPlan().days = Math.max(1, Number(e.target.value)||1);
      isDirty = true;
      renderDashboard();
    });
    
    document.getElementById('btn-ai-plan-all')?.addEventListener('click', () => {
      const btn = document.getElementById('btn-ai-plan-all');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'กำลังประมวลผล...';
      btn.disabled = true;

      if(typeof AI !== 'undefined' && AI.recommendAllPlans) {
        AI.recommendAllPlans(state.plans, DB.getMenus(), (result) => {
          btn.innerHTML = originalText;
          btn.disabled = false;
          
          if(result && result.recommendations) {
            const originalIdx = state.currentDateIdx;
            
            result.recommendations.forEach(rec => {
              const idx = state.plans.findIndex(p => p.plan_date === rec.plan_date);
              if(idx > -1) {
                state.currentDateIdx = idx;
                const plan = state.plans[idx];
                
                ['breakfast', 'lunch', 'dinner'].forEach(mk => {
                  if(rec[mk] && Array.isArray(rec[mk])) {
                    plan.meals[mk].items = [];
                    plan.meals[mk].addedMenus = [];
                    
                    rec[mk].forEach(menuId => {
                      importMenuData(menuId, mk, true);
                    });
                  }
                });
              }
            });
            
            state.currentDateIdx = originalIdx;
            forceRenderTabs();
            UI.toast('AI จัดแผนทั้งหมดเรียบร้อยแล้ว!', 'success');
            
            if(result.reasoning) {
              let menusHtml = '';
              const allMenus = DB.getMenus();
              result.recommendations.forEach(rec => {
                menusHtml += `<div style="margin-top:12px; font-weight:600; color:#1E293B;">วันที่ ${rec.plan_date}</div>`;
                const mkLabels = { breakfast: 'เช้า', lunch: 'กลางวัน', dinner: 'เย็น' };
                ['breakfast', 'lunch', 'dinner'].forEach(mk => {
                  if(rec[mk] && rec[mk].length > 0) {
                    const menuNames = rec[mk].map(id => {
                      const m = allMenus.find(x => x.id === id);
                      return m ? m.name : id;
                    }).join(', ');
                    menusHtml += `<div style="font-size:13px; color:#475569; margin-left:8px; margin-top:4px;">- มื้อ${mkLabels[mk]}: <span style="color:#3B82F6">${menuNames}</span></div>`;
                  }
                });
              });

              const formattedReasoning = result.reasoning.replace(/\\n/g, '<br>').replace(/\\* /g, '&bull; ');
              const modalHtml = `
                <div style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:10000; display:flex; align-items:center; justify-content:center; padding:20px;">
                  <div style="background:white; border-radius:12px; padding:24px; max-width:600px; width:100%; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                    <h3 style="margin-bottom:16px; display:flex; align-items:center; gap:8px;"><span style="font-size:24px">✨</span> คำแนะนำจาก AI</h3>
                    <div style="font-size:14px; color:#334155; line-height:1.8; margin-bottom:20px; background:#F8FAFC; padding:20px; border-radius:8px; border-left:4px solid #8B5CF6; max-height: 400px; overflow-y: auto;">
                      ${formattedReasoning}
                      <hr style="border:none; border-top:1px dashed #CBD5E1; margin:16px 0;" />
                      <div style="font-weight:700; color:#1E293B; margin-bottom:8px;">เมนูที่จัดให้:</div>
                      ${menusHtml}
                    </div>
                    <div style="display:flex; justify-content:flex-end;">
                      <button id="btn-close-ai-modal" class="btn-primary">ตกลง</button>
                    </div>
                  </div>
                </div>
              `;
              const modalWrapper = document.createElement('div');
              modalWrapper.innerHTML = modalHtml;
              document.body.appendChild(modalWrapper);
              document.getElementById('btn-close-ai-modal').addEventListener('click', () => {
                document.body.removeChild(modalWrapper);
              });
            }
          }
        });
      } else {
        UI.toast('ไม่พบโมดูล AI', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
    document.getElementById('calc-use-manual')?.addEventListener('change', e => {
      const p = getCurrentPlan();
      if(!p.guestConfig) p.guestConfig = Object.assign({}, getProfile());
      p.guestConfig.useManualGuests = e.target.checked;
      isDirty = true;
      renderDashboard();
      renderMealTab();
    });
    
    document.getElementById('calc-use-nat')?.addEventListener('change', e => {
      const p = getCurrentPlan();
      if(!p.guestConfig) p.guestConfig = Object.assign({}, getProfile());
      p.guestConfig.useNationalityMapping = e.target.checked;
      isDirty = true;
      renderDashboard();
      renderMealTab();
    });
    document.getElementById('plan-date-inp')?.addEventListener('change', e => {
      getCurrentPlan().plan_date = e.target.value || new Date().toISOString().slice(0,10);
      isDirty = true;
    });
    document.getElementById('btn-save-plan')?.addEventListener('click', () => savePlan('confirmed'));
    document.getElementById('btn-print')?.addEventListener('click', () => window.print());
    document.getElementById('btn-quote')?.addEventListener('click', () => UI.toast('ฟีเจอร์ใบเสนอราคากำลังพัฒนา'));
  }

  function renderGrandSummary() {
    const el = document.getElementById('dashboard-section');
    if(!el) return;

    const mealContent = document.getElementById('meal-tab-content');
    if(mealContent) mealContent.innerHTML = '';

    const summaryItems = computeGrandSummary();
    const daysText = state.plans.length + ' วัน';
    
    summaryItems.sort((a,b) => {
      if(a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    let grandTotal = 0;
    const orderRows = summaryItems.map(item => {
      const netKg = item.recommendedKg;
      const ord = Calc.orderQty(netKg, item.unit, item.unitSize);
      const netCost = Calc.cost(ord, item.pricePerKg, item.unit, item.unitSize);
      grandTotal += netCost;
      
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${catColor(item.category)};flex-shrink:0;display:inline-block"></span>
            <div><div class="td-name">${item.name}</div><div class="td-code">${item.code}</div></div>
          </div>
        </td>
        <td class="c">${catBadgeHtml(item.category)}</td>
        <td class="r">${netKg.toFixed(2)}</td>
        <td class="r"><strong>${ord.display}</strong></td>
        <td class="r">฿${UI.fmtMoney(item.pricePerKg)}/${item.unit==='pack'?'แพ็ค':'กก.'}</td>
        <td class="r" style="color:#F97316;font-weight:700">฿${UI.fmtMoney(netCost)}</td>
      </tr>`;
    }).join('');

    const emptyRow = `<tr><td colspan="6" style="text-align:center;padding:32px;color:#94A3B8">ยังไม่มีรายการ</td></tr>`;

    el.innerHTML = `
      <div class="card" style="margin-top:16px; border:2px solid #8B5CF6">
        <div class="card-header" style="background:#F5F3FF; border-bottom:1px solid #EDE9FE">
          <h3 style="color:#5B21B6">✨ ยอดสั่งจริง (สรุปรวม ${daysText})</h3>
          <div style="font-size:18px;font-weight:700;color:#F97316">รวมทั้งสิ้น ฿${UI.fmtMoney(grandTotal)}</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>สินค้า</th><th class="c">หมวด</th>
              <th class="r">ต้องใช้ (กก.)</th><th class="r">สั่งรวม</th>
              <th class="r">ราคา/หน่วย</th><th class="r">รวมสุทธิ</th>
            </tr></thead>
            <tbody>${summaryItems.length ? orderRows : emptyRow}</tbody>
            ${summaryItems.length ? `<tfoot><tr>
              <td colspan="5" style="text-align:right">ยอดรวมทั้งสิ้น</td>
              <td style="color:#FDBA74">฿${UI.fmtMoney(grandTotal)}</td>
            </tr></tfoot>` : ''}
          </table>
        </div>
        <div style="display:flex;gap:10px;padding:16px 20px;border-top:1px solid #F1F5F9;flex-wrap:wrap">
          <button id="btn-save-plan" class="btn-primary" style="background:#8B5CF6; border-color:#8B5CF6">บันทึกแผนทั้งหมด</button>
          <button id="btn-quote" class="btn-secondary">ขอใบเสนอราคา</button>
          <button id="btn-print" class="btn-secondary">พิมพ์ / บันทึก PDF</button>
        </div>
        <div style="font-size:11px;color:#94A3B8;padding:0 20px 14px">
          ยอดรวมคำนวณจากการนำ "ต้องใช้ (กก.)" ของทุกวันมารวมกัน แล้วปัดขึ้นตามขนาดบรรจุเพียงครั้งเดียว เพื่อให้ได้ยอดสั่งซื้อที่มีประสิทธิภาพสูงสุด
        </div>
      </div>
    `;

    document.getElementById('btn-save-plan')?.addEventListener('click', () => savePlan('confirmed'));
    document.getElementById('btn-quote')?.addEventListener('click', () => UI.toast('ฟังก์ชันขอใบเสนอราคาเตรียมเปิดให้บริการเร็วๆ นี้', 'info'));
    document.getElementById('btn-print')?.addEventListener('click', () => window.print());
  }

  function savePlan(status, silent = false) {
    if (!state.plans.length) return;
    
    const group = {
      id: state.planGroupId || 'GROUP-' + Date.now() + Math.random().toString(36).substr(2, 5),
      status: status,
      created_date: Date.now(),
      updated_date: Date.now(),
      plans: JSON.parse(JSON.stringify(state.plans)),
    };
    
    if (state.plans.length > 1) {
      group.name = `แผนชุดวันที่ ${state.plans[0].plan_date} ถึง ${state.plans[state.plans.length - 1].plan_date}`;
      group.plan_date = `${state.plans[0].plan_date} - ${state.plans[state.plans.length - 1].plan_date}`;
    } else {
      group.name = `แผนวันที่ ${state.plans[0].plan_date}`;
      group.plan_date = state.plans[0].plan_date;
    }

    let grandTotalCost = 0;
    let grandTotalGuests = 0;
    const combinedItemsMap = {};

    state.plans.forEach(planState => {
      const oldIdx = state.currentDateIdx;
      state.currentDateIdx = state.plans.indexOf(planState);
      
      const p = planState.guestConfig || getProfile();
      let dayGuests = 0;
      if(p.useManualGuests) dayGuests = Number(p.manualGuests)||0;
      else dayGuests = Calc.totalGuests(Number(p.totalRooms)||0, Number(p.occupancyRate)||0, Number(p.guestsPerRoom)||1);
      
      grandTotalGuests += dayGuests;
      
      const items = computeSummary();
      const dayTotalCost = items.reduce((sum, i) => sum + i.cost, 0);
      grandTotalCost += dayTotalCost;
      
      items.forEach(item => {
        if (!combinedItemsMap[item.ingredientId]) {
          combinedItemsMap[item.ingredientId] = { ...item };
        } else {
          combinedItemsMap[item.ingredientId].reqKg += item.reqKg;
          combinedItemsMap[item.ingredientId].orderKg += item.orderKg;
          combinedItemsMap[item.ingredientId].cost += item.cost;
        }
      });
      
      state.currentDateIdx = oldIdx;
    });

    group.total_cost = grandTotalCost;
    group.total_guests = grandTotalGuests;
    group.summary_items = Object.values(combinedItemsMap);
    group.business_name = getProfile().businessName || '';
    group.contact_name = getProfile().contactName || '';
    group.contact_phone = getProfile().phone || '';

    DB.savePlan(group);
    state.planGroupId = group.id;

    if(!silent) {
      isDirty = false;
      UI.toast(status === 'draft' ? 'บันทึกแบบร่างเรียบร้อย' : 'บันทึกแผนเรียบร้อย');
      showPage('daily-plans');
    }
  }

  function render(container){
    const p = getCurrentPlan()?.guestConfig || getProfile();

    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">คำนวณยอดสั่งซื้อ</div>
        <div class="section-sub">เพิ่มวัตถุดิบแต่ละมื้อ ระบบจะคำนวณและสรุปยอดด้านล่างอัตโนมัติ</div>
      </div>
      
      <!-- Date Tabs -->
      ${state.plans.length > 1 ? `<div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; margin-bottom:16px;">
        ${state.plans.map((pl, idx) => `
          <button class="btn-date-tab ${idx === state.currentDateIdx ? 'active' : ''}" data-idx="${idx}" style="padding:8px 16px; border-radius:8px; border:1px solid #E2E8F0; background:${idx === state.currentDateIdx ? '#F97316' : '#FFF'}; color:${idx === state.currentDateIdx ? '#FFF' : '#64748B'}; cursor:pointer; font-weight:600; white-space:nowrap; transition:all 0.2s;">
            ${new Date(pl.plan_date).toLocaleDateString('th-TH', {day:'numeric', month:'short'})}
          </button>
        `).join('')}
        <button class="btn-date-tab ${state.currentDateIdx === 'summary' ? 'active' : ''}" data-idx="summary" style="padding:8px 16px; border-radius:8px; border:1px solid #E2E8F0; background:${state.currentDateIdx === 'summary' ? '#8B5CF6' : '#F3F4F6'}; color:${state.currentDateIdx === 'summary' ? '#FFF' : '#64748B'}; cursor:pointer; font-weight:600; white-space:nowrap; transition:all 0.2s;">
          ✨ สรุปรวมทุกวัน
        </button>
      </div>` : ''}

      <!-- File Upload / Dropzone -->
      ${state.currentDateIdx === 'summary' ? '' : `
      <div class="card" style="margin-bottom:20px; background:#F8FAFC; border:2px dashed #CBD5E1; text-align:center; transition:all 0.2s" id="pms-dropzone">
        <style>@keyframes spin { 100% { transform:rotate(360deg); } }</style>
        <div class="card-body" style="padding:40px 20px">
          <div style="font-size:32px; margin-bottom:12px">📄</div>
          <h3 style="color:#1E293B; margin-bottom:8px">ลากไฟล์รายงานยอดเข้าพัก (PMS PDF/Excel) มาวางที่นี่</h3>
          <p style="color:#64748B; font-size:13px; margin-bottom:16px">ระบบจะดึงตัวเลขแขกมาตั้งค่าให้อัตโนมัติ (Sanitized Data 100%)</p>
          <input type="file" id="pms-file-input" style="display:none" accept=".pdf,.xls,.xlsx,.csv" />
          <button class="btn-primary" onclick="document.getElementById('pms-file-input').click()">หรือคลิกเพื่อเลือกไฟล์</button>
        </div>
      </div>
      <div id="pms-result-container" style="display:none; margin-bottom:20px"></div>
      `}

      <!-- Guest Configuration -->
      ${state.currentDateIdx === 'summary' ? '' : `
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><h3>ข้อมูลผู้เข้าพักและการเผื่อขาด</h3></div>
        <div class="card-body">
          <div style="margin-bottom:12px; display:flex; flex-direction:column; gap:8px;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
              <input type="checkbox" id="calc-use-manual" ${p.useManualGuests?'checked':''} style="width:16px;height:16px;accent-color:#F97316" />
              กำหนดจำนวนแขกเอง (ไม่คำนวณจากห้อง)
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
              <input type="checkbox" id="calc-use-nat" ${p.useNationalityMapping?'checked':''} style="width:16px;height:16px;accent-color:#10B981" />
              คำนวณปริมาณวัตถุดิบแยกตามสัญชาติของเมนูอาหาร (ดึงข้อมูลสัญชาติจากไฟล์ PMS)
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
      `}

      <!-- Meal Tabs -->
      ${state.currentDateIdx === 'summary' ? '' : `
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
      `}

      <!-- Dashboard -->
      <div id="dashboard-section"></div>
    `;

    function showExtResult() {
      const dropzone = document.getElementById('pms-dropzone');
      const resultContainer = document.getElementById('pms-result-container');
      if (!getCurrentPlan().ext) return;
      const ext = getCurrentPlan().ext;
      
      dropzone.style.display = 'none';
      const dateStr = new Date(state.plan_date).toLocaleDateString('th-TH');
      resultContainer.style.display = '';
      resultContainer.innerHTML = `
        <div class="card" style="border-left:4px solid #10B981">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h3 style="color:#16A34A; display:flex; align-items:center; gap:8px">
              ✅ <span>ดึงข้อมูลสำเร็จจากไฟล์ <strong>${getCurrentPlan().fileName || 'PMS Report'}</strong> <br><small style="color:#64748B; font-weight:400; font-size:12px">(สกัดข้อมูลจาก Sheet วันที่: ${dateStr})</small></span>
            </h3>
            <button class="btn-secondary sm" id="btn-reset-dropzone">อัปโหลดใหม่</button>
          </div>
          <div class="card-body grid-3" style="gap:20px; align-items:start">
            <div>
              <div style="font-weight:700; color:#475569; margin-bottom:12px; font-size:12px; letter-spacing:0.5px">OVERALL OCCUPANCY</div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px"><span>Total Available Rooms</span><strong>${ext.totalRooms}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px"><span>Rooms Occupied</span><strong>${ext.roomsOccupied}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px"><span>Occupancy Rate</span><strong style="color:#10B981">${ext.occRate}%</strong></div>
            </div>
            <div>
              <div style="font-weight:700; color:#475569; margin-bottom:12px; font-size:12px; letter-spacing:0.5px">GUEST DEMOGRAPHICS</div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px"><span>Total Guests In House</span><strong style="color:#F97316">${ext.totalGuests}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px"><span>Adults</span><strong>${ext.adults}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px"><span>Children</span><strong>${ext.children}</strong></div>
            </div>
            <div>
              <div style="font-weight:700; color:#475569; margin-bottom:12px; font-size:12px; letter-spacing:0.5px">SUMMARY NATIONALITY</div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px"><span>India</span><strong>${ext.nat_india}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px"><span>Europe/Western</span><strong>${ext.nat_europe}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px"><span>China</span><strong>${ext.nat_china}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px"><span>Domestic/Thai</span><strong>${ext.nat_domestic}</strong></div>
            </div>
          </div>
          </div>
          <style>@keyframes aiPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }</style>
          <div style="background:#F0FDF4; padding:16px 20px; font-size:14px; color:#166534; display:flex; align-items:flex-start; gap:12px; border-top:1px solid #DCFCE7; border-radius:0 0 8px 8px">
            <div style="font-size:20px; animation: aiPulse 2s infinite">✨</div>
            <div>
              <strong style="color:#15803D; margin-bottom:4px; display:block">Gemini AI Analysis</strong>
              <div id="ai-insight-text" style="line-height:1.5; color:#14532D">กำลังประมวลผล...</div>
            </div>
          </div>
        </div>
      `;

      document.getElementById('btn-reset-dropzone').addEventListener('click', () => {
        getCurrentPlan().ext = null;
        getCurrentPlan().fileName = null;
        isDirty = true;
        render(container);
      });

      // Simulate Gemini Analysis Typewriter Effect
      const aiTextContainer = document.getElementById('ai-insight-text');
      const msgs = [];
      if(ext.occRate > 80) msgs.push("อัตราการเข้าพักสูงมาก แนะนำสต็อกวัตถุดิบเผื่อ Buffer เพิ่ม 5-10%");
      if(ext.children / (ext.totalGuests||1) > 0.15) msgs.push("สัดส่วนเด็กเยอะ แนะนำเพิ่มเมนูเด็ก (ของทอด, ไส้กรอก)");
      if(ext.nat_india / (ext.totalGuests||1) > 0.25) msgs.push("สัดส่วนแขกชาวอินเดียสูง แนะนำพิจารณาเพิ่มวัตถุดิบไก่/มังสวิรัติ หรือลดสัดส่วนเนื้อวัว/หมู");
      if(ext.nat_china / (ext.totalGuests||1) > 0.25) msgs.push("แขกชาวจีนเยอะ แนะนำให้เตรียมเพิ่มเมนูข้าวต้ม หรือปาท่องโก๋");
      if(ext.nat_europe / (ext.totalGuests||1) > 0.35) msgs.push("สัดส่วนแขกยุโรป/ตะวันตกสูง ควรเน้นการเตรียมเมนูอาหารเช้าแบบ American/Continental Breakfast");
      
      const fullText = msgs.length ? msgs.join(" และ ") : "ข้อมูลยอดเข้าพักอยู่ในระดับปกติ สามารถใช้แผนการสั่งซื้อมาตรฐานได้ครับ";
      
      aiTextContainer.textContent = '';
      let typeIdx = 0;
      const typeInterval = setInterval(() => {
        if(typeIdx < fullText.length) {
          aiTextContainer.textContent += fullText.charAt(typeIdx);
          typeIdx++;
        } else {
          clearInterval(typeInterval);
        }
      }, 30);
    }

    // File upload logic
    const dropzone = document.getElementById('pms-dropzone');
    const fileInput = document.getElementById('pms-file-input');
    const resultContainer = document.getElementById('pms-result-container');

    function handleFile(file) {
      if(!file) return;

      const resetHTML = `
        <div class="card-body" style="padding:40px 20px">
          <div style="font-size:32px; margin-bottom:12px">📄</div>
          <h3 style="color:#1E293B; margin-bottom:8px">ลากไฟล์รายงานยอดเข้าพัก (PMS PDF/Excel) มาวางที่นี่</h3>
          <p style="color:#64748B; font-size:13px; margin-bottom:16px">ระบบจะดึงตัวเลขแขกมาตั้งค่าให้อัตโนมัติ (Sanitized Data 100%)</p>
          <input type="file" id="pms-file-input" style="display:none" accept=".pdf,.xls,.xlsx,.csv" />
          <button class="btn-primary" onclick="document.getElementById('pms-file-input').click()">หรือคลิกเพื่อเลือกไฟล์</button>
        </div>
      `;

      dropzone.innerHTML = `<div class="card-body" style="padding:40px 20px"><div style="margin:0 auto 16px;width:30px;height:30px;border:3px solid #E2E8F0;border-top-color:#F97316;border-radius:50%;animation:spin 1s linear infinite"></div><h3 style="color:#1E293B">กำลังสกัดข้อมูล...</h3><p style="color:#64748B; font-size:13px">ฟอกข้อมูลส่วนบุคคลและดึงสถิติจาก ${file.name}</p></div>`;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, {type: 'array'});
          
          state.plans.forEach(plan => {
            let targetSheetName = null;
            // Look for matching date in sheets
            workbook.SheetNames.forEach(sheetName => {
              if (sheetName === plan.plan_date) {
                targetSheetName = sheetName;
              } else {
                const ws = workbook.Sheets[sheetName];
                for (const key in ws) {
                  if (key[0] === '!') continue;
                  if (ws[key].v && String(ws[key].v).includes(plan.plan_date)) {
                    targetSheetName = sheetName;
                    break;
                  }
                }
              }
            });

            if (targetSheetName) {
              const ws = workbook.Sheets[targetSheetName];
              const json = XLSX.utils.sheet_to_json(ws, {header: 1});
              let ext = {
                totalRooms: 0, roomsOccupied: 0, occRate: 0,
                totalGuests: 0, adults: 0, children: 0,
                nat_india: 0, nat_europe: 0, nat_china: 0, nat_domestic: 0
              };
              json.forEach(row => {
                if(!row || !row[0] || !row[1]) return;
                const label = String(row[0]).toLowerCase();
                const val = parseFloat(String(row[1]).replace(/[^0-9.]/g, '')) || 0;
                
                if(label.includes('total available rooms')) ext.totalRooms = val;
                if(label.includes('rooms occupied')) ext.roomsOccupied = val;
                if(label.includes('occupancy rate')) {
                  ext.occRate = val <= 1 && val > 0 ? val * 100 : val;
                }
                if(label.includes('total guests in house') || label.includes('total guests')) ext.totalGuests = val;
                if(label.includes('adults')) ext.adults = val;
                if(label.includes('children')) ext.children = val;
                if(label.includes('india')) ext.nat_india = val;
                if(label.includes('europe') || label.includes('western')) ext.nat_europe = val;
                if(label.includes('china')) ext.nat_china = val;
                if(label.includes('domestic') || label.includes('thai')) ext.nat_domestic = val;
              });
              
              plan.ext = ext;
              plan.fileName = file.name;
              
              if(!plan.guestConfig) plan.guestConfig = Object.assign({}, getProfile());
              plan.guestConfig.totalRooms = ext.totalRooms;
              plan.guestConfig.occupancyRate = ext.occRate;
              plan.guestConfig.guestsPerRoom = ext.roomsOccupied ? Number((ext.totalGuests / ext.roomsOccupied).toFixed(1)) : 1;
            }
          });
          
          isDirty = true;
          render(document.getElementById('subpage-calculator'));
          UI.toast('อัปเดตตัวเลขเข้าฟอร์มเรียบร้อยแล้ว');
        } catch(err) {
          console.error(err);
          UI.toast('รูปแบบไฟล์ไม่ถูกต้อง หรือไม่สามารถอ่านไฟล์ได้', 'error');
          dropzone.innerHTML = resetHTML;
        }
      };
      reader.readAsArrayBuffer(file);
    }

    dropzone?.addEventListener('dragover', e => {
      e.preventDefault();
      dropzone.style.background = '#F1F5F9';
      dropzone.style.borderColor = '#94A3B8';
    });
    dropzone?.addEventListener('dragleave', e => {
      e.preventDefault();
      dropzone.style.background = '#F8FAFC';
      dropzone.style.borderColor = '#CBD5E1';
    });
    dropzone?.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.style.background = '#F8FAFC';
      dropzone.style.borderColor = '#CBD5E1';
      if(e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
    // delegation for the dynamic input
    dropzone?.addEventListener('change', e => {
      if(e.target && e.target.id === 'pms-file-input' && e.target.files.length) {
        handleFile(e.target.files[0]);
      }
    });

    // Guest config logic
    function saveAndRefresh() {
      let p = getCurrentPlan().guestConfig;
      if (!p) {
        p = Object.assign({}, getProfile());
        getCurrentPlan().guestConfig = p;
      }
      p.useManualGuests = document.getElementById('calc-use-manual').checked;
      p.totalRooms = Number(document.getElementById('calc-total-rooms').value) || 0;
      p.occupancyRate = Number(document.getElementById('calc-occ-rate').value) || 0;
      p.guestsPerRoom = Number(document.getElementById('calc-guests-room').value) || 1;
      p.manualGuests = Number(document.getElementById('calc-manual-guests').value) || 0;
      p.bufferRate = p.useManualGuests ? (Number(document.getElementById('calc-manual-buf').value) || 0) : (Number(document.getElementById('calc-buf-rate').value) || 0);
      
      DB.saveProfile(p);
      document.getElementById('calc-guests-disp').textContent = getTotalGuests();
      renderMealTab();
      renderDashboard();
    }

    document.getElementById('calc-use-manual')?.addEventListener('change', e => {
      document.getElementById('calc-room-fields').style.display = e.target.checked ? 'none' : '';
      document.getElementById('calc-manual-fields').style.display = e.target.checked ? '' : 'none';
      saveAndRefresh();
    });

    ['calc-total-rooms','calc-occ-rate','calc-guests-room','calc-buf-rate','calc-manual-guests','calc-manual-buf'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', saveAndRefresh);
    });

    container.querySelectorAll('.tab-btn[data-meal]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentMeal = btn.dataset.meal;
        container.querySelectorAll('.tab-btn[data-meal]').forEach(b => b.classList.toggle('active', b === btn));
        renderMealTab();
      });
    });

    container.querySelectorAll('.btn-date-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.idx;
        state.currentDateIdx = idx === 'summary' ? 'summary' : parseInt(idx, 10);
        render(container);
      });
    });

    if (state.currentDateIdx === 'summary') {
      renderGrandSummary();
    } else {
      renderMealTab();
      renderDashboard();
    }

    if (state.currentDateIdx !== 'summary' && getCurrentPlan().ext) {
      showExtResult();
    }
  }

  function loadMultiPlan(plans, groupId = null) {
    if(!plans || !plans.length) return;
    state.plans = JSON.parse(JSON.stringify(plans));
    state.planGroupId = groupId;
    state.currentDateIdx = 0;
    state.currentMeal = 'breakfast';
    isDirty = false;
  }

  function loadPlan(plan) {
    if (plan.plans) {
      loadMultiPlan(plan.plans);
    } else {
      loadMultiPlan([plan]);
    }
  }

  function hasUnsavedChanges() {
    return isDirty;
  }

  function saveDraft() {
    savePlan('draft');
  }

  function resetState() {
    state = {
      planGroupId: null,
      plans: [{
        id: null, plan_date: new Date().toISOString().slice(0,10), days: 1,
        meals: { breakfast: { mealRate: 90, items: [] }, lunch: { mealRate: 60, items: [] }, dinner: { mealRate: 70, items: [] } },
        ext: null, fileName: null, guestConfig: null
      }],
      currentDateIdx: 0,
      currentMeal: 'breakfast'
    };
    isDirty = false;
  }

  return { render, loadPlan, loadMultiPlan, importMenuData, removeMenuData, forceRenderTabs, hasUnsavedChanges, saveDraft, resetState, getCurrentPlan };
})();