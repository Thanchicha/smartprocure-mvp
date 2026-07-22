// SmartProcure — Admin Orders Page

const AdminOrdersPage = (() => {
  let expandedKey = null;
  let filterFrom = '';
  let filterTo   = '';
  let filterStatus = 'all'; // all | submitted | ordered | delivered

  function render(container) {
    const allOrders = DB.getAllAdminOrders().filter(o =>
      o.status === 'submitted' || o.status === 'ordered' || o.status === 'delivered'
    );

    // ---------- Build date map (before filter, for range display) ----------
    const buildDateMap = (orders) => {
      const map = {};
      orders.forEach(order => {
        const dates = (order.target_dates && order.target_dates.length)
          ? order.target_dates : ['ไม่ระบุวันที่'];
        dates.forEach(date => {
          if (!map[date]) map[date] = [];
          map[date].push(order);
        });
      });
      return map;
    };

    // ---------- Apply filters ----------
    const applyFilters = (orders) => {
      return orders.filter(order => {
        // Status filter
        if (filterStatus !== 'all' && order.status !== filterStatus) return false;
        // Date range filter: order must have at least one target_date in range
        if (filterFrom || filterTo) {
          const dates = (order.target_dates && order.target_dates.length) ? order.target_dates : [];
          if (dates.length === 0) return true; // keep "no date" orders
          const inRange = dates.some(d => {
            if (filterFrom && d < filterFrom) return false;
            if (filterTo   && d > filterTo)   return false;
            return true;
          });
          if (!inRange) return false;
        }
        return true;
      });
    };

    // Filter dates shown in the grouped view
    const filterDates = (dateMap) => {
      if (!filterFrom && !filterTo) return Object.keys(dateMap);
      return Object.keys(dateMap).filter(date => {
        if (date === 'ไม่ระบุวันที่') return true;
        if (filterFrom && date < filterFrom) return false;
        if (filterTo   && date > filterTo)   return false;
        return true;
      });
    };

    const orders = applyFilters(allOrders);
    const dateMap = buildDateMap(orders);
    const sortedDates = filterDates(dateMap).sort((a,b) => {
      if (a === 'ไม่ระบุวันที่') return 1;
      if (b === 'ไม่ระบุวันที่') return -1;
      return new Date(a) - new Date(b);
    });

    // ---------- Helpers ----------
    const formatDate = (dateStr) => {
      if (dateStr === 'ไม่ระบุวันที่') return 'ไม่ระบุวันที่';
      try {
        const d = new Date(dateStr);
        const days = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
        const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()+543}`;
      } catch(e) { return dateStr; }
    };
    const isToday = (dateStr) => {
      if (dateStr === 'ไม่ระบุวันที่') return false;
      try { return new Date(dateStr).toDateString() === new Date().toDateString(); } catch(e) { return false; }
    };
    const isPast = (dateStr) => {
      if (dateStr === 'ไม่ระบุวันที่') return false;
      try { const d = new Date(dateStr); d.setHours(23,59,59,999); return d < new Date(); } catch(e) { return false; }
    };

    // ---------- Status chip helper ----------
    const chip = (val, label, color) => {
      const active = filterStatus === val;
      return `<button class="filter-chip${active?' active':''}" data-status="${val}"
        style="padding:6px 14px;border-radius:20px;border:1.5px solid ${active?color:'#E2E8F0'};
               background:${active?color:'#fff'};color:${active?'#fff':'#64748B'};
               font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;">${label}</button>`;
    };

    // ---------- Stats ----------
    const totalOrders = orders.length;
    const totalValue  = orders.reduce((a,o) => a+(o.total_net_cost||0), 0);
    const countByStatus = { submitted: 0, ordered: 0, delivered: 0 };
    orders.forEach(o => { if (countByStatus[o.status] !== undefined) countByStatus[o.status]++; });

    // ---------- Render ----------
    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">ออเดอร์ทั้งหมด (แอดมิน)</div>
        <div class="section-sub">รายการ Batch Order จากลูกค้าทุกโรงแรม — จัดกลุ่มตามวันที่รับของ</div>
      </div>

      <!-- Filter Bar -->
      <div class="card" style="padding:16px 20px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <!-- Calendar Range -->
          <div style="display:flex;align-items:center;gap:8px;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:10px;padding:8px 14px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <input type="date" id="filter-from" value="${filterFrom}"
              style="border:none;background:transparent;font-size:13px;color:#1E293B;outline:none;cursor:pointer;font-family:inherit;" />
            <span style="color:#94A3B8;font-size:13px;">→</span>
            <input type="date" id="filter-to" value="${filterTo}"
              style="border:none;background:transparent;font-size:13px;color:#1E293B;outline:none;cursor:pointer;font-family:inherit;" />
          </div>

          <!-- Status Chips -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${chip('all','ทั้งหมด','#1E293B')}
            ${chip('submitted','✅ ยืนยันแล้ว','#3B82F6')}
            ${chip('ordered','📦 สั่งวัตถุดิบแล้ว','#8B5CF6')}
            ${chip('delivered','🚚 จัดส่งแล้ว','#10B981')}
          </div>

          <!-- Clear -->
          ${(filterFrom||filterTo||filterStatus!=='all') ? `
            <button id="filter-clear" style="padding:6px 12px;border-radius:20px;border:1.5px solid #FCA5A5;background:#FFF5F5;color:#EF4444;font-size:12px;font-weight:600;cursor:pointer;">✕ ล้างตัวกรอง</button>
          ` : ''}

          <div style="margin-left:auto;display:flex;gap:16px;font-size:12px;color:#64748B;flex-wrap:wrap;">
            <span>แสดง <strong style="color:#1E293B">${totalOrders}</strong> ออเดอร์</span>
            <span>มูลค่า <strong style="color:#F97316">฿${UI.fmtMoney(totalValue)}</strong></span>
            <span>🟦 รอ ${countByStatus.submitted}</span>
            <span>🟣 สั่งแล้ว ${countByStatus.ordered}</span>
            <span>🟢 ส่งแล้ว ${countByStatus.delivered}</span>
          </div>
        </div>
      </div>

      <!-- Orders -->
      <div id="orders-list">
      ${!sortedDates.length ? `
        <div class="empty-state">
          <div style="font-size:40px;margin-bottom:12px">🔍</div>
          <h3>ไม่พบออเดอร์ในช่วงเวลาที่เลือก</h3>
          <p>ลองเปลี่ยนช่วงวันที่หรือล้างตัวกรองดูนะครับ</p>
        </div>` :
        sortedDates.map(date => {
          const dayOrders = dateMap[date];
          if (!dayOrders || !dayOrders.length) return '';
          const dayTotal = dayOrders.reduce((a,o) => a+(o.total_net_cost||0), 0);
          const today = isToday(date);
          const past  = isPast(date);
          const headerColor  = today ? '#0EA5E9' : past ? '#94A3B8' : '#1E293B';
          const headerBg     = today ? '#F0F9FF' : past ? '#F8FAFC' : '#F0FDF4';
          const headerBorder = today ? '#BAE6FD' : past ? '#E2E8F0' : '#BBF7D0';
          const badge = today
            ? `<span style="background:#0EA5E9;color:#fff;font-size:11px;padding:2px 8px;border-radius:20px;font-weight:700">วันนี้</span>`
            : past ? `<span style="background:#E2E8F0;color:#94A3B8;font-size:11px;padding:2px 8px;border-radius:20px;font-weight:700">ผ่านมาแล้ว</span>` : '';
          return `
          <div style="margin-bottom:24px;">
            <div style="display:flex;align-items:center;gap:12px;background:${headerBg};border:1.5px solid ${headerBorder};border-radius:12px;padding:14px 18px;margin-bottom:12px;">
              <div style="width:44px;height:44px;border-radius:10px;background:${headerColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <span style="font-size:17px;font-weight:800;color:${headerColor}">${formatDate(date)}</span>
                  ${badge}
                </div>
                <div style="font-size:12px;color:#64748B;margin-top:2px">${dayOrders.length} ออเดอร์ · มูลค่ารวม <strong style="color:#F97316">฿${UI.fmtMoney(dayTotal)}</strong></div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;padding-left:8px;border-left:3px solid ${headerBorder};">
              ${dayOrders.map(order => renderOrderCard(order, date)).join('')}
            </div>
          </div>`;
        }).join('')
      }
      </div>`;

    // ---------- Event listeners ----------
    container.querySelector('#filter-from')?.addEventListener('change', e => {
      filterFrom = e.target.value;
      render(container);
    });
    container.querySelector('#filter-to')?.addEventListener('change', e => {
      filterTo = e.target.value;
      render(container);
    });
    container.querySelector('#filter-clear')?.addEventListener('click', () => {
      filterFrom = ''; filterTo = ''; filterStatus = 'all';
      render(container);
    });
    container.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        filterStatus = btn.dataset.status;
        render(container);
      });
    });


    container.querySelectorAll('.order-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        expandedKey = expandedKey === key ? null : key;
        render(container);
      });
    });

    container.querySelectorAll('.order-print').forEach(btn => {
      btn.addEventListener('click', () => window.print());
    });

    container.querySelectorAll('.cust-profile-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const tenant = btn.dataset.tenant;
        const p = getHotelProfile(tenant);
        const html = `
          <div class="info-row"><label>ชื่อกิจการ / โรงแรม</label><span>${p.businessName || tenant}</span></div>
          <div class="info-row"><label>ประเภทลูกค้า</label><span>${p.customerType || '-'}</span></div>
          <div class="info-row"><label>ชื่อผู้ติดต่อ</label><span>${p.contactName || '-'}</span></div>
          <div class="info-row"><label>เบอร์โทร</label><span>${p.contactPhone || '-'}</span></div>
          <div class="info-row"><label>ที่อยู่จัดส่ง</label><span>${p.shippingAddress || '-'}</span></div>`;
        UI.modal('ข้อมูลกิจการ / โรงแรม', html);
      });
    });

    // Status action buttons
    container.querySelectorAll('.btn-mark-ordered').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await UI.confirm(
          'ยืนยันการสั่งวัตถุดิบ', 
          'ยืนยันว่าสั่งวัตถุดิบจากซัพพลายเออร์แล้วใช่หรือไม่?\n\nวัตถุดิบจะย้ายไปอยู่ใน "คลังสินค้าปัจจุบัน"',
          { okText: 'สั่งวัตถุดิบแล้ว', okColor: '#8B5CF6' }
        );
        if (!ok) return;
        
        const id = btn.dataset.id;
        const allOrders = DB.getAllAdminOrders();
        const order = allOrders.find(o => o.id === id);
        if (order) {
          order.status = 'ordered';
          order.ordered_at = Date.now();
          DB.saveOrderForTenant(order, order._tenant);
          UI.toast('ย้ายเข้าคลังสินค้าแล้ว! 📦', 'success');
          render(container);
        }
      });
    });

    container.querySelectorAll('.btn-mark-delivered').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await UI.confirm(
          'ยืนยันการจัดส่ง', 
          'ยืนยันว่าจัดส่งวัตถุดิบให้ลูกค้าแล้วใช่หรือไม่?\n\nวัตถุดิบจะออกจากคลัง และย้ายไป "ประวัติการจัดส่ง"',
          { okText: 'จัดส่งแล้ว', okColor: '#10B981' }
        );
        if (!ok) return;
        
        const id = btn.dataset.id;
        const allOrders = DB.getAllAdminOrders();
        const order = allOrders.find(o => o.id === id);
        if (order) {
          order.status = 'delivered';
          order.delivered_at = Date.now();
          DB.saveOrderForTenant(order, order._tenant);
          UI.toast('จัดส่งเรียบร้อย! 🚚', 'success');
          render(container);
        }
      });
    });
  }

  function getHotelProfile(tenant) {
    try {
      const p = JSON.parse(localStorage.getItem(`sp_profile_${tenant}`) || '{}');
      p._tenant = tenant;
      return p;
    } catch(e) { return { _tenant: tenant }; }
  }

  function renderOrderCard(order, forDate) {
    const key = `${order.id}_${forDate}`;
    const isOpen = expandedKey === key;
    const net = order.net_order_items || [];

    // Per-day quantity
    const numDates = (order.target_dates && order.target_dates.length) ? order.target_dates.length : 1;
    const dayNet = net.map(item => ({
      ...item,
      netKg: (item.netKg||0) / numDates,
      netCost: (item.netCost||0) / numDates,
    }));
    const dayTotal = (order.total_net_cost||0) / numDates;

    const STATUS = {
      submitted: { label:'ยืนยันแล้ว', cls:'badge-blue' },
      ordered:   { label:'สั่งวัตถุดิบแล้ว', cls:'badge-purple' },
      delivered: { label:'จัดส่งแล้ว', cls:'badge-moq-green' },
    };
    const st = STATUS[order.status] || STATUS.submitted;
    const profile = getHotelProfile(order._tenant);
    const hotelName = profile.businessName || order._tenant;

    // Action button
    let actionBtn = '';
    if (order.status === 'submitted') {
      actionBtn = `<button class="btn-mark-ordered" data-id="${order.id}" style="background:#8B5CF6;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">📦 สั่งวัตถุดิบแล้ว</button>`;
    } else if (order.status === 'ordered') {
      actionBtn = `<button class="btn-mark-delivered" data-id="${order.id}" style="background:#10B981;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">🚚 จัดส่งแล้ว</button>`;
    }

    let detail = '';
    if (isOpen) {
      const rows = dayNet.map(item => `
        <tr>
          <td><div class="td-name">${item.name}</div><div class="td-code">${item.code||''}</div></td>
          <td class="c">${catBadgeHtml(item.category)}</td>
          <td class="r" style="font-weight:700">${(item.netKg||0).toFixed(1)} กก.</td>
          <td class="c"><span class="badge ${Calc.MOQ_BADGE[item.moqStatus]||'badge-moq-gray'}">${Calc.MOQ_LABEL[item.moqStatus]||'-'}</span></td>
          <td class="r" style="color:#64748B">฿${UI.fmtMoney(item.pricePerKg||0)}</td>
          <td class="r" style="font-weight:700;color:#F97316">฿${UI.fmtMoney(item.netCost||0)}</td>
        </tr>`).join('');

      const catColor = c => (typeof CAT_COLOR !== 'undefined' && CAT_COLOR[c]) ? CAT_COLOR[c] : '#94A3B8';
      const catMap = {};
      dayNet.forEach(item => { catMap[item.category] = (catMap[item.category]||0) + (item.netKg||0); });
      const catEntries = Object.entries(catMap).filter(([,v]) => v > 0);
      const totalCatKg = catEntries.reduce((a,[,v]) => a+v, 0);
      let donutSvg = `<svg width="140" height="140" viewBox="0 0 140 140">`;
      if (catEntries.length > 0) {
        let angle = -90;
        catEntries.forEach(([cat, kg]) => {
          const pct = kg / totalCatKg;
          const deg = pct * 360;
          const r = 55, cx = 70, cy = 70, ri = 33;
          const toRad = d => d * Math.PI / 180;
          const x1 = cx + r*Math.cos(toRad(angle)), y1 = cy + r*Math.sin(toRad(angle));
          const x2 = cx + r*Math.cos(toRad(angle+deg)), y2 = cy + r*Math.sin(toRad(angle+deg));
          const xi1 = cx + ri*Math.cos(toRad(angle)), yi1 = cy + ri*Math.sin(toRad(angle));
          const xi2 = cx + ri*Math.cos(toRad(angle+deg)), yi2 = cy + ri*Math.sin(toRad(angle+deg));
          const large = deg > 180 ? 1 : 0;
          donutSvg += `<path d="M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi2.toFixed(2)},${yi2.toFixed(2)} A${ri},${ri} 0 ${large},0 ${xi1.toFixed(2)},${yi1.toFixed(2)} Z" fill="${catColor(cat)}" opacity="0.85"/>`;
          angle += deg;
        });
        donutSvg += `<circle cx="70" cy="70" r="29" fill="white"/>
          <text x="70" y="67" text-anchor="middle" font-size="11" font-weight="700" fill="#1E293B">${totalCatKg.toFixed(1)}</text>
          <text x="70" y="80" text-anchor="middle" font-size="9" fill="#64748B">กก./วัน</text>`;
      }
      donutSvg += `</svg>`;

      const legend = catEntries.map(([cat, kg]) =>
        `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#475569;white-space:nowrap">
          <span style="width:8px;height:8px;border-radius:50%;background:${catColor(cat)};flex-shrink:0"></span>${cat}: ${kg.toFixed(1)}
        </span>`).join('');

      const multiDayNote = numDates > 1
        ? `<div style="margin-top:8px;padding:6px 10px;background:#FFF7ED;border-radius:6px;font-size:11px;color:#92400E">
            <strong>หมายเหตุ:</strong> ออเดอร์นี้ครอบ ${numDates} วัน · แสดงปริมาณ <strong>เฉพาะวันนี้</strong>
           </div>` : '';

      detail = `
        <div style="border-top:1px solid #F1F5F9;padding:14px;background:#FAFAF9">
          <div class="grid-2" style="margin-bottom:12px;align-items:stretch">
            <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px">
              <div style="font-size:12px;color:#64748B;margin-bottom:4px">ยอดสั่งซื้อ (วันนี้)</div>
              <div style="font-size:28px;font-weight:800;color:#1E293B">${totalCatKg.toFixed(1)} กก.</div>
              <div style="font-size:18px;font-weight:700;color:#F97316">฿${UI.fmtMoney(dayTotal)}</div>
              ${multiDayNote}
            </div>
            <div class="card">
              <div class="card-body" style="display:flex;flex-direction:column;align-items:center;gap:8px">
                ${donutSvg}
                <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">${legend}</div>
              </div>
            </div>
          </div>
          <div class="table-wrap" style="border-radius:10px;border:1px solid #E2E8F0;background:#fff;overflow:hidden">
            <table>
              <thead><tr><th>สินค้า</th><th class="c">หมวด</th><th class="r">สั่ง(กก./วัน)</th><th class="c">MOQ</th><th class="r">ราคา/กก.</th><th class="r">รวม(฿)</th></tr></thead>
              <tbody>${rows||'<tr><td colspan="6" style="text-align:center;padding:20px;color:#94A3B8">ไม่มีข้อมูล</td></tr>'}</tbody>
              ${dayNet.length?`<tfoot><tr><td colspan="5" style="text-align:right">ยอดสุทธิ (วันนี้)</td><td style="color:#FDBA74">฿${UI.fmtMoney(dayTotal)}</td></tr></tfoot>`:''}
            </table>
          </div>
        </div>`;
    }

    const borderColor = order.status === 'delivered' ? '#10B981' : order.status === 'ordered' ? '#8B5CF6' : '#3B82F6';

    return `
      <div class="card" style="margin-bottom:4px;overflow:hidden;border-left:4px solid ${borderColor}">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:8px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#16A34A;flex-shrink:0">Cust</div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span class="cust-profile-btn" data-tenant="${order._tenant}" style="font-weight:700;color:#1E293B;cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:4px">${hotelName}</span>
                <span class="badge ${st.cls}">${st.label}</span>
              </div>
              <div style="font-size:12px;color:#64748B;margin-top:2px">${order.order_name||'(ไม่มีชื่อ)'} · ${net.length} รายการ</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${actionBtn}
            <div style="font-weight:700;color:#F97316;font-size:14px">฿${UI.fmtMoney(dayTotal)}<span style="font-size:11px;color:#94A3B8;font-weight:400">/วัน</span></div>
            <button class="btn-secondary sm order-toggle" data-key="${key}">${isOpen?'ซ่อน':'ดู'}</button>
            <button class="btn-secondary sm order-print" data-key="${key}" title="พิมพ์">พิมพ์</button>
          </div>
        </div>
        ${detail}
      </div>`;
  }

  return { render };
})();
