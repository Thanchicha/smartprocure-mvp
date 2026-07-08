const fs = require('fs');

let code = fs.readFileSync('pages/calculator.js', 'utf8');

code = code.replace(
`  let state = {
    id: null,
    plan_date: new Date().toISOString().slice(0,10),
    days: 1,
    meals: {
      breakfast: { mealRate: 90, items: [] },
      lunch:     { mealRate: 60, items: [] },
      dinner:    { mealRate: 70, items: [] },
    },
    currentMeal: 'breakfast',
    ext: null,
    fileName: null,
  };`,
`  let state = {
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
  }`
);

code = code.replace(
`  function getTotalGuests(){
    const p = getProfile();`,
`  function getTotalGuests(){
    const p = getCurrentPlan()?.guestConfig || getProfile();`
);

code = code.replace(/getProfile\(\)\.bufferRate/g, "(getCurrentPlan()?.guestConfig?.bufferRate || getProfile().bufferRate)");

code = code.replace(/state\.meals/g, "getCurrentPlan().meals");
code = code.replace(/state\.plan_date/g, "getCurrentPlan().plan_date");
code = code.replace(/state\.days/g, "getCurrentPlan().days");
code = code.replace(/state\.ext/g, "getCurrentPlan().ext");
code = code.replace(/state\.fileName/g, "getCurrentPlan().fileName");

const savePlanRegex = /function savePlan\(status\) \{[\s\S]*?DB\.savePlan\(plan\);\n    if\(!silent\) \{\n      isDirty = false;\n      UI\.toast[\s\S]*?\}\n  \}/;
const newSavePlan = `function savePlan(status, silent = false) {
    if (!state.plans.length) return;
    state.plans.forEach(planState => {
      const oldIdx = state.currentDateIdx;
      state.currentDateIdx = state.plans.indexOf(planState);
      
      const p = planState.guestConfig || getProfile();
      const items = computeSummary();
      const total = items.reduce((sum, i) => sum + i.cost, 0);
      
      const plan = {
        id: planState.id || undefined,
        plan_date: planState.plan_date,
        business_name: getProfile().businessName, contact_name: getProfile().contactName||'',
        total_rooms: p.totalRooms, occupancy_rate: p.occupancyRate,
        guests_per_room: p.guestsPerRoom, buffer_rate: p.bufferRate,
        days: planState.days, total_guests: getTotalGuests(),
        meals: JSON.parse(JSON.stringify(planState.meals)),
        ext: planState.ext ? JSON.parse(JSON.stringify(planState.ext)) : null,
        fileName: planState.fileName,
        guestConfig: p,
        summary_items: items, total_cost: total * planState.days, status: status,
      };
      DB.savePlan(plan);
      state.currentDateIdx = oldIdx;
    });

    if(!silent) {
      isDirty = false;
      UI.toast(status === 'draft' ? 'บันทึกแบบร่างเรียบร้อย' : 'บันทึกแผนเรียบร้อย');
      showPage('daily-plans');
    }
  }`;
code = code.replace(savePlanRegex, newSavePlan);

const renderStartRegex = /function render\(container\)\{[\s\S]*?container\.innerHTML = `/;
const newRenderStart = `function render(container){
    const p = getCurrentPlan()?.guestConfig || getProfile();

    container.innerHTML = \`
      <div class="page-header">
        <div class="section-title">คำนวณยอดสั่งซื้อ</div>
        <div class="section-sub">เพิ่มวัตถุดิบแต่ละมื้อ ระบบจะคำนวณและสรุปยอดด้านล่างอัตโนมัติ</div>
      </div>
      
      \${state.plans.length > 1 ? \`<div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; margin-bottom:16px;">
        \${state.plans.map((pl, idx) => \`
          <button class="btn-date-tab \${idx === state.currentDateIdx ? 'active' : ''}" data-idx="\${idx}" style="padding:8px 16px; border-radius:8px; border:1px solid #E2E8F0; background:\${idx === state.currentDateIdx ? '#F97316' : '#FFF'}; color:\${idx === state.currentDateIdx ? '#FFF' : '#64748B'}; cursor:pointer; font-weight:600; white-space:nowrap; transition:all 0.2s;">
            \${new Date(pl.plan_date).toLocaleDateString('th-TH', {day:'numeric', month:'short'})}
          </button>
        \`).join('')}
      </div>\` : ''}
\`;
code = code.replace(renderStartRegex, newRenderStart);

const loadPlanRegex = /function loadPlan\(plan\) \{[\s\S]*?isDirty = false;\n  \}/;
const newLoadPlan = `function loadMultiPlan(plans) {
    state.plans = plans.map(p => ({
      id: p.id,
      plan_date: p.plan_date,
      days: p.days || 1,
      meals: JSON.parse(JSON.stringify(p.meals)),
      ext: p.ext ? JSON.parse(JSON.stringify(p.ext)) : null,
      fileName: p.fileName || null,
      guestConfig: p.guestConfig || null
    }));
    state.currentDateIdx = 0;
    state.currentMeal = 'breakfast';
    isDirty = false;
  }

  function loadPlan(plan) {
    loadMultiPlan([plan]);
  }`;
code = code.replace(loadPlanRegex, newLoadPlan);

const resetStateRegex = /function resetState\(\) \{[\s\S]*?isDirty = false;\n  \}/;
const newResetState = `function resetState() {
    state = {
      plans: [{
        id: null, plan_date: new Date().toISOString().slice(0,10), days: 1,
        meals: { breakfast: { mealRate: 90, items: [] }, lunch: { mealRate: 60, items: [] }, dinner: { mealRate: 70, items: [] } },
        ext: null, fileName: null, guestConfig: null
      }],
      currentDateIdx: 0,
      currentMeal: 'breakfast',
    };
    isDirty = false;
  }`;
code = code.replace(resetStateRegex, newResetState);

code = code.replace(/renderMealTab\(\);\n    renderDashboard\(\);\n\n    if \(getCurrentPlan\(\)\.ext\)/,
`container.querySelectorAll('.btn-date-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentDateIdx = +btn.dataset.idx;
        render(container);
      });
    });

    renderMealTab();
    renderDashboard();

    if (getCurrentPlan().ext)`);

const handleFileRegex = /let targetSheetName = null;[\s\S]*?const json = XLSX\.utils\.sheet_to_json\(ws, \{header: 1\}\);/;
const newHandleFile = `
          state.plans.forEach((plan, idx) => {
            let targetSheetName = null;
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
          
          return;
          const json = [];`;
code = code.replace(handleFileRegex, newHandleFile);

const saveAndRefreshRegex = /function saveAndRefresh\(\) \{[\s\S]*?renderDashboard\(\);\n    \}/;
const newSaveAndRefresh = `function saveAndRefresh() {
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
    }`;
code = code.replace(saveAndRefreshRegex, newSaveAndRefresh);

code = code.replace(/loadPlan,\n    hasUnsavedChanges,/, "loadPlan,\n    loadMultiPlan,\n    hasUnsavedChanges,");

fs.writeFileSync('pages/calculator.js', code);
console.log('done');
