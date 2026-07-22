// SmartProcure — Admin Delivered Page (ประวัติการจัดส่ง)
// แสดงออเดอร์ที่จัดส่งลูกค้าแล้ว (status = 'delivered')

const AdminDeliveredPage = (() => {
  let expandedId = null;

  function render(container) {
    const orders = DB.getAllAdminOrders().filter(o => o.status === 'delivered');
    orders.sort((a,b) => (b.delivered_at||0) - (a.delivered_at||0));

    // Summary stats
    const totalDelivered = orders.length;
    const totalKg = orders.reduce((a,o) => {
      return a + (o.net_order_items||[]).reduce((s,i) => s+(i.netKg||0), 0);
    }, 0);
    const totalValue = orders.reduce((a,o) => a+(o.total_net_cost||0), 0);
    const totalHotels = new Set(orders.map(o => o._tenant)).size;

    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">🚚 ประวัติการจัดส่ง</div>
        <div class="section-sub">รายการออเดอร์ที่จัดส่งให้ลูกค้าเรียบร้อยแล้ว</div>
      </div>

      ${!orders.length ? `
        <div class="empty-state">
          <div style="font-size:48px;margin-bottom:16px">🚚</div>
          <h3>ยังไม่มีประวัติการจัดส่ง</h3>
          <p>จะแสดงที่นี่เมื่อคุณกดปุ่ม "จัดส่งแล้ว" ในหน้าออเดอร์ทั้งหมด</p>
        </div>` : `

      <div class="grid-4" style="margin-bottom:20px;gap:16px;">
        <div class="card" style="padding:20px;text-align:center;">
          <div style="font-size:13px;color:#64748B;margin-bottom:4px">จัดส่งสำเร็จ (ออเดอร์)</div>
          <div style="font-size:32px;font-weight:800;color:#10B981">${totalDelivered}</div>
        </div>
        <div class="card" style="padding:20px;text-align:center;">
          <div style="font-size:13px;color:#64748B;margin-bottom:4px">จำนวนโรงแรม</div>
          <div style="font-size:32px;font-weight:800;color:#F59E0B">${totalHotels}</div>
        </div>
        <div class="card" style="padding:20px;text-align:center;">
          <div style="font-size:13px;color:#64748B;margin-bottom:4px">ปริมาณที่ส่งรวม</div>
          <div style="font-size:32px;font-weight:800;color:#3B82F6">${totalKg.toFixed(1)} <span style="font-size:16px">กก.</span></div>
        </div>
        <div class="card" style="padding:20px;text-align:center;">
          <div style="font-size:13px;color:#64748B;margin-bottom:4px">มูลค่ารวม</div>
          <div style="font-size:32px;font-weight:800;color:#F97316"><span style="font-size:16px">฿</span>${UI.fmtMoney(totalValue)}</div>
        </div>
      </div>

      <div>
        ${orders.map(order => renderCard(order)).join('')}
      </div>`}`;

    container.querySelectorAll('.del-order-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        expandedId = expandedId === id ? null : id;
        render(container);
      });
    });

    container.querySelectorAll('.del-cust-profile-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const tenant = btn.dataset.tenant;
        try {
          const p = JSON.parse(localStorage.getItem(`sp_profile_${tenant}`) || '{}');
          const html = `
            <div class="info-row"><label>ชื่อกิจการ / โรงแรม</label><span>${p.businessName || tenant}</span></div>
            <div class="info-row"><label>ประเภทลูกค้า</label><span>${p.customerType || '-'}</span></div>
            <div class="info-row"><label>ชื่อผู้ติดต่อ</label><span>${p.contactName || '-'}</span></div>
            <div class="info-row"><label>เบอร์โทร</label><span>${p.contactPhone || '-'}</span></div>
            <div class="info-row"><label>ที่อยู่จัดส่ง</label><span>${p.shippingAddress || '-'}</span></div>
          `;
          UI.modal('ข้อมูลกิจการ / โรงแรม', html);
        } catch(e) {}
      });
    });
  }

  function renderCard(order) {
    const isOpen = expandedId === order.id;
    const net = order.net_order_items || [];
    const total = order.total_net_cost || 0;
    const totalKg = net.reduce((a,i) => a+(i.netKg||0), 0);
    const profile = (() => {
      try { return JSON.parse(localStorage.getItem(`sp_profile_${order._tenant}`) || '{}'); }
      catch(e) { return {}; }
    })();
    const hotelName = profile.businessName || order._tenant;

    const deliveredAt = order.delivered_at
      ? new Date(order.delivered_at).toLocaleDateString('th-TH', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
      : '-';

    let detail = '';
    if (isOpen) {
      const rows = net.map(item => `
        <tr>
          <td><div class="td-name">${item.name}</div><div class="td-code">${item.code||''}</div></td>
          <td class="c">${catBadgeHtml(item.category)}</td>
          <td class="r" style="font-weight:700">${(item.netKg||0).toFixed(1)} กก.</td>
          <td class="r" style="color:#64748B">฿${UI.fmtMoney(item.pricePerKg||0)}</td>
          <td class="r" style="font-weight:700;color:#F97316">฿${UI.fmtMoney(item.netCost||0)}</td>
        </tr>`).join('');

      detail = `
        <div style="border-top:1px solid #F1F5F9;padding:16px;background:#F0FFF4">
          <div style="display:flex;gap:20px;margin-bottom:12px;flex-wrap:wrap;">
            <div style="background:#fff;border-radius:10px;padding:14px 20px;text-align:center;min-width:120px;">
              <div style="font-size:12px;color:#64748B;margin-bottom:4px">ปริมาณรวม</div>
              <div style="font-size:22px;font-weight:800;color:#10B981">${totalKg.toFixed(1)} <span style="font-size:13px">กก.</span></div>
            </div>
            <div style="background:#fff;border-radius:10px;padding:14px 20px;text-align:center;min-width:120px;">
              <div style="font-size:12px;color:#64748B;margin-bottom:4px">มูลค่า</div>
              <div style="font-size:22px;font-weight:800;color:#F97316">฿${UI.fmtMoney(total)}</div>
            </div>
            <div style="background:#fff;border-radius:10px;padding:14px 20px;text-align:center;min-width:120px;">
              <div style="font-size:12px;color:#64748B;margin-bottom:4px">วันที่จัดส่ง</div>
              <div style="font-size:13px;font-weight:700;color:#1E293B">${deliveredAt}</div>
            </div>
          </div>
          <div class="table-wrap" style="border-radius:10px;border:1px solid #BBF7D0;background:#fff;overflow:hidden">
            <table>
              <thead><tr><th>สินค้า</th><th class="c">หมวด</th><th class="r">ส่ง(กก.)</th><th class="r">ราคา/กก.</th><th class="r">รวม(฿)</th></tr></thead>
              <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#94A3B8">ไม่มีข้อมูล</td></tr>'}</tbody>
              ${net.length?`<tfoot><tr><td colspan="4" style="text-align:right">ยอดรวม</td><td style="color:#FDBA74">฿${UI.fmtMoney(total)}</td></tr></tfoot>`:''}
            </table>
          </div>
        </div>`;
    }

    return `
      <div class="card" style="margin-bottom:10px;overflow:hidden;border-left:4px solid #10B981">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:8px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🚚</div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span class="del-cust-profile-btn" data-tenant="${order._tenant}" style="font-weight:700;color:#1E293B;cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:4px;">${hotelName}</span>
                <span class="badge badge-moq-green">จัดส่งแล้ว</span>
              </div>
              <div style="font-size:12px;color:#64748B;margin-top:2px">
                ${order.order_name||'(ไม่มีชื่อ)'} · ส่งเมื่อ ${deliveredAt} · ${net.length} รายการ
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="font-weight:700;color:#F97316;font-size:14px">฿${UI.fmtMoney(total)}</div>
            <button class="btn-secondary sm del-order-toggle" data-id="${order.id}">${isOpen?'ซ่อน':'ดู'}</button>
          </div>
        </div>
        ${detail}
      </div>`;
  }

  return { render };
})();
