// SmartProcure — Batch Order Page

const BatchOrderPage = (() => {
  let step = 1;
  let selectedPlanIds = new Set();
  let aggregated = [];
  let leftoverStocks = {};
  let orderName = '';
  let container = null;

  const _c = { 'ชิ้นส่วนวัว':'#EF4444', 'วัว/แปรรูป':'#B91C1C', 'ชิ้นส่วนหมู':'#EC4899', 'หมูแปรรูป':'#BE185D', 'ไก่/แปรรูป':'#EAB308', 'ปลา':'#06B6D4', 'กุ้ง':'#DC2626', 'หมึก':'#8B5CF6', 'หอย':'#F97316', 'ปู':'#F43F5E' };
  const catColor = c => _c[c] || '#94A3B8';

  function aggregate(){
    const map = {};
    selectedPlanIds.forEach(id=>{
      const plan = DB.getPlan(id);
      if(!plan) return;
      (plan.summary_items||[]).forEach(item=>{
        if(!map[item.ingredientId]){
          const ing = getIngredientById(item.ingredientId);
          map[item.ingredientId] = {
            ingredientId:item.ingredientId, code:item.code, name:item.name, category:item.category,
            pricePerKg:item.pricePerKg||ing?.pricePerKg||0, moq:ing?.moq||0,
            unit:ing?.unit||'kg', recommendedKg:0, orderKg:0, cost:0
          };
        }
        map[item.ingredientId].recommendedKg += item.recommendedKg||item.orderKg||0;
        map[item.ingredientId].orderKg += item.orderKg||0;
        map[item.ingredientId].cost += item.cost||0;
      });
    });
    aggregated = Object.values(map);
  }

  function getNetItems(){
    return aggregated.map(item=>{
      const leftover = parseFloat(leftoverStocks[item.ingredientId]||0);
      const rawNet = Math.max(0, item.orderKg - leftover);
      const ord = Calc.orderQty(rawNet, item.unit, item.unitSize||1);
      const netKg = ord.kg;
      const netCost = Math.round(netKg * item.pricePerKg);
      const moqSt = Calc.moqStatus(netKg, item.moq);
      return {...item, leftover, rawNet, netKg, netCost, moqStatus:moqSt, ordDisplay: ord.display};
    });
  }

  function renderStep1(){
    const plans = DB.getPlans();
    const rows = plans.length ? plans.map(plan=>`
      <div class="check-item ${selectedPlanIds.has(plan.id)?'selected':''}" data-id="${plan.id}">
        <input type="checkbox" ${selectedPlanIds.has(plan.id)?'checked':''} />
        <div style="flex:1">
          <div style="font-weight:600;color:#1E293B">${plan.business_name}</div>
          <div style="font-size:12px;color:#64748B">${plan.plan_date} &nbsp;·&nbsp; ${(plan.summary_items||[]).length} รายการ &nbsp;·&nbsp; ฿${UI.fmtMoney(plan.total_cost)}</div>
        </div>
      </div>`).join('') : `<div class="empty-state"><h3>ไม่มีแผนรายวัน</h3><p>กรุณาบันทึกแผนจากหน้าคำนวณก่อน</p></div>`;

    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">Batch Order</div>
        <div class="section-sub">รวมแผนหลายวันเพื่อสร้างคำสั่งซื้อ</div>
      </div>
      <div class="step-bar">
        <div class="step active">1. เลือกแผน</div>
        <div class="step">2. รวมรายการ</div>
        <div class="step">3. ยืนยันสั่งซื้อ</div>
      </div>
      <div class="card">
        <div class="card-header"><h3>เลือกแผนรายวัน (${selectedPlanIds.size} แผน)</h3></div>
        <div class="card-body">${rows}</div>
        <div style="padding:16px;border-top:1px solid #F1F5F9;display:flex;justify-content:flex-end">
          <button id="btn-next1" class="btn-primary" ${selectedPlanIds.size===0?'disabled style="opacity:.5"':''}>ถัดไป →</button>
        </div>
      </div>`;

    container.querySelectorAll('.check-item').forEach(el=>{
      el.addEventListener('click',()=>{
        const id=el.dataset.id;
        const chk=el.querySelector('input');
        if(selectedPlanIds.has(id)){ selectedPlanIds.delete(id); el.classList.remove('selected'); chk.checked=false; }
        else { selectedPlanIds.add(id); el.classList.add('selected'); chk.checked=true; }
        container.querySelector('#btn-next1').disabled = selectedPlanIds.size===0;
        container.querySelector('#btn-next1').style.opacity = selectedPlanIds.size===0?'0.5':'1';
      });
    });
    document.getElementById('btn-next1')?.addEventListener('click',()=>{
      if(selectedPlanIds.size===0) return;
      aggregate(); step=2; render(container);
    });
  }

  function renderStep2(){
    const total = aggregated.reduce((a,i)=>a+i.cost,0);
    const rows = aggregated.map(item=>`
      <tr>
        <td><div class="td-name">${item.name}</div><div class="td-code">${item.code}</div></td>
        <td class="c">${catBadgeHtml(item.category)}</td>
        <td class="r" style="font-weight:700">${item.orderKg.toFixed(1)} กก.</td>
        <td class="r" style="color:#64748B">฿${UI.fmtMoney(item.pricePerKg)}</td>
        <td class="r" style="font-weight:700;color:#F97316">฿${UI.fmtMoney(item.cost)}</td>
      </tr>`).join('');

    // Donut chart (SVG)
    const catMap = {};
    aggregated.forEach(item => { catMap[item.category] = (catMap[item.category]||0) + item.orderKg; });
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
        <text x="90" y="94" text-anchor="middle" font-size="11" fill="#94A3B8">ไม่มีข้อมูล</text>`;
    }
    donutSvg += `</svg>`;
    const legend = catEntries.map(([cat, kg]) =>
      `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#475569;white-space:nowrap">
        <span style="width:10px;height:10px;border-radius:50%;background:${catColor(cat)};flex-shrink:0"></span>${cat}: ${kg.toFixed(2)} กก.
      </span>`
    ).join('');

    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">Batch Order</div>
      </div>
      <div class="step-bar">
        <div class="step done">1. เลือกแผน</div>
        <div class="step active">2. รวมรายการ</div>
        <div class="step">3. ยืนยันสั่งซื้อ</div>
      </div>

      <div class="grid-2" style="margin-bottom:16px; align-items: stretch">
        <div class="card" style="display:flex; flex-direction:column; justify-content:center; align-items:center; padding: 24px">
          <div style="font-size:14px; font-weight:600; color:#64748B; margin-bottom:8px">รวม ${selectedPlanIds.size} วัน</div>
          <div style="font-size:36px; font-weight:800; color:#1E293B; margin-bottom:12px">${totalCatKg.toFixed(1)} กก.</div>
          <div style="font-size:24px; font-weight:700; color:#F97316">฿${UI.fmtMoney(total)}</div>
        </div>
        <div class="card">
          <div class="card-header"><h3>สัดส่วนหมวดวัตถุดิบ (ดิบ)</h3></div>
          <div class="card-body" style="display:flex;flex-direction:column;align-items:center;gap:10px">
            ${donutSvg}
            <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${legend||'<span style="font-size:12px;color:#94A3B8">ไม่มีข้อมูล</span>'}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>รายการวัตถุดิบรวมทั้งหมด (${aggregated.length} รายการ)</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>วัตถุดิบ</th><th class="c">หมวด</th><th class="r">สั่ง(กก.)</th><th class="r">ราคา/กก.</th><th class="r">รวม(฿)</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="4" style="text-align:right">ยอดรวม</td><td style="color:#FDBA74">฿${UI.fmtMoney(total)}</td></tr></tfoot>
          </table>
        </div>
        <div style="padding:16px;border-top:1px solid #F1F5F9;display:flex;justify-content:space-between">
          <button id="btn-back2" class="btn-secondary">← ย้อนกลับ</button>
          <button id="btn-next2" class="btn-primary">ถัดไป: ตั้งค่าสต็อก →</button>
        </div>
      </div>`;

    document.getElementById('btn-back2')?.addEventListener('click',()=>{ step=1; render(container); });
    document.getElementById('btn-next2')?.addEventListener('click',()=>{ step=3; render(container); });
  }

  function renderStep3(){
    const netItems = getNetItems();
    const netTotal = netItems.reduce((a,i)=>a+i.netCost,0);

    const stockRows = aggregated.map(item=>`
      <tr>
        <td><div class="td-name">${item.name}</div><div class="td-code">${item.code}</div></td>
        <td class="r">${item.orderKg.toFixed(1)} กก.</td>
        <td class="c"><input type="number" class="inline-input stock-inp" data-id="${item.ingredientId}" min="0" step="0.1" value="${leftoverStocks[item.ingredientId]||0}" /></td>
      </tr>`).join('');

    const netRows = netItems.map(item=>`
      <tr>
        <td><div class="td-name">${item.name}</div><div class="td-code">${item.code}</div></td>
        <td class="c">${catBadgeHtml(item.category)}</td>
        <td class="r">${item.orderKg.toFixed(1)}</td>
        <td class="r" style="color:#64748B">${item.leftover.toFixed(1)}</td>
        <td class="r" style="font-weight:700">${item.netKg.toFixed(1)}</td>
        <td class="c"><span class="badge ${Calc.MOQ_BADGE[item.moqStatus]}">${Calc.MOQ_LABEL[item.moqStatus]}</span></td>
        <td class="r" style="color:#F97316;font-weight:700">฿${UI.fmtMoney(item.netCost)}</td>
      </tr>`).join('');

    container.innerHTML = `
      <div class="page-header"><div class="section-title">Batch Order</div></div>
      <div class="step-bar">
        <div class="step done">1. เลือกแผน</div>
        <div class="step done">2. รวมรายการ</div>
        <div class="step active">3. ยืนยันสั่งซื้อ</div>
      </div>

      <div class="grid-2" style="margin-bottom:20px;align-items:start">
        <div class="card">
          <div class="card-header"><h3>สต็อกคงเหลือ</h3></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>สินค้า</th><th class="r">ต้องการ</th><th class="c">สต็อกเหลือ(กก.)</th></tr></thead>
              <tbody>${stockRows}</tbody>
            </table>
          </div>
        </div>
        <div>
          <div class="card" style="margin-bottom:16px">
            <div class="card-header"><h3>หมายเหตุ (ถ้ามี)</h3></div>
            <div class="card-body">
              <input type="text" id="order-name-inp" value="${orderName}" placeholder="เช่น ระบุรายละเอียดเพิ่มเติม" />
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3>ยอดสุทธิ</h3></div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>สินค้า</th><th class="c">หมวด</th><th class="r">รวม</th><th class="r">สต็อก</th><th class="r">สั่งสุทธิ</th><th class="c">MOQ</th><th class="r">ราคา</th></tr></thead>
                <tbody>${netRows}</tbody>
                <tfoot><tr><td colspan="6" style="text-align:right">ยอดสุทธิ</td><td style="color:#FDBA74">฿${UI.fmtMoney(netTotal)}</td></tr></tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between">
        <button id="btn-back3" class="btn-secondary">← ย้อนกลับ</button>
        <button id="btn-confirm" class="btn-primary">ยืนยันสั่งซื้อ</button>
      </div>`;

    container.querySelectorAll('.stock-inp').forEach(inp=>{
      inp.addEventListener('change',e=>{
        leftoverStocks[inp.dataset.id] = parseFloat(e.target.value)||0;
        // re-render net table only
        const netItems2 = getNetItems();
        const netTotal2 = netItems2.reduce((a,i)=>a+i.netCost,0);
        container.querySelectorAll('#net-table tbody tr').forEach((tr,idx)=>{
          const it = netItems2[idx]; if(!it) return;
          tr.cells[3].textContent = it.leftover.toFixed(1);
          tr.cells[4].textContent = it.netKg.toFixed(1);
          tr.cells[5].innerHTML = `<span class="badge ${Calc.MOQ_BADGE[it.moqStatus]}">${Calc.MOQ_LABEL[it.moqStatus]}</span>`;
          tr.cells[6].textContent = '฿'+UI.fmtMoney(it.netCost);
        });
      });
    });
    document.getElementById('order-name-inp')?.addEventListener('input',e=>{ orderName=e.target.value; });
    document.getElementById('btn-back3')?.addEventListener('click',()=>{ step=2; render(container); });
    document.getElementById('btn-confirm')?.addEventListener('click', confirmOrder);
  }

  function confirmOrder(){
    const netItems = getNetItems();
    
    // Create a map to track total orderKg and netKg for proportional splitting
    const batchIngMap = {};
    aggregated.forEach(item => {
      const net = netItems.find(n => n.ingredientId === item.ingredientId);
      batchIngMap[item.ingredientId] = {
        totalOrderKg: item.orderKg || 1, // avoid div by zero
        netKg: net ? net.netKg : 0,
        pricePerKg: item.pricePerKg
      };
    });

    const allPlansRaw = DB.getPlans();

    selectedPlanIds.forEach(id => {
      let group = allPlansRaw.find(p => p.id === id);
      if (!group) return;
      const dayPlans = group.plans || [group];

      dayPlans.forEach(dayPlan => {
        const dayNetItems = (dayPlan.summary_items || []).map(dItem => {
          const bInfo = batchIngMap[dItem.ingredientId];
          let dNetKg = dItem.orderKg || 0;
          let dNetCost = dItem.cost || 0;
          let moqStatus = 'ok';

          if (bInfo) {
            const proportion = dItem.orderKg / bInfo.totalOrderKg;
            dNetKg = bInfo.netKg * proportion;
            dNetCost = Math.round(dNetKg * bInfo.pricePerKg);
            const batchNetItem = netItems.find(n => n.ingredientId === dItem.ingredientId);
            if (batchNetItem) moqStatus = batchNetItem.moqStatus;
          }

          return {
            ...dItem,
            leftover: 0,
            netKg: dNetKg,
            netCost: dNetCost,
            moqStatus: moqStatus
          };
        });

        const dayNetTotal = dayNetItems.reduce((a, i) => a + i.netCost, 0);

        const order = {
          order_name: `ออเดอร์วันที่ ${dayPlan.plan_date}` + (orderName ? ` - ${orderName}` : ''),
          target_dates: [dayPlan.plan_date],
          aggregated_items: dayPlan.summary_items || [],
          leftover_stocks: {}, 
          net_order_items: dayNetItems,
          total_recommended_cost: dayPlan.total_cost,
          total_net_cost: dayNetTotal,
          status: 'submitted',
          confirmed_at: new Date().toISOString()
        };

        DB.saveOrder(order);
        dayPlan.order_status = 'submitted';
      });
      
      group.order_status = 'submitted';
      const idx = allPlansRaw.findIndex(p => p.id === group.id);
      if (idx > -1) {
        allPlansRaw[idx] = group;
        const key = 'sp_daily_plans_' + (Auth.getSession()?.username || 'default');
        localStorage.setItem(key, JSON.stringify(allPlansRaw));
      }
    });

    UI.toast('ส่งคำสั่งซื้อรายวันเรียบร้อยแล้ว', 'success');
    step=1; selectedPlanIds=new Set(); aggregated=[]; leftoverStocks={}; orderName='';
    render(container);
  }

  function render(c){
    container = c;
    if(step===1) renderStep1();
    else if(step===2) renderStep2();
    else renderStep3();
  }

  return { render };
})();