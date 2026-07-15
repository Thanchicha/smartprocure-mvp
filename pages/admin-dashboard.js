// SmartProcure — Admin Dashboard Page

const AdminDashboardPage = (() => {

  let expandedItemId = null;
  let currentContainer = null;
  window.toggleDashboardItem = function(id) {
    expandedItemId = expandedItemId === id ? null : id;
    if (currentContainer) render(currentContainer);
  };

  function render(container){
    currentContainer = container;
    const orders = DB.getAllAdminOrders();
    const aggregated = aggregateStock(orders);

    let summaryHtml = '';
    if(!aggregated.length) {
      summaryHtml = `<div class="empty-state"><h3>ยังไม่มีข้อมูลวัตถุดิบ</h3><p>จะแสดงข้อมูลเมื่อมีลูกค้ายืนยันคำสั่งซื้อเข้ามา</p></div>`;
    } else {
      const totalKg = aggregated.reduce((a,i)=>a+i.kg, 0);
      const totalOrders = orders.length;
      const totalHotels = new Set(orders.map(o => o._tenant)).size;
      const totalValue = orders.reduce((a, o) => a + (o.total_net_cost || 0), 0);
      
      const grouped = {};
      aggregated.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
      });

      let rows = '';
      Object.keys(grouped).sort().forEach(cat => {
        const subtotal = grouped[cat].reduce((a, i) => a + i.kg, 0);
        rows += `
          <tr style="background: #F8FAFC; border-bottom: 2px solid #E2E8F0;">
            <td colspan="2" style="padding: 14px 16px;">
              <div style="display:flex; align-items:center; gap:10px;">
                ${catBadgeHtml(cat)} 
                <span style="font-weight:700; color:#334155; font-size:14px;">หมวด: ${cat}</span>
              </div>
            </td>
            <td class="r" style="padding: 14px 16px; font-weight:800; color:#1E293B;">
              ยอดรวม ${subtotal.toFixed(1)} กก.
            </td>
          </tr>
        `;
        grouped[cat].sort((a,b)=>b.kg-a.kg).forEach(item => {
          const isExpanded = expandedItemId === item.id;
          rows += `
            <tr style="cursor:pointer; background: ${isExpanded ? '#F1F5F9' : 'transparent'};" onclick="toggleDashboardItem('${item.id}')" class="hover-row">
              <td style="padding-left: 24px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:10px;color:#94A3B8;">${isExpanded ? '▼' : '▶'}</span>
                  <div>
                    <div class="td-name" style="text-decoration:underline;text-decoration-style:dotted;text-underline-offset:4px;">${item.name}</div>
                    <div class="td-code">${item.code}</div>
                  </div>
                </div>
              </td>
              <td class="c"></td>
              <td class="r" style="font-weight:600; color:#64748B;">${item.kg.toFixed(1)} กก.</td>
            </tr>
          `;
          
          if(isExpanded) {
            const hotelEntries = Object.values(item.ordersByHotel).sort((a,b)=>b.kg - a.kg);
            const hotelRows = hotelEntries.map(h => `
              <tr>
                <td style="padding-left:48px; font-size:13px; color:#475569;">${h.name}</td>
                <td></td>
                <td class="r" style="font-size:13px; color:#64748B;">${h.kg.toFixed(1)} กก.</td>
              </tr>
            `).join('');
            
            rows += `
              <tr style="background:#FAFAF9;">
                <td colspan="3" style="padding:0;">
                  <table style="width:100%; border:none; background:transparent;">
                    ${hotelRows}
                  </table>
                </td>
              </tr>
            `;
          }
        });
      });

      // Donut chart logic
      const catMap = {};
      aggregated.forEach(item => { catMap[item.category] = (catMap[item.category]||0) + item.kg; });
      const catEntries = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
      const catColor = c => (typeof CAT_COLOR !== 'undefined' && CAT_COLOR[c]) ? CAT_COLOR[c] : '#94A3B8';
      let donutSvg = `<svg width="200" height="200" viewBox="0 0 200 200">`;
      if(catEntries.length > 0){
        let angle = -90;
        catEntries.forEach(([cat, kg]) => {
          const pct = kg / totalKg;
          const deg = pct * 360;
          const r = 80, cx = 100, cy = 100, ri = 48;
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
          donutSvg += `<path d="M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi2.toFixed(2)},${yi2.toFixed(2)} A${ri},${ri} 0 ${large},0 ${xi1.toFixed(2)},${yi1.toFixed(2)} Z" fill="${catColor(cat)}" opacity="0.9"/>`;
          angle += deg;
        });
        donutSvg += `<circle cx="100" cy="100" r="44" fill="white"/>
          <text x="100" y="96" text-anchor="middle" font-size="14" font-weight="700" fill="#1E293B">${totalKg.toFixed(1)}</text>
          <text x="100" y="114" text-anchor="middle" font-size="11" fill="#64748B">กก. รวม</text>`;
      }
      donutSvg += `</svg>`;

      const legendHtml = catEntries.map(([cat, kg]) =>
        `<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#475569;">
          <div style="width:12px;height:12px;border-radius:4px;background:${catColor(cat)};flex-shrink:0"></div>
          <div style="flex:1">${cat}</div>
          <div style="font-weight:600">${kg.toFixed(1)} กก.</div>
        </div>`
      ).join('');

      // Top 5 items logic
      const top5 = aggregated.slice(0, 5);
      const maxTop5Kg = top5.length ? top5[0].kg : 1;
      const top5Html = top5.map(item => {
        const pct = (item.kg / maxTop5Kg) * 100;
        return `
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <span style="font-weight:600;color:#1E293B">${item.name}</span>
              <span style="color:#64748B">${item.kg.toFixed(1)} กก.</span>
            </div>
            <div style="height:8px;border-radius:4px;background:#F1F5F9;overflow:hidden">
              <div style="height:100%;background:#3B82F6;width:${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');

      summaryHtml = `
        <div class="grid-4" style="margin-bottom:20px; gap:16px;">
          <div class="card" style="padding:20px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
            <div style="font-size:13px; color:#64748B; margin-bottom:4px">ยอดสั่งซื้อรวม (ออเดอร์)</div>
            <div style="font-size:32px; font-weight:800; color:#3B82F6">${totalOrders}</div>
          </div>
          <div class="card" style="padding:20px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
            <div style="font-size:13px; color:#64748B; margin-bottom:4px">จำนวนโรงแรม (ที่สั่งมา)</div>
            <div style="font-size:32px; font-weight:800; color:#F59E0B">${totalHotels}</div>
          </div>
          <div class="card" style="padding:20px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
            <div style="font-size:13px; color:#64748B; margin-bottom:4px">ปริมาณวัตถุดิบที่ต้องเตรียมทั้งหมด</div>
            <div style="font-size:32px; font-weight:800; color:#10B981">${totalKg.toFixed(1)} <span style="font-size:16px">กก.</span></div>
          </div>
          <div class="card" style="padding:20px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
            <div style="font-size:13px; color:#64748B; margin-bottom:4px">มูลค่าสั่งซื้อรวม</div>
            <div style="font-size:32px; font-weight:800; color:#F97316"><span style="font-size:16px">฿</span>${UI.fmtMoney(totalValue)}</div>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom:20px; gap:16px; align-items: stretch;">
          <div class="card" style="display:flex; padding:20px;">
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
              <h3 style="margin-top:0; font-size:14px; color:#1E293B; margin-bottom:16px; text-align:center;">สัดส่วนตามหมวดหมู่</h3>
              ${donutSvg}
            </div>
            <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:8px; border-left:1px solid #F1F5F9; padding-left:20px;">
              ${legendHtml}
            </div>
          </div>
          <div class="card" style="padding:20px;">
            <h3 style="margin-top:0; font-size:14px; color:#1E293B; margin-bottom:16px;">Top 5 วัตถุดิบที่ใช้เยอะที่สุด</h3>
            ${top5Html || '<div style="color:#94A3B8;font-size:13px;">ไม่มีข้อมูล</div>'}
          </div>
        </div>

        <div class="table-wrap card">
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
          <div class="section-sub">แดชบอร์ดสรุปยอดรวมจากออเดอร์ทั้งหมดของลูกค้าในระบบ</div>
        </div>
        <div>
          <button class="btn-secondary" onclick="window.print()">พิมพ์สรุป</button>
        </div>
      </div>
      ${summaryHtml}
    `;
  }

  function getHotelProfile(tenant) {
    try {
      const p = JSON.parse(localStorage.getItem(`sp_profile_${tenant}`)||'{}');
      p._tenant = tenant;
      return p;
    } catch(e) { return { _tenant: tenant }; }
  }

  function aggregateStock(orders) {
    const stockMap = {};
    orders.forEach(order => {
      const hotelProfile = getHotelProfile(order._tenant);
      const hotelName = hotelProfile.businessName || order._tenant;
      if(!order.net_order_items) return;
      order.net_order_items.forEach(item => {
        const id = item.ingredientId || item.code || item.name;
        if(!stockMap[id]) {
          stockMap[id] = { id, name:item.name, code:item.code, category:item.category, kg:0, ordersByHotel:{} };
        }
        stockMap[id].kg += (item.netKg || 0);
        if(!stockMap[id].ordersByHotel[order._tenant]) {
          stockMap[id].ordersByHotel[order._tenant] = { name: hotelName, kg: 0 };
        }
        stockMap[id].ordersByHotel[order._tenant].kg += (item.netKg || 0);
      });
    });
    return Object.values(stockMap).sort((a,b) => b.kg - a.kg);
  }

  return { render };
})();
