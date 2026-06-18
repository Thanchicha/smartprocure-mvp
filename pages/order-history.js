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
      detail = `
        <div style="border-top:1px solid #F1F5F9;padding:16px">
          <div class="table-wrap" style="border-radius:10px;border:1px solid #F1F5F9;overflow:hidden">
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
                ${order.confirmed_at?new Date(order.confirmed_at).toLocaleDateString('th-TH'):''} &nbsp;·&nbsp; ${net.length} รายการ
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="text-align:right">
              <div style="font-weight:700;color:#F97316;font-size:14px">฿${UI.fmtMoney(total)}</div>
            </div>
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