// SmartProcure — Daily Plans Page 

const DailyPlansPage = (() => {
  let expandedId = null;
  let searchQ = '';

  function render(container){
    const allPlansRaw = DB.getPlans();
    const allGroups = allPlansRaw.map(p => {
      if (p.plans) return p; // Already a group
      // Wrap old plan into a group
      return {
        id: p.id,
        name: p.business_name ? `แผนลูกค้า ${p.business_name}` : `แผนวันที่ ${p.plan_date}`,
        plan_date: p.plan_date,
        status: p.status,
        created_date: p.created_date || p.updatedAt,
        updated_date: p.updated_date || p.updatedAt,
        total_cost: p.total_cost,
        total_guests: p.total_guests,
        summary_items: p.summary_items,
        business_name: p.business_name,
        contact_name: p.contact_name,
        contact_phone: p.contact_phone,
        plans: [p] // The raw daily plan inside
      };
    });

    const plans = searchQ
      ? allGroups.filter(p=>(p.name||'').toLowerCase().includes(searchQ.toLowerCase())||(p.business_name||'').toLowerCase().includes(searchQ.toLowerCase())||(p.plan_date||'').includes(searchQ))
      : allGroups;

    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">แผนรายวัน</div>
        <div class="section-sub">รายการแผนวัตถุดิบที่บันทึกไว้</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="search-wrap" style="max-width:280px;flex:none;position:relative">
            <span class="search-icon" style="font-size:14px">&#128269;</span>
            <input type="text" class="search-input" id="plan-search" placeholder="ค้นหาชื่อหรือวันที่" value="${searchQ}" style="padding-left:36px!important" />
          </div>
          <span style="font-size:13px;color:#64748B">${plans.length} รายการ</span>
        </div>
        <button id="btn-add-plan" class="btn-primary" style="display:flex;align-items:center;gap:6px">
          <span style="font-size:16px">+</span> เพิ่มแผนรายวัน
        </button>
      </div>

      ${!plans.length ? `
        <div class="empty-state">
          <div class="icon" style="font-size:40px;color:#CBD5E1">&#128197;</div>
          <h3>ยังไม่มีแผนรายวัน</h3>
          <p>กดปุ่มด้านบนเพื่อสร้างแผนแรก</p>
        </div>` : `
        <div id="plans-list">
          ${plans.map(plan=>renderPlanCard(plan)).join('')}
        </div>`}

      <!-- Add Plan Modal -->
      <div id="add-plan-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center;">
        <div class="card" style="width:100%; max-width:320px; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.2);">
          <h3 style="margin-bottom:16px; font-size:18px; color:#1E3A5F;">เพิ่มแผนรายวันใหม่</h3>
          <div class="form-group">
            <label>ตั้งแต่วันที่</label>
            <input type="date" id="new-plan-start" style="width:100%" value="${new Date().toISOString().slice(0,10)}" />
          </div>
          <div class="form-group" style="margin-top:12px;">
            <label>ถึงวันที่</label>
            <input type="date" id="new-plan-end" style="width:100%" value="${new Date().toISOString().slice(0,10)}" />
          </div>
          <div class="form-group" style="margin-top:16px; padding:12px; background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:8px;">
            <label style="font-weight:600; color:#475569; display:block; margin-bottom:8px;">นำเข้า Daily Report (CSV)</label>
            <input type="file" id="csv-upload" accept=".csv" style="font-size:12px; width:100%;" />
            <div style="font-size:11px; color:#94A3B8; margin-top:4px;">ระบบจะดึงเฉพาะสถิติสัญชาติและมื้ออาหาร (ไม่บันทึกชื่อลูกค้า/เบอร์ห้อง)</div>
          </div>
          <div style="display:flex; gap:10px; margin-top:24px;">
            <button class="btn-secondary" id="btn-cancel-add" style="flex:1">ยกเลิก</button>
            <button class="btn-primary" id="btn-confirm-add" style="flex:1">เริ่มคำนวณ</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('plan-search')?.addEventListener('input',e=>{
      searchQ = e.target.value;
      render(container);
    });

    const modal = document.getElementById('add-plan-modal');
    document.getElementById('btn-add-plan')?.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
    document.getElementById('btn-cancel-add')?.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    document.getElementById('btn-confirm-add')?.addEventListener('click', () => {
      const startD = document.getElementById('new-plan-start').value || new Date().toISOString().slice(0,10);
      const endD = document.getElementById('new-plan-end').value || startD;
      
      const sDate = new Date(startD);
      const eDate = new Date(endD);
      if(eDate < sDate) {
        UI.toast('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น', 'error');
        return;
      }
      
      const fileInput = document.getElementById('csv-upload');
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          const csvText = e.target.result;
          processCsvAndCreatePlan(csvText, sDate, eDate);
        };
        reader.readAsText(file);
      } else {
        createPlansFromDates(sDate, eDate, null);
      }
    });

    function processCsvAndCreatePlan(csvText, sDate, eDate) {
      const lines = csvText.split('\\n');
      let isGuestList = false;
      const headers = [];
      const mealCounts = {
        breakfast: { total: 0, adults: 0, children: 0, nat: {} },
        lunch: { total: 0, adults: 0, children: 0, nat: {} },
        dinner: { total: 0, adults: 0, children: 0, nat: {} }
      };
      
      let totalGuests = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        
        if (cols[0] === 'Total Guests In House') {
          totalGuests = parseInt(cols[1]) || 0;
        }

        if (cols[0] === 'Guest Name' && cols.includes('Nationality') && cols.includes('Meal Plan Code')) {
          isGuestList = true;
          cols.forEach(c => headers.push(c));
          continue;
        }

        if (isGuestList && headers.length > 0) {
          if (!cols[0]) continue; // Skip empty rows
          const row = {};
          headers.forEach((h, idx) => {
            row[h] = cols[idx];
          });
          
          const nat = row['Nationality'] || 'Unknown';
          const mealPlan = (row['Meal Plan Code'] || '').toUpperCase();
          const isChild = (row['Adult/Child'] || '').toUpperCase() === 'CHILD';
          
          const addCount = (mealKey) => {
            mealCounts[mealKey].total++;
            if (isChild) mealCounts[mealKey].children++;
            else mealCounts[mealKey].adults++;
            mealCounts[mealKey].nat[nat] = (mealCounts[mealKey].nat[nat] || 0) + 1;
          };

          if (['BB', 'HB', 'FB'].includes(mealPlan)) addCount('breakfast');
          if (['FB'].includes(mealPlan)) addCount('lunch');
          if (['HB', 'FB'].includes(mealPlan)) addCount('dinner');
        }
      }
      
      const ext = {
        totalGuests,
        mealCounts
      };
      
      createPlansFromDates(sDate, eDate, ext);
    }

    function createPlansFromDates(sDate, eDate, extData) {
      modal.style.display = 'none';
      const plans = [];
      const curr = new Date(sDate);
      
      let guestConfig = null;
      let mealsConfig = {
        breakfast: { mealRate: 90, items: [] },
        lunch:     { mealRate: 60, items: [] },
        dinner:    { mealRate: 70, items: [] }
      };

      if (extData && extData.totalGuests > 0) {
        guestConfig = Object.assign({}, DB.getProfile());
        guestConfig.useManualGuests = true;
        guestConfig.manualGuests = extData.totalGuests;
        
        mealsConfig.breakfast.mealRate = Math.round((extData.mealCounts.breakfast.total / extData.totalGuests) * 100) || 0;
        mealsConfig.lunch.mealRate = Math.round((extData.mealCounts.lunch.total / extData.totalGuests) * 100) || 0;
        mealsConfig.dinner.mealRate = Math.round((extData.mealCounts.dinner.total / extData.totalGuests) * 100) || 0;
      }

      while(curr <= eDate) {
        const dStr = curr.toISOString().slice(0,10);
        const plan = {
          id: null, plan_date: dStr, days: 1,
          meals: JSON.parse(JSON.stringify(mealsConfig))
        };
        if (guestConfig) plan.guestConfig = JSON.parse(JSON.stringify(guestConfig));
        if (extData) plan.ext = JSON.parse(JSON.stringify(extData));
        
        plans.push(plan);
        curr.setDate(curr.getDate() + 1);
      }
      
      if(CalculatorPage.loadMultiPlan) {
        CalculatorPage.loadMultiPlan(plans, null);
      }
      showPage('calculator');
    }

    container.querySelectorAll('.plan-toggle').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id = btn.dataset.id;
        expandedId = expandedId===id ? null : id;
        render(container);
      });
    });
    container.querySelectorAll('.plan-delete').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(!UI.confirm('ยืนยันการลบแผนนี้?')) return;
        DB.deletePlan(btn.dataset.id);
        UI.toast('ลบแผนเรียบร้อย');
        render(container);
      });
    });
    container.querySelectorAll('.plan-edit').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const allPlansRaw = DB.getPlans();
        let group = allPlansRaw.find(p => p.id === btn.dataset.id);
        if(!group) return;
        if (!group.plans) group = { id: group.id, plans: [group] }; // normalize
        
        CalculatorPage.loadMultiPlan(group.plans, group.id);
        showPage('calculator');
        UI.toast('โหลดแผนชุดเพื่อแก้ไขแล้ว');
      });
    });

    container.querySelectorAll('.btn-edit-single-day').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const allPlansRaw = DB.getPlans();
        let group = allPlansRaw.find(p => p.id === btn.dataset.groupId);
        if(!group) return;
        if (!group.plans) group = { id: group.id, plans: [group] }; // normalize
        
        const singleDayPlan = group.plans.find(d => d.plan_date === btn.dataset.date);
        if (!singleDayPlan) return;
        
        // Load the single day plan without the groupId so it saves as a new group
        CalculatorPage.loadMultiPlan([singleDayPlan], null);
        showPage('calculator');
        UI.toast('แยกวันมาแก้ไขเรียบร้อย (บันทึกจะเป็นแผนชุดใหม่)');
      });
    });

    container.querySelectorAll('.btn-submit-daily').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const allPlansRaw = DB.getPlans();
        let group = allPlansRaw.find(p => p.id === btn.dataset.groupId);
        if(!group) return;
        if (!group.plans) group = { id: group.id, plans: [group] };
        
        const plan = group.plans.find(d => d.plan_date === btn.dataset.date);
        if (!plan) return;

        const ok = await UI.confirm('ยืนยันส่งออเดอร์', `ส่งออเดอร์วันที่ ${plan.plan_date} ให้ซัพพลายเออร์ใช่หรือไม่?`, {okText: 'ส่งออเดอร์', okColor: '#8B5CF6'});
        if(!ok) return;

        // Map items
        const netItems = (plan.summary_items || []).map(item => {
          return {
            ...item,
            leftover: 0,
            netKg: item.orderKg || 0,
            netCost: item.cost || 0,
            moqStatus: Calc.moqStatus(item.orderKg || 0, item.moq || 0)
          };
        });

        const order = {
          order_name: `ออเดอร์วันที่ ${plan.plan_date}`,
          target_dates: [plan.plan_date],
          aggregated_items: plan.summary_items || [],
          leftover_stocks: {},
          net_order_items: netItems,
          total_recommended_cost: plan.total_cost,
          total_net_cost: plan.total_cost,
          status: 'submitted',
          confirmed_at: new Date().toISOString(),
        };

        DB.saveOrder(order);
        
        // Mark plan as submitted
        plan.order_status = 'submitted';
        
        // Save plan back to DB
        if (group.plans.length === 1 && group.id === plan.id) {
          DB.savePlan(plan);
        } else {
          // It's inside a group
          const idx = allPlansRaw.findIndex(p => p.id === group.id);
          if(idx > -1) {
            allPlansRaw[idx] = group;
            localStorage.setItem('sp_daily_plans_' + (Auth.getSession()?.username || 'default'), JSON.stringify(allPlansRaw));
          }
        }
        
        UI.toast('ส่งออเดอร์ให้ซัพพลายเออร์เรียบร้อยแล้ว!', 'success');
        render(container);
      });
    });
  }

  function renderPlanCard(group){
    const isOpen = expandedId === group.id;
    const total = group.total_cost||0;
    const items = group.summary_items||[];
    const daysCount = group.plans ? group.plans.length : 1;

    let detail = '';
    if(isOpen){
      const infoRow = `
        <div class="info-grid" style="margin-bottom:16px">
          <div class="info-item"><div class="lbl">ลูกค้า</div><div class="val">${group.business_name||'-'}</div></div>
          <div class="info-item"><div class="lbl">ผู้ติดต่อ</div><div class="val">${group.contact_name||'-'}</div></div>
          <div class="info-item"><div class="lbl">เบอร์โทร</div><div class="val">${group.contact_phone||'-'}</div></div>
          <div class="info-item"><div class="lbl">แขกรวมทั้งหมด</div><div class="val">${group.total_guests||'-'} คน</div></div>
        </div>`;
      
      const dayCards = (group.plans||[]).map(d => `
        <div style="background:#FFF;border:1px solid #E2E8F0;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <strong style="color:#1E293B">วันที่ ${d.plan_date}</strong>
              ${d.order_status === 'submitted' ? '<span class="badge" style="background:#DBEAFE;color:#1D4ED8;padding:2px 8px;font-size:11px;">ส่งออเดอร์แล้ว</span>' : ''}
            </div>
            <div style="font-size:12px;color:#64748B;margin-top:2px">ยอดสั่งซื้อ: ฿${UI.fmtMoney(d.total_cost || 0)}</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn-secondary sm btn-edit-single-day" data-group-id="${group.id}" data-date="${d.plan_date}" style="font-size:12px">แก้ไข</button>
            ${d.order_status !== 'submitted' ? `<button class="btn-primary sm btn-submit-daily" data-group-id="${group.id}" data-date="${d.plan_date}" style="font-size:12px;background:#8B5CF6;border:none">ส่งออเดอร์</button>` : ''}
          </div>
        </div>
      `).join('');

      detail = `
        <div style="border-top:1px solid #F1F5F9;padding:16px;background:#F8FAFC">
          ${infoRow}
          <div style="margin-bottom:12px;font-weight:600;color:#334155;">รายละเอียดแต่ละวัน:</div>
          ${dayCards}
        </div>`;
    }

    return `
      <div class="card" style="margin-bottom:12px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#3B82F6">แฟ้ม</div>
            <div>
              <div style="font-weight:700;color:#1E293B">${group.name || group.business_name || '-'}</div>
              <div style="font-size:12px;color:#64748B">จำนวน ${daysCount} วัน &nbsp;·&nbsp; ${items.length} สินค้าที่ต้องสั่ง ${group.status === 'draft' ? `<span class="badge" style="background:#E2E8F0;color:#475569;margin-left:4px;padding:2px 6px;font-size:11px">แบบร่าง</span>` : ''}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="text-align:right;display:none" class="sm-show">
              <div style="font-weight:700;color:#F97316">฿${UI.fmtMoney(total)}</div>
            </div>
            <button class="btn-secondary sm plan-edit" data-id="${group.id}" title="แก้ไขทั้งชุด" style="font-size:13px;padding:6px 10px;border-color:#10B981;color:#059669;background:#ECFDF5">แก้ไขทั้งชุด</button>
            <button class="btn-secondary sm plan-toggle" data-id="${group.id}">${isOpen?'ซ่อน':'ดูรายละเอียด'}</button>
            <button class="btn-danger plan-delete" data-id="${group.id}" title="ลบ" style="font-size:13px;padding:6px 10px">ลบ</button>
          </div>
        </div>
        ${detail}
      </div>`;
  }

  return { render };
})();