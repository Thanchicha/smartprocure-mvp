// SmartProcure — Customer Dashboard (สรุปการสั่งซื้อ)

const CustomerDashboardPage = (() => {

  let expandedItemId = null;
  let currentContainer = null;
  let filterFrom = '';
  let filterTo = '';

  window.toggleCustDashboardItem = function(id) {
    expandedItemId = expandedItemId === id ? null : id;
    if (currentContainer) render(currentContainer);
  };

  function render(container) {
    currentContainer = container;

    // All orders for this customer that are submitted or beyond
    const allOrders = DB.getOrders().filter(o => o.status === 'submitted' || o.status === 'ordered' || o.status === 'delivered');

    // Date range filter logic
    const filteredOrders = allOrders.filter(order => {
      if (!filterFrom && !filterTo) return true;
      const dates = (order.target_dates && order.target_dates.length) ? order.target_dates : [];
      if (!dates.length) return true; 
      return dates.some(d => {
        if (filterFrom && d < filterFrom) return false;
        if (filterTo   && d > filterTo)   return false;
        return true;
      });
    });

    const hasFilter = !!(filterFrom || filterTo);
    const aggregated = aggregateStock(filteredOrders);

    const formatDateDisplay = (ds) => {
      if (!ds) return '';
      try {
        const d = new Date(ds);
        const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()+543}`;
      } catch(e) { return ds; }
    };

    const rangeLabel = hasFilter
      ? `📅 ${filterFrom ? formatDateDisplay(filterFrom) : 'ทุกวัน'} → ${filterTo ? formatDateDisplay(filterTo) : 'ทุกวัน'}`
      : '📅 แสดงทุกช่วงเวลา';

    // ---------- Stats ----------
    const totalKg     = aggregated.reduce((a, i) => a + i.kg, 0);
    const totalOrders = filteredOrders.length;
    const totalValue  = filteredOrders.reduce((a, o) => a + (o.total_net_cost || 0), 0);

    // ---------- Group by category ----------
    const grouped = {};
    aggregated.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    let rows = '';
    Object.keys(grouped).sort().forEach(cat => {
      const subtotal = grouped[cat].reduce((a, i) => a + i.kg, 0);
      rows += `
        <tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0;">
          <td style="padding:14px 16px;">
            <div style="display:flex;align-items:center;gap:10px;">
              ${catBadgeHtml(cat)}
              <span style="font-weight:700;color:#334155;font-size:14px;">หมวด: ${cat}</span>
            </div>
          </td>
          <td class="r" style="padding:14px 16px;font-weight:800;color:#1E293B;">ยอดรวม ${subtotal.toFixed(1)} กก.</td>
        </tr>`;
      grouped[cat].sort((a, b) => b.kg - a.kg).forEach(item => {
        rows += `
          <tr style="background:transparent;border-bottom:1px dashed #E2E8F0;" class="hover-row">
            <td style="padding-left:24px;padding-top:12px;padding-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div>
                  <div class="td-name" style="font-weight:600">${item.name}</div>
                  <div class="td-code">${item.code}</div>
                </div>
              </div>
            </td>
            <td class="r" style="font-weight:600;color:#64748B;">${item.kg.toFixed(1)} กก.</td>
          </tr>`;
      });
    });

    // ---------- Donut ----------
    const catMap = {};
    aggregated.forEach(item => { catMap[item.category] = (catMap[item.category]||0) + item.kg; });
    const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const catColor = c => (typeof CAT_COLOR !== 'undefined' && CAT_COLOR[c]) ? CAT_COLOR[c] : '#94A3B8';
    let donutSvg = `<svg width="200" height="200" viewBox="0 0 200 200">`;
    if (catEntries.length && totalKg > 0) {
      let angle = -90;
      catEntries.forEach(([cat, kg]) => {
        const deg = (kg / totalKg) * 360;
        const r = 80, cx = 100, cy = 100, ri = 48;
        const toRad = d => d * Math.PI / 180;
        const x1 = cx + r*Math.cos(toRad(angle)), y1 = cy + r*Math.sin(toRad(angle));
        const x2 = cx + r*Math.cos(toRad(angle+deg)), y2 = cy + r*Math.sin(toRad(angle+deg));
        const xi1 = cx + ri*Math.cos(toRad(angle)), yi1 = cy + ri*Math.sin(toRad(angle));
        const xi2 = cx + ri*Math.cos(toRad(angle+deg)), yi2 = cy + ri*Math.sin(toRad(angle+deg));
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

    // ---------- Top 5 ----------
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
            <div style="height:100%;background:#3B82F6;width:${pct}%;transition:width .4s"></div>
          </div>
        </div>`;
    }).join('');

    const summaryHtml = !aggregated.length
      ? `<div class="empty-state"><h3>ยังไม่มีข้อมูลสั่งซื้อ</h3><p>ระบบจะแสดงสรุปเมื่อคุณส่งออเดอร์ให้ซัพพลายเออร์แล้ว</p></div>`
      : `
        <!-- Stats -->
        <div class="grid-4" style="margin-bottom:20px;gap:16px;">
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:13px;color:#64748B;margin-bottom:4px">ออเดอร์ที่ส่งแล้ว</div>
            <div style="font-size:32px;font-weight:800;color:#3B82F6">${totalOrders} <span style="font-size:16px">วัน</span></div>
          </div>
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:13px;color:#64748B;margin-bottom:4px">มูลค่าสั่งซื้อรวม</div>
            <div style="font-size:32px;font-weight:800;color:#F97316"><span style="font-size:16px">฿</span>${UI.fmtMoney(totalValue)}</div>
          </div>
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:13px;color:#64748B;margin-bottom:4px">ปริมาณวัตถุดิบทั้งหมด</div>
            <div style="font-size:32px;font-weight:800;color:#10B981">${totalKg.toFixed(1)} <span style="font-size:16px">กก.</span></div>
          </div>
        </div>

        <!-- Charts -->
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
            <h3 style="margin-top:0;font-size:14px;color:#1E293B;margin-bottom:16px;">Top 5 วัตถุดิบที่ใช้เยอะที่สุด</h3>
            ${top5Html || '<div style="color:#94A3B8;font-size:13px;">ไม่มีข้อมูล</div>'}
          </div>
        </div>

        <!-- Table -->
        <div class="card">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <h3>สรุปยอดสั่งซื้อแยกตามสินค้า (${aggregated.length} รายการ)</h3>
            <div style="display:flex;gap:8px">
              <button id="btn-export-excel" class="btn-secondary sm" style="font-size:12px;color:#10B981;border-color:#10B981;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;vertical-align:middle"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Export Excel
              </button>
              <button id="btn-print" class="btn-secondary sm" style="font-size:12px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;vertical-align:middle"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x x="6" y="14" width="12" height="8"></rect></svg>
                พิมพ์รายงาน
              </button>
            </div>
          </div>
          <div class="table-wrap">
            <table style="border-collapse:collapse;width:100%">
              <thead>
                <tr>
                  <th style="padding:12px 16px;">สินค้า</th>
                  <th class="r" style="padding:12px 16px;">ปริมาณสั่งซื้อสุทธิ (กก.)</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;

    container.innerHTML = `
      <div class="page-header" style="margin-bottom:16px;">
        <div class="section-title">สรุปการสั่งซื้อ</div>
        <div class="section-sub">ภาพรวมวัตถุดิบทั้งหมดที่คุณสั่งซื้อไปแล้ว</div>
      </div>

      <!-- Filter Bar -->
      <div class="card" style="margin-bottom:20px;padding:16px;background:#F8FAFC;border:1px solid #E2E8F0;">
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
          <div style="font-weight:600;color:#475569;font-size:14px;margin-right:8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            กรองตามวันที่รับของ:
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <input type="date" id="cust-dash-from" class="inline-input" value="${filterFrom}" style="padding:6px 10px;font-size:13px;border:1px solid #CBD5E1;border-radius:6px;width:130px;background:#fff;" />
            <span style="color:#94A3B8;font-size:13px;">ถึง</span>
            <input type="date" id="cust-dash-to" class="inline-input" value="${filterTo}" style="padding:6px 10px;font-size:13px;border:1px solid #CBD5E1;border-radius:6px;width:130px;background:#fff;" />
          </div>
          <div style="display:flex;gap:8px;margin-left:auto;">
            <button id="cust-dash-filter-btn" class="btn-primary" style="padding:6px 16px;font-size:13px;">ตกลง</button>
            <button id="cust-dash-clear-btn" class="btn-secondary" style="padding:6px 16px;font-size:13px;">ล้าง</button>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom:12px;font-weight:600;color:#334155;font-size:15px;display:flex;align-items:center;gap:8px;">
        <span style="width:8px;height:8px;border-radius:50%;background:#3B82F6;display:inline-block;"></span>
        ${rangeLabel}
      </div>

      ${summaryHtml}
    `;

    // Filter events
    const el = container;
    el.querySelector('#cust-dash-filter-btn').addEventListener('click', () => {
      filterFrom = el.querySelector('#cust-dash-from').value;
      filterTo = el.querySelector('#cust-dash-to').value;
      render(container);
    });
    el.querySelector('#cust-dash-clear-btn').addEventListener('click', () => {
      filterFrom = '';
      filterTo = '';
      render(container);
    });

    if (aggregated.length) {
      const today = new Date().toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' });
      
      const printContent = `
        <div style="font-family:'Sarabun',sans-serif;padding:30px;color:#333;">
          <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #eee;padding-bottom:20px;">
            <h1 style="margin:0;font-size:24px;color:#1E3A8A;">สรุปการสั่งซื้อวัตถุดิบ</h1>
            <p style="margin:8px 0 0 0;font-size:16px;color:#555;">${rangeLabel}</p>
            <p style="margin:4px 0 0 0;font-size:14px;color:#888;">วันที่พิมพ์: ${today}</p>
          </div>
          
          <div style="display:flex;gap:20px;margin-bottom:30px;">
            <div style="flex:1;background:#F8FAFC;padding:15px;border-radius:8px;border:1px solid #E2E8F0;text-align:center;">
              <div style="font-size:12px;color:#64748B;">จำนวนสั่งซื้อ</div>
              <div style="font-size:20px;font-weight:bold;color:#3B82F6;">${totalOrders} วัน</div>
            </div>
            <div style="flex:1;background:#F8FAFC;padding:15px;border-radius:8px;border:1px solid #E2E8F0;text-align:center;">
              <div style="font-size:12px;color:#64748B;">ปริมาณรวม</div>
              <div style="font-size:20px;font-weight:bold;color:#10B981;">${totalKg.toFixed(1)} กก.</div>
            </div>
            <div style="flex:1;background:#F8FAFC;padding:15px;border-radius:8px;border:1px solid #E2E8F0;text-align:center;">
              <div style="font-size:12px;color:#64748B;">มูลค่ารวม</div>
              <div style="font-size:20px;font-weight:bold;color:#F97316;">฿${UI.fmtMoney(totalValue)}</div>
            </div>
          </div>
          
          <h3 style="font-size:16px;margin-bottom:12px;border-bottom:1px solid #eee;padding-bottom:8px;">รายการวัตถุดิบที่สั่งซื้อ</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#F1F5F9;">
                <th style="padding:10px;text-align:left;border:1px solid #CBD5E1;">รหัสสินค้า</th>
                <th style="padding:10px;text-align:left;border:1px solid #CBD5E1;">ชื่อสินค้า</th>
                <th style="padding:10px;text-align:left;border:1px solid #CBD5E1;">หมวดหมู่</th>
                <th style="padding:10px;text-align:right;border:1px solid #CBD5E1;">ปริมาณสุทธิ (กก.)</th>
              </tr>
            </thead>
            <tbody>
              ${aggregated.map(item => `
                <tr>
                  <td style="padding:8px 10px;border:1px solid #E2E8F0;color:#64748B;">${item.code}</td>
                  <td style="padding:8px 10px;border:1px solid #E2E8F0;font-weight:600;">${item.name}</td>
                  <td style="padding:8px 10px;border:1px solid #E2E8F0;">${item.category}</td>
                  <td style="padding:8px 10px;border:1px solid #E2E8F0;text-align:right;font-weight:600;color:#3B82F6;">${item.kg.toFixed(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Print
      el.querySelector('#btn-print').addEventListener('click', () => {
        const w = window.open('','_blank','width=800,height=900');
        w.document.write(`<!DOCTYPE html><html><head>
          <meta charset="utf-8">
          <title>สรุปการสั่งซื้อ — ${rangeLabel}</title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>body{margin:0;background:#fff;} @media print{body{-webkit-print-color-adjust:exact;}}</style>
        </head><body>${printContent}
          <script>
            window.onload = () => { setTimeout(() => { window.print(); }, 300); };
          </script>
        </body></html>`);
        w.document.close();
      });

      // Excel
      el.querySelector('#btn-export-excel').addEventListener('click', () => {
        try {
          const wsData = [
            ['สรุปการสั่งซื้อวัตถุดิบ (SmartProcure)'],
            ['ช่วงเวลา', rangeLabel],
            ['สร้างวันที่', today],
            [''],
            ['หมวดหมู่', 'รหัสสินค้า', 'ชื่อสินค้า', 'ปริมาณ (กก.)']
          ];
          aggregated.forEach(item => {
            wsData.push([item.category, item.code, item.name, item.kg]);
          });
          wsData.push(['', '', 'ยอดรวมทั้งหมด', totalKg]);

          const ws = XLSX.utils.aoa_to_sheet(wsData);
          
          // Style cols
          ws['!cols'] = [{wch: 15}, {wch: 15}, {wch: 35}, {wch: 15}];
          
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Summary");
          
          const fn = `Order_Summary_${filterFrom||'ALL'}_to_${filterTo||'ALL'}.xlsx`;
          XLSX.writeFile(wb, fn);
          UI.toast('ดาวน์โหลดไฟล์ Excel เรียบร้อย', 'success');
        } catch(e) {
          console.error(e);
          UI.toast('เกิดข้อผิดพลาดในการสร้าง Excel (XLSX library missing?)', 'error');
        }
      });
    }
  }

  function aggregateStock(orders) {
    const stockMap = {};
    orders.forEach(order => {
      if (!order.net_order_items) return;
      order.net_order_items.forEach(item => {
        const id = item.ingredientId || item.code || item.name;
        if (!stockMap[id]) {
          stockMap[id] = { id, name: item.name, code: item.code, category: item.category, kg: 0 };
        }
        stockMap[id].kg += (item.netKg || item.orderKg || 0);
      });
    });
    return Object.values(stockMap).sort((a, b) => b.kg - a.kg);
  }

  return { render };
})();
