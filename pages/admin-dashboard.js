// SmartProcure — Admin Dashboard Page

const AdminDashboardPage = (() => {

  function render(container){
    const orders = DB.getAllAdminOrders();
    const aggregated = aggregateStock(orders);

    let summaryHtml = '';
    if(!aggregated.length) {
      summaryHtml = `<div class="empty-state"><h3>ยังไม่มีข้อมูลวัตถุดิบ</h3><p>จะแสดงข้อมูลเมื่อมีลูกค้ายืนยันคำสั่งซื้อเข้ามา</p></div>`;
    } else {
      const totalKg = aggregated.reduce((a,i)=>a+i.kg, 0);
      const rows = aggregated.map(item => `
        <tr>
          <td><div class="td-name">${item.name}</div><div class="td-code">${item.code}</div></td>
          <td class="c">${catBadgeHtml(item.category)}</td>
          <td class="r" style="font-weight:700">${item.kg.toFixed(1)} กก.</td>
        </tr>
      `).join('');

      summaryHtml = `
        <div class="card" style="margin-bottom:20px; display:flex; flex-direction:column; align-items:center; padding:30px">
          <div style="font-size:16px; color:#64748B; margin-bottom:8px">ปริมาณวัตถุดิบที่ต้องเตรียมทั้งหมด</div>
          <div style="font-size:48px; font-weight:800; color:#1E293B">${totalKg.toFixed(1)} <span style="font-size:24px">กก.</span></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>สินค้า</th><th class="c">หมวด</th><th class="r">ปริมาณรวม (กก.)</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end">
        <div>
          <div class="section-title">สรุปวัตถุดิบที่ต้องเตรียม</div>
          <div class="section-sub">ข้อมูลรวมจากออเดอร์ทั้งหมดของลูกค้าในระบบ</div>
        </div>
        <div>
          <button class="btn-secondary" onclick="window.print()">พิมพ์สรุป</button>
        </div>
      </div>
      ${summaryHtml}
    `;
  }

  function aggregateStock(orders) {
    const stockMap = {};
    orders.forEach(order => {
      if(!order.net_order_items) return;
      order.net_order_items.forEach(item => {
        const id = item.ingredientId;
        if(!stockMap[id]) {
          stockMap[id] = { id, name:item.name, code:item.code, category:item.category, kg:0 };
        }
        stockMap[id].kg += (item.netKg || 0);
      });
    });
    return Object.values(stockMap).sort((a,b) => b.kg - a.kg);
  }

  return { render };
})();
