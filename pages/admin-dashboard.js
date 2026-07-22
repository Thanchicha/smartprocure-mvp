// SmartProcure — Admin Dashboard (สรุปวัตถุดิบที่ต้องเตรียม)

const AdminDashboardPage = (() => {

  let expandedItemId = null;
  let currentContainer = null;
  let filterFrom = '';
  let filterTo = '';

  window.toggleDashboardItem = function(id) {
    expandedItemId = expandedItemId === id ? null : id;
    if (currentContainer) render(currentContainer);
  };

  function render(container) {
    currentContainer = container;

    // All submitted orders
    const allOrders = DB.getAllAdminOrders().filter(o => o.status === 'submitted');

    // Date range filter logic:
    // An order is included if ANY of its target_dates falls within [filterFrom, filterTo]
    const filteredOrders = allOrders.filter(order => {
      if (!filterFrom && !filterTo) return true;
      const dates = (order.target_dates && order.target_dates.length) ? order.target_dates : [];
      if (!dates.length) return true; // keep orders with no date
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
    const totalHotels = new Set(filteredOrders.map(o => o._tenant)).size;
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
          <td colspan="2" style="padding:14px 16px;">
            <div style="display:flex;align-items:center;gap:10px;">
              ${catBadgeHtml(cat)}
              <span style="font-weight:700;color:#334155;font-size:14px;">หมวด: ${cat}</span>
            </div>
          </td>
          <td class="r" style="padding:14px 16px;font-weight:800;color:#1E293B;">ยอดรวม ${subtotal.toFixed(1)} กก.</td>
        </tr>`;
      grouped[cat].sort((a, b) => b.kg - a.kg).forEach(item => {
        const isExpanded = expandedItemId === item.id;
        rows += `
          <tr style="cursor:pointer;background:${isExpanded?'#F1F5F9':'transparent'};"
              onclick="toggleDashboardItem('${item.id}')" class="hover-row">
            <td style="padding-left:24px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:10px;color:#94A3B8;">${isExpanded?'▼':'▶'}</span>
                <div>
                  <div class="td-name" style="text-decoration:underline;text-decoration-style:dotted;text-underline-offset:4px;">${item.name}</div>
                  <div class="td-code">${item.code}</div>
                </div>
              </div>
            </td>
            <td class="c"></td>
            <td class="r" style="font-weight:600;color:#64748B;">${item.kg.toFixed(1)} กก.</td>
          </tr>`;
        if (isExpanded) {
          const hotelEntries = Object.values(item.ordersByHotel).sort((a, b) => b.kg - a.kg);
          rows += `
            <tr style="background:#FAFAF9;">
              <td colspan="3" style="padding:0;">
                <table style="width:100%;border:none;background:transparent;">
                  ${hotelEntries.map(h => `
                    <tr>
                      <td style="padding-left:48px;font-size:13px;color:#475569;">${h.name}</td>
                      <td></td>
                      <td class="r" style="font-size:13px;color:#64748B;">${h.kg.toFixed(1)} กก.</td>
                    </tr>`).join('')}
                </table>
              </td>
            </tr>`;
        }
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
      ? `<div class="empty-state"><h3>ยังไม่มีข้อมูลวัตถุดิบ</h3><p>จะแสดงข้อมูลเมื่อมีลูกค้ายืนยันคำสั่งซื้อเข้ามา</p></div>`
      : `
        <!-- Stats -->
        <div class="grid-4" style="margin-bottom:20px;gap:16px;">
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:13px;color:#64748B;margin-bottom:4px">ยอดสั่งซื้อรวม (ออเดอร์)</div>
            <div style="font-size:32px;font-weight:800;color:#3B82F6">${totalOrders}</div>
          </div>
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:13px;color:#64748B;margin-bottom:4px">จำนวนโรงแรม (ที่สั่งมา)</div>
            <div style="font-size:32px;font-weight:800;color:#F59E0B">${totalHotels}</div>
          </div>
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:13px;color:#64748B;margin-bottom:4px">ปริมาณวัตถุดิบทั้งหมด</div>
            <div style="font-size:32px;font-weight:800;color:#10B981">${totalKg.toFixed(1)} <span style="font-size:16px">กก.</span></div>
          </div>
          <div class="card" style="padding:20px;text-align:center;">
            <div style="font-size:13px;color:#64748B;margin-bottom:4px">มูลค่าสั่งซื้อรวม</div>
            <div style="font-size:32px;font-weight:800;color:#F97316"><span style="font-size:16px">฿</span>${UI.fmtMoney(totalValue)}</div>
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
        <div class="table-wrap card">
          <table>
            <thead><tr><th>สินค้า</th><th class="c">หมวด</th><th class="r">ปริมาณรวม (กก.)</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;

    // ---------- Render ----------
    container.innerHTML = `
      <!-- Header -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <div class="section-title">สรุปวัตถุดิบที่ต้องเตรียม</div>
          <div class="section-sub">แดชบอร์ดสรุปยอดรวมจากออเดอร์ทั้งหมดของลูกค้าในระบบ</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <button id="btn-export-round" class="btn-primary" style="background:linear-gradient(135deg,#6366F1,#8B5CF6);border:none;display:flex;align-items:center;gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            ส่งออกใบสั่งซื้อ
          </button>
          <button onclick="window.print()" class="btn-secondary" style="display:flex;align-items:center;gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            พิมพ์สรุป
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="card" style="padding:16px 20px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span style="font-size:13px;font-weight:600;color:#374151;">ช่วงวันที่รับของ:</span>
          </div>

          <div style="display:flex;align-items:center;gap:8px;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:10px;padding:8px 14px;">
            <input type="date" id="dash-from" value="${filterFrom}"
              style="border:none;background:transparent;font-size:13px;color:#1E293B;outline:none;cursor:pointer;font-family:inherit;" />
            <span style="color:#94A3B8;">→</span>
            <input type="date" id="dash-to" value="${filterTo}"
              style="border:none;background:transparent;font-size:13px;color:#1E293B;outline:none;cursor:pointer;font-family:inherit;" />
          </div>

          ${hasFilter ? `
            <button id="dash-clear" style="padding:6px 12px;border-radius:20px;border:1.5px solid #FCA5A5;background:#FFF5F5;color:#EF4444;font-size:12px;font-weight:600;cursor:pointer;">✕ ล้างตัวกรอง</button>
          ` : ''}

          <div style="margin-left:auto;display:flex;align-items:center;gap:6px;font-size:13px;">
            <span style="padding:4px 12px;border-radius:20px;background:${hasFilter?'#EDE9FE':'#F1F5F9'};color:${hasFilter?'#6D28D9':'#64748B'};font-weight:600;">
              ${rangeLabel}
            </span>
          </div>
        </div>
      </div>

      ${summaryHtml}
    `;

    // ---------- Events ----------
    container.querySelector('#dash-from')?.addEventListener('change', e => {
      filterFrom = e.target.value;
      render(container);
    });
    container.querySelector('#dash-to')?.addEventListener('change', e => {
      filterTo = e.target.value;
      render(container);
    });
    container.querySelector('#dash-clear')?.addEventListener('click', () => {
      filterFrom = ''; filterTo = '';
      render(container);
    });
    container.querySelector('#btn-export-round')?.addEventListener('click', () => {
      exportOrderSheet(filteredOrders, aggregated, filterFrom, filterTo);
    });
  }

  // ---------- Export Modal ----------
  function exportOrderSheet(orders, aggregated, from, to) {
    const formatDateDisplay = (ds) => {
      if (!ds) return '';
      try {
        const d = new Date(ds);
        const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()+543}`;
      } catch(e) { return ds; }
    };

    const rangeLabel = (from || to)
      ? `${from ? formatDateDisplay(from) : 'ทุกวัน'} ถึง ${to ? formatDateDisplay(to) : 'ทุกวัน'}`
      : 'ทุกช่วงเวลา';

    const totalKg    = aggregated.reduce((a, i) => a + i.kg, 0);
    const totalValue = orders.reduce((a, o) => a + (o.total_net_cost||0), 0);
    const today      = formatDateDisplay(new Date().toISOString().slice(0,10));

    // Group by category for export
    const grouped = {};
    aggregated.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    const tableRows = Object.keys(grouped).sort().map(cat => {
      const items = grouped[cat].sort((a,b) => b.kg - a.kg);
      const catTotal = items.reduce((a,i) => a+i.kg, 0);
      return `
        <tr style="background:#EDE9FE;">
          <td colspan="3" style="padding:8px 12px;font-weight:700;color:#5B21B6;">${cat}  <span style="font-weight:400;color:#7C3AED;font-size:12px;">(${catTotal.toFixed(1)} กก.)</span></td>
        </tr>
        ${items.map(item => `
          <tr>
            <td style="padding:8px 12px 8px 24px;">${item.name}</td>
            <td style="text-align:center;color:#64748B;font-size:12px;">${item.code}</td>
            <td style="text-align:right;font-weight:700;color:#1E293B;">${item.kg.toFixed(1)} กก.</td>
          </tr>`).join('')}`;
    }).join('');

    const hotelRows = [...new Set(orders.map(o => o._tenant))].map(t => {
      const hotelOrders = orders.filter(o => o._tenant === t);
      const hTotal = hotelOrders.reduce((a,o) => a+(o.total_net_cost||0), 0);
      try {
        const p = JSON.parse(localStorage.getItem(`sp_profile_${t}`)||'{}');
        return `<tr><td style="padding:6px 12px;">${p.businessName||t}</td><td style="text-align:right;padding:6px 12px;">${hotelOrders.length} ออเดอร์</td><td style="text-align:right;padding:6px 12px;color:#F97316;font-weight:700;">฿${UI.fmtMoney(hTotal)}</td></tr>`;
      } catch(e) { return ''; }
    }).join('');

    const printContent = `
      <div style="font-family:'Sarabun','Prompt',sans-serif;max-width:700px;margin:0 auto;padding:32px 24px;">
        <!-- Header -->
        <div style="border-bottom:3px solid #6366F1;padding-bottom:16px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <h1 style="margin:0;font-size:22px;color:#1E293B;">🦑 SmartProcure</h1>
              <h2 style="margin:4px 0 0;font-size:15px;color:#6366F1;font-weight:600;">ใบสั่งซื้อวัตถุดิบ</h2>
            </div>
            <div style="text-align:right;font-size:12px;color:#64748B;">
              <div>สร้างวันที่: <strong>${today}</strong></div>
              <div style="margin-top:4px;padding:4px 10px;background:#EDE9FE;border-radius:6px;color:#6D28D9;font-weight:600;">ช่วงเวลา: ${rangeLabel}</div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
          <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:11px;color:#64748B;">จำนวนออเดอร์</div>
            <div style="font-size:24px;font-weight:800;color:#3B82F6;">${orders.length}</div>
          </div>
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:11px;color:#64748B;">วัตถุดิบรวม</div>
            <div style="font-size:24px;font-weight:800;color:#10B981;">${totalKg.toFixed(1)} กก.</div>
          </div>
          <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:11px;color:#64748B;">มูลค่ารวม</div>
            <div style="font-size:24px;font-weight:800;color:#F97316;">฿${UI.fmtMoney(totalValue)}</div>
          </div>
        </div>

        <!-- Ingredients -->
        <h3 style="margin:0 0 10px;font-size:14px;color:#1E293B;border-left:4px solid #6366F1;padding-left:10px;">รายการวัตถุดิบที่ต้องสั่ง</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
          <thead>
            <tr style="background:#1E293B;color:white;">
              <th style="padding:10px 12px;text-align:left;">สินค้า</th>
              <th style="padding:10px 12px;text-align:center;">รหัส</th>
              <th style="padding:10px 12px;text-align:right;">ปริมาณ</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
          <tfoot>
            <tr style="background:#F8FAFC;font-weight:700;border-top:2px solid #E2E8F0;">
              <td colspan="2" style="padding:10px 12px;text-align:right;">รวมทั้งหมด</td>
              <td style="padding:10px 12px;text-align:right;color:#F97316;">${totalKg.toFixed(1)} กก.</td>
            </tr>
          </tfoot>
        </table>

        <!-- Hotels -->
        <h3 style="margin:0 0 10px;font-size:14px;color:#1E293B;border-left:4px solid #F59E0B;padding-left:10px;">โรงแรมที่รวมอยู่ในรอบนี้</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#FEF3C7;">
              <th style="padding:8px 12px;text-align:left;color:#92400E;">โรงแรม</th>
              <th style="padding:8px 12px;text-align:right;color:#92400E;">ออเดอร์</th>
              <th style="padding:8px 12px;text-align:right;color:#92400E;">มูลค่า</th>
            </tr>
          </thead>
          <tbody>${hotelRows}</tbody>
        </table>

        <div style="margin-top:40px;border-top:1px solid #E2E8F0;padding-top:16px;font-size:11px;color:#94A3B8;text-align:center;">
          SmartProcure — ระบบจัดการวัตถุดิบสำหรับโรงแรม · สร้างอัตโนมัติจากระบบ
        </div>
      </div>`;

    // Show modal preview
    const el = document.createElement('div');
    el.className = 'modal-backdrop sp-modal-container';
    el.style.cssText = 'z-index:2000;';
    el.innerHTML = `
      <div class="modal" style="max-width:780px;width:95vw;max-height:90vh;overflow-y:auto;padding:0;position:relative;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #E2E8F0;position:sticky;top:0;background:white;z-index:10;">
          <div>
            <div style="font-size:16px;font-weight:700;color:#1E293B;">📋 ใบสั่งซื้อวัตถุดิบ</div>
            <div style="font-size:12px;color:#64748B;margin-top:2px;">ช่วงเวลา: ${rangeLabel}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="modal-excel-btn" style="padding:8px 16px;border-radius:8px;border:none;background:#10B981;color:white;font-weight:700;cursor:pointer;font-size:13px;">💾 บันทึก Excel</button>
            <button id="modal-print-btn" style="padding:8px 16px;border-radius:8px;border:none;background:#6366F1;color:white;font-weight:700;cursor:pointer;font-size:13px;">🖨️ พิมพ์เอกสาร</button>
            <button class="modal-close-btn" style="padding:8px 12px;border-radius:8px;border:1px solid #E2E8F0;background:#fff;color:#64748B;cursor:pointer;font-size:13px;">ปิด</button>
          </div>
        </div>
        <div id="print-area">${printContent}</div>
      </div>`;
    document.body.appendChild(el);

    // Event Listeners for Modal
    const closeModal = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      try {
        el.remove();
      } catch (err) {}
    };

    el.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    el.addEventListener('click', e => { if(e.target===el) closeModal(e); });

    // Print logic
    el.querySelector('#modal-print-btn').addEventListener('click', () => {
      const w = window.open('','_blank','width=800,height=900');
      w.document.write(`<!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <title>ใบสั่งซื้อวัตถุดิบ — ${rangeLabel}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>body{margin:0;background:#fff;} @media print{body{-webkit-print-color-adjust:exact;}}</style>
      </head><body>${printContent}
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 300);
          };
        </script>
      </body></html>`);
      w.document.close();
    });

    // Excel export logic
    el.querySelector('#modal-excel-btn').addEventListener('click', () => {
      try {
        const wsData = [
          ['ใบสั่งซื้อวัตถุดิบ (SmartProcure)'],
          ['ช่วงเวลา', rangeLabel],
          ['สร้างวันที่', today],
          [''],
          ['หมวดหมู่', 'รหัสสินค้า', 'ชื่อสินค้า', 'ปริมาณ (กก.)']
        ];
        
        Object.keys(grouped).sort().forEach(cat => {
          const items = grouped[cat].sort((a,b) => b.kg - a.kg);
          items.forEach(item => {
            wsData.push([cat, item.code || '-', item.name, item.kg]);
          });
        });
        
        wsData.push(['']);
        wsData.push(['รวมทั้งหมด', '', '', totalKg]);
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Orders");
        
        // Generate filename
        const filename = `SmartProcure_Orders_${from||'All'}_to_${to||'All'}.xlsx`;
        XLSX.writeFile(wb, filename);
        UI.toast('ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว', 'success');
      } catch (err) {
        console.error(err);
        UI.toast('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel', 'error');
      }
    });
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
      if (!order.net_order_items) return;
      order.net_order_items.forEach(item => {
        const id = item.ingredientId || item.code || item.name;
        if (!stockMap[id]) {
          stockMap[id] = { id, name: item.name, code: item.code, category: item.category, kg: 0, ordersByHotel: {} };
        }
        stockMap[id].kg += (item.netKg || 0);
        if (!stockMap[id].ordersByHotel[order._tenant]) {
          stockMap[id].ordersByHotel[order._tenant] = { name: hotelName, kg: 0 };
        }
        stockMap[id].ordersByHotel[order._tenant].kg += (item.netKg || 0);
      });
    });
    return Object.values(stockMap).sort((a, b) => b.kg - a.kg);
  }

  return { render };
})();
