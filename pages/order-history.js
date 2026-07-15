// SmartProcure — Order History Page

const OrderHistoryPage = (() => {
  let expandedId = null;

  function render(container){
    const orders = DB.getOrders();
    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">ประวัติคำสั่งซื้อ</div>
        <div class="section-sub">รายการ Batch Order ที่ยืนยันแล้ว</div>
      </div>
      ${!orders.length ? `
        <div class="empty-state">
          <h3>ยังไม่มีประวัติสั่งซื้อ</h3>
          <p>ยืนยัน Batch Order ในหน้า "Batch Order" เพื่อบันทึกประวัติ</p>
        </div>` : `
        <div>
          ${orders.map(order=>renderOrderCard(order)).join('')}
        </div>`}`;

    container.querySelectorAll('.order-toggle').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id=btn.dataset.id;
        expandedId = expandedId===id ? null : id;
        render(container);
      });
    });
    container.querySelectorAll('.order-delete').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(!UI.confirm('ยืนยันการลบคำสั่งซื้อนี้?')) return;
        DB.deleteOrder(btn.dataset.id);
        UI.toast('ลบเรียบร้อย');
        render(container);
      });
    });
    container.querySelectorAll('.order-submit').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(!UI.confirm('ยืนยันส่งคำสั่งซื้อนี้ให้ซัพพลายเออร์?')) return;
        const id = btn.dataset.id;
        const orders = DB.getOrders();
        const order = orders.find(o => o.id === id);
        if(order) {
          order.status = 'submitted';
          DB.saveOrder(order);
          UI.toast('ส่งคำสั่งซื้อเรียบร้อยแล้ว!', 'success');
          render(container);
        }
      });
    });
    container.querySelectorAll('.order-print').forEach(btn=>{
      btn.addEventListener('click',()=>window.print());
    });
  }

  function renderOrderCard(order){
    const isOpen = expandedId===order.id;
    const net = order.net_order_items||[];
    const total = order.total_net_cost||0;
    const STATUS = {draft:{label:'ร่าง',cls:'badge-stone'},confirmed:{label:'ยืนยันแล้ว',cls:'badge-moq-green'},submitted:{label:'ส่งแล้ว',cls:'badge-blue'}};
    const st = STATUS[order.status]||STATUS.confirmed;

    let detail = '';
    if(isOpen){
      const rows = net.map(item=>`
        <tr>
          <td><div class="td-name">${item.name}</div><div class="td-code">${item.code}</div></td>
          <td class="c">${catBadgeHtml(item.category)}</td>
          <td class="r" style="font-weight:700">${(item.netKg||0).toFixed(1)} กก.</td>
          <td class="c"><span class="badge ${Calc.MOQ_BADGE[item.moqStatus]||'badge-moq-gray'}">${Calc.MOQ_LABEL[item.moqStatus]||'-'}</span></td>
          <td class="r" style="color:#64748B">฿${UI.fmtMoney(item.pricePerKg)}</td>
          <td class="r" style="font-weight:700;color:#F97316">฿${UI.fmtMoney(item.netCost)}</td>
        </tr>`).join('');

      // Donut chart (SVG)
      const catColor = c => (typeof CAT_COLOR !== 'undefined' && CAT_COLOR[c]) ? CAT_COLOR[c] : '#94A3B8';
      const catMap = {};
      net.forEach(item => { catMap[item.category] = (catMap[item.category]||0) + (item.netKg||0); });
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

      detail = `
        <div style="border-top:1px solid #F1F5F9;padding:16px;background:#FAFAF9">
          <div class="grid-2" style="margin-bottom:16px; align-items: stretch">
            <div class="card" style="display:flex; flex-direction:column; justify-content:center; align-items:center; padding: 24px">
              <div style="font-size:14px; font-weight:600; color:#64748B; margin-bottom:8px">ยอดสั่งซื้อสุทธิ</div>
              <div style="font-size:36px; font-weight:800; color:#1E293B; margin-bottom:12px">${totalCatKg.toFixed(1)} กก.</div>
              <div style="font-size:24px; font-weight:700; color:#F97316">฿${UI.fmtMoney(total)}</div>
            </div>
            <div class="card">
              <div class="card-header"><h3>สัดส่วนหมวดวัตถุดิบ</h3></div>
              <div class="card-body" style="display:flex;flex-direction:column;align-items:center;gap:10px">
                ${donutSvg}
                <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${legend||'<span style="font-size:12px;color:#94A3B8">ไม่มีข้อมูล</span>'}</div>
              </div>
            </div>
          </div>
          <div class="table-wrap" style="border-radius:10px;border:1px solid #E2E8F0;background:#fff;overflow:hidden">
            <table>
              <thead><tr><th>สินค้า</th><th class="c">หมวด</th><th class="r">สั่งสุทธิ(กก.)</th><th class="c">MOQ</th><th class="r">ราคา/กก.</th><th class="r">รวม(฿)</th></tr></thead>
              <tbody>${rows||'<tr><td colspan="6" style="text-align:center;padding:20px;color:#94A3B8">ไม่มีข้อมูล</td></tr>'}</tbody>
              ${net.length?`<tfoot><tr><td colspan="5" style="text-align:right">ยอดสุทธิ</td><td style="color:#FDBA74">฿${UI.fmtMoney(total)}</td></tr></tfoot>`:''}
            </table>
          </div>
        </div>`;
    }

    return `
      <div class="card" style="margin-bottom:12px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#3B82F6">Order</div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="font-weight:700;color:#1E293B">${order.order_name||'(ไม่มีชื่อ)'}</span>
                <span class="badge ${st.cls}">${st.label}</span>
              </div>
              <div style="font-size:12px;color:#64748B;margin-top:2px">
                ${order.confirmed_at?new Date(order.confirmed_at).toLocaleDateString('th-TH'):'วันที่ทำรายการ: -'} &nbsp;·&nbsp; วันที่รับของ: ${order.target_dates && order.target_dates.length ? order.target_dates.join(', ') : 'ไม่ระบุ'} &nbsp;·&nbsp; ${net.length} รายการ
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="text-align:right">
              <div style="font-weight:700;color:#F97316;font-size:14px;margin-right:8px">฿${UI.fmtMoney(total)}</div>
            </div>
            ${order.status === 'confirmed' ? `<button class="btn-primary sm order-submit" data-id="${order.id}" style="background:#10B981;border-color:#10B981;padding:6px 12px;font-size:13px">ส่งซัพพลายเออร์</button>` : ''}
            <button class="btn-secondary sm order-toggle" data-id="${order.id}">${isOpen?'ซ่อน':'ดู'}</button>
            <button class="btn-secondary sm order-print" data-id="${order.id}" title="พิมพ์">พิมพ์</button>
            <button class="btn-danger order-delete" data-id="${order.id}" title="ลบ" style="font-size:13px;padding:6px 10px">ลบ</button>
          </div>
        </div>
        ${detail}
      </div>`;
  }

  return { render };
})();