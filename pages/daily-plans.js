// SmartProcure — Daily Plans Page 

const DailyPlansPage = (() => {
  let expandedId = null;
  let searchQ = '';

  function render(container){
    const allPlans = DB.getPlans();
    const plans = searchQ
      ? allPlans.filter(p=>(p.business_name||'').toLowerCase().includes(searchQ.toLowerCase())||(p.plan_date||'').includes(searchQ))
      : allPlans;

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
            <label>เลือกวันที่</label>
            <input type="date" id="new-plan-date" style="width:100%" value="${new Date().toISOString().slice(0,10)}" />
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
      const d = document.getElementById('new-plan-date').value || new Date().toISOString().slice(0,10);
      modal.style.display = 'none';
      CalculatorPage.loadPlan({
        id: null, plan_date: d, days: 1,
        meals: {
          breakfast: { mealRate: 90, items: [] },
          lunch:     { mealRate: 60, items: [] },
          dinner:    { mealRate: 70, items: [] }
        }
      });
      showPage('calculator');
    });

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
        const plan = DB.getPlan(btn.dataset.id);
        if(!plan) return;
        CalculatorPage.loadPlan(plan);
        showPage('calculator');
        UI.toast('โหลดแผนเพื่อแก้ไขแล้ว');
      });
    });
  }

  function renderPlanCard(plan){
    const isOpen = expandedId===plan.id;
    const total = plan.total_cost||0;
    const items = plan.summary_items||[];

    let detail = '';
    if(isOpen){
      const infoRow = `
        <div class="info-grid" style="margin-bottom:16px">
          <div class="info-item"><div class="lbl">ลูกค้า</div><div class="val">${plan.business_name||'-'}</div></div>
          <div class="info-item"><div class="lbl">ผู้ติดต่อ</div><div class="val">${plan.contact_name||'-'}</div></div>
          <div class="info-item"><div class="lbl">เบอร์โทร</div><div class="val">${plan.contact_phone||'-'}</div></div>
          <div class="info-item"><div class="lbl">แขก</div><div class="val">${plan.total_guests||'-'} คน</div></div>
        </div>`;
      const tableRows = items.map(item=>`
        <tr>
          <td><div class="td-name">${item.name}</div><div class="td-code">${item.code}</div></td>
          <td class="c">${catBadgeHtml(item.category)}</td>
          <td class="r" style="font-weight:700">${(item.orderKg||0).toFixed(1)} กก.</td>
          <td class="r" style="color:#64748B">฿${UI.fmtMoney(item.pricePerKg)}</td>
          <td class="r" style="font-weight:700;color:#F97316">฿${UI.fmtMoney(item.cost)}</td>
        </tr>`).join('');
      detail = `
        <div style="border-top:1px solid #F1F5F9;padding:16px">
          ${infoRow}
          <div class="table-wrap" style="border-radius:10px;border:1px solid #F1F5F9;overflow:hidden">
            <table>
              <thead><tr><th>วัตถุดิบ</th><th class="c">หมวด</th><th class="r">สั่ง(กก.)</th><th class="r">ราคา/กก.</th><th class="r">รวม(฿)</th></tr></thead>
              <tbody>${tableRows||'<tr><td colspan="5" style="text-align:center;padding:20px;color:#94A3B8">ไม่มีข้อมูล</td></tr>'}</tbody>
              ${items.length?`<tfoot><tr><td colspan="4" style="text-align:right">ยอดรวม</td><td style="color:#FDBA74">฿${UI.fmtMoney(total)}</td></tr></tfoot>`:''}
            </table>
          </div>
        </div>`;
    }

    return `
      <div class="card" style="margin-bottom:12px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#3B82F6">แผน</div>
            <div>
              <div style="font-weight:700;color:#1E293B">${plan.business_name||'-'}</div>
              <div style="font-size:12px;color:#64748B">${plan.plan_date||''} &nbsp;·&nbsp; ${items.length} รายการ</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="text-align:right;display:none" class="sm-show">
              <div style="font-weight:700;color:#F97316">฿${UI.fmtMoney(total)}</div>
            </div>
            <button class="btn-secondary sm plan-edit" data-id="${plan.id}" title="แก้ไข" style="font-size:13px;padding:6px 10px;border-color:#93C5FD;color:#1D4ED8">แก้ไข</button>
            <button class="btn-secondary sm plan-toggle" data-id="${plan.id}">${isOpen?'ซ่อน':'ดูรายละเอียด'}</button>
            <button class="btn-danger plan-delete" data-id="${plan.id}" title="ลบ" style="font-size:13px;padding:6px 10px">ลบ</button>
          </div>
        </div>
        ${detail}
      </div>`;
  }

  return { render };
})();