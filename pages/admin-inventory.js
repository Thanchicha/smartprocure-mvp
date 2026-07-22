// SmartProcure — Admin Inventory Page (คลังสินค้าปัจจุบัน)
// แสดงวัตถุดิบจากออเดอร์ที่สั่งซัพพลายเออร์แล้ว (status = 'ordered') รอจัดส่งลูกค้า

const AdminInventoryPage = (() => {
  let expandedItemId = null;
  let currentContainer = null;

  window.toggleInventoryItem = function(id) {
    expandedItemId = expandedItemId === id ? null : id;
    if (currentContainer) render(currentContainer);
  };

  function render(container) {
    currentContainer = container;
    const orders = DB.getAllAdminOrders().filter(o => o.status === 'ordered');
    const aggregated = aggregateItems(orders);

    const totalKg = aggregated.reduce((a,i) => a+i.kg, 0);
    const totalOrders = orders.length;
    const totalHotels = new Set(orders.map(o => o._tenant)).size;
    const totalValue = orders.reduce((a,o) => a + (o.total_net_cost||0), 0);

    let bodyHtml = '';

    if (!aggregated.length) {
      bodyHtml = `
        <div class="empty-state">
          <div style="font-size:48px;margin-bottom:16px">📦</div>
          <h3>คลังสินค้าว่างเปล่า</h3>
          <p>จะมีวัตถุดิบปรากฏที่นี่เมื่อคุณกดปุ่ม "สั่งวัตถุดิบแล้ว" ในหน้าออเดอร์ทั้งหมด</p>
        </div>`;
    } else {
      // Category donut
      const catColor = c => (typeof CAT_COLOR !== 'undefined' && CAT_COLOR[c]) ? CAT_COLOR[c] : '#94A3B8';
      const catMap = {};
      aggregated.forEach(item => { catMap[item.category] = (catMap[item.category]||0) + item.kg; });
      const catEntries = Object.entries(catMap).sort((a,b) => b[1]-a[1]);

      let donutSvg = `<svg width="200" height="200" viewBox="0 0 200 200">`;
      if (catEntries.length > 0) {
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

      // Top 5
      const top5 = aggregated.slice(0, 5);
      const maxKg = top5.length ? top5[0].kg : 1;
      const top5Html = top5.map(item => {
        const pct = (item.kg / maxKg) * 100;
        return `
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <span style="font-weight:600;color:#1E293B">${item.name}</span>
              <span style="color:#64748B">${item.kg.toFixed(1)} กก.</span>
            </div>
            <div style="height:8px;border-radius:4px;background:#F1F5F9;overflow:hidden">
              <div style="height:100%;background:#8B5CF6;width:${pct}%"></div>
            </div>
          </div>`;
      }).join('');

      // Table grouped by category
      const grouped = {};
      aggregated.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
      });

      let rows = '';
      Object.keys(grouped).sort().forEach(cat => {
        const subtotal = grouped[cat].reduce((a,i) => a+i.kg, 0);
        rows += `
          <tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0;">
            <td colspan="2" style="padding:14px 16px;">
              <div style="display:flex;align-items:center;gap:10px;">
                ${catBadgeHtml(cat)}
                <span style="font-weight:700;color:#334155;font-size:14px;">หมวด: ${cat}</span>
              </div>
            </td>
            <td class="r" style="padding:14px 16px;font-weight:800;color:#1E293B;">
              ${subtotal.toFixed(1)} กก.
            </td>
          </tr>`;
        grouped[cat].sort((a,b) => b.kg-a.kg).forEach(item => {
          const isExp = expandedItemId === item.id;
          rows += `
            <tr style="cursor:pointer;background:${isExp?'#F5F3FF':'transparent'};" onclick="toggleInventoryItem('${item.id}')" class="hover-row">
              <td style="padding-left:24px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:10px;color:#94A3B8;">${isExp?'▼':'▶'}</span>
                  <div>
                    <div class="td-name" style="text-decoration:underline;text-decoration-style:dotted;text-underline-offset:4px;">${item.name}</div>
                    <div class="td-code">${item.code}</div>
                  </div>
                </div>
              </td>
              <td class="c"></td>
              <td class="r" style="font-weight:600;color:#8B5CF6;">${item.kg.toFixed(1)} กก.</td>
            </tr>`;
          if (isExp) {
            const hotelRows = Object.values(item.ordersByHotel).sort((a,b)=>b.kg-a.kg).map(h => `
              <tr>
                <td style="padding-left:48px;font-size:13px;color:#475569;">${h.name}</td>
                <td></td>
                <td class="r" style="font-size:13px;color:#64748B;">${h.kg.toFixed(1)} กก.</td>
              </tr>`).join('');
            rows += `
              <tr style="background:#FAF5FF;">
                <td colspan="3" style="padding:0;">
                  <table style="width:100%;border:none;background:transparent;">${hotelRows}</table>
                </td>
              </tr>`;
          }
        });
      });

      bodyHtml = `
        <div class="grid-4" style="margin-bottom:20px;gap:16px;">
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:13px;color:#64748B;margin-bottom:4px">ออเดอร์ในคลัง</div>
            <div style="font-size:32px;font-weight:800;color:#8B5CF6">${totalOrders}</div>
          </div>
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:13px;color:#64748B;margin-bottom:4px">จำนวนโรงแรม</div>
            <div style="font-size:32px;font-weight:800;color:#F59E0B">${totalHotels}</div>
          </div>
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:13px;color:#64748B;margin-bottom:4px">ปริมาณในคลังรวม</div>
            <div style="font-size:32px;font-weight:800;color:#10B981">${totalKg.toFixed(1)} <span style="font-size:16px">กก.</span></div>
          </div>
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:13px;color:#64748B;margin-bottom:4px">มูลค่าในคลัง</div>
            <div style="font-size:32px;font-weight:800;color:#F97316"><span style="font-size:16px">฿</span>${UI.fmtMoney(totalValue)}</div>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom:20px;gap:16px;align-items:stretch;">
          <div class="card" style="display:flex;padding:20px;">
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
              <h3 style="margin-top:0;font-size:14px;color:#1E293B;margin-bottom:16px;text-align:center;">สัดส่วนตามหมวดหมู่</h3>
              ${donutSvg}
            </div>
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:8px;border-left:1px solid #F1F5F9;padding-left:20px;">
              ${legendHtml}
            </div>
          </div>
          <div class="card" style="padding:20px;">
            <h3 style="margin-top:0;font-size:14px;color:#1E293B;margin-bottom:16px;">Top 5 วัตถุดิบในคลัง</h3>
            ${top5Html || '<div style="color:#94A3B8;font-size:13px;">ไม่มีข้อมูล</div>'}
          </div>
        </div>

        <div class="table-wrap card">
          <table>
            <thead><tr><th>วัตถุดิบ</th><th class="c">หมวด</th><th class="r">ปริมาณในคลัง (กก.)</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }

    container.innerHTML = `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-end">
        <div>
          <div class="section-title">📦 คลังสินค้าปัจจุบัน</div>
          <div class="section-sub">วัตถุดิบที่สั่งซื้อจากซัพพลายเออร์แล้ว รอจัดส่งให้ลูกค้า</div>
        </div>
        <div>
          <button class="btn-secondary" onclick="window.print()">พิมพ์สรุป</button>
        </div>
      </div>
      ${bodyHtml}`;
  }

  function aggregateItems(orders) {
    const map = {};
    orders.forEach(order => {
      const profile = JSON.parse(localStorage.getItem(`sp_profile_${order._tenant}`) || '{}');
      const hotelName = profile.businessName || order._tenant;
      if (!order.net_order_items) return;
      order.net_order_items.forEach(item => {
        const id = item.ingredientId || item.code || item.name;
        if (!map[id]) {
          map[id] = { id, name: item.name, code: item.code, category: item.category, kg: 0, ordersByHotel: {} };
        }
        map[id].kg += (item.netKg || 0);
        if (!map[id].ordersByHotel[order._tenant]) {
          map[id].ordersByHotel[order._tenant] = { name: hotelName, kg: 0 };
        }
        map[id].ordersByHotel[order._tenant].kg += (item.netKg || 0);
      });
    });
    return Object.values(map).sort((a,b) => b.kg - a.kg);
  }

  return { render };
})();
