// SmartProcure — Batch Order Page

const BatchOrderPage = (() => {
  let step = 1;
  let selectedPlanIds = new Set();
  let aggregated = [];
  let leftoverStocks = {};
  let orderName = '';
  let container = null;

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
      const netKg = Math.max(0, item.orderKg - leftover);
      const netCost = Math.round(netKg * item.pricePerKg);
      const moqSt = Calc.moqStatus(netKg, item.moq);
      return {...item, leftover, netKg, netCost, moqStatus:moqSt};
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

    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">Batch Order</div>
      </div>
      <div class="step-bar">
        <div class="step done">1. เลือกแผน</div>
        <div class="step active">2. รวมรายการ</div>
        <div class="step">3. ยืนยันสั่งซื้อ</div>
      </div>
      <div class="card">
        <div class="card-header"><h3>รายการวัตถุดิบรวม (${aggregated.length} รายการ)</h3></div>
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
            <div class="card-header"><h3>ชื่อคำสั่งซื้อ</h3></div>
            <div class="card-body">
              <input type="text" id="order-name-inp" value="${orderName}" placeholder="เช่น สั่งซื้อสัปดาห์ที่ 25 มิ.ย." />
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
    if(!orderName){ UI.toast('กรุณากรอกชื่อคำสั่งซื้อ','error'); return; }
    const netItems = getNetItems();
    const netTotal = netItems.reduce((a,i)=>a+i.netCost,0);
    const recTotal = aggregated.reduce((a,i)=>a+i.cost,0);
    const order = {
      order_name: orderName,
      daily_plan_ids: [...selectedPlanIds],
      aggregated_items: aggregated,
      leftover_stocks: {...leftoverStocks},
      net_order_items: netItems,
      total_recommended_cost: recTotal,
      total_net_cost: netTotal,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    };
    DB.saveOrder(order);
    UI.toast('ยืนยัน Batch Order เรียบร้อย');
    // reset
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