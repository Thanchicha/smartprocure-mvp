// SmartProcure — Profile Page

const ProfilePage = (() => {
  function render(container){
    const p = DB.getProfile();

    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">โปรไฟล์ลูกค้า</div>
        <div class="section-sub">ข้อมูลนี้จะถูกใช้ในทุกการคำนวณ — กรอกครั้งเดียว แก้ไขได้ตลอด</div>
      </div>

      <div class="card">
        <div class="card-header"><h3>ข้อมูลกิจการ / โรงแรม</h3></div>
        <div class="card-body">
          <div class="grid-2" style="margin-bottom:16px">
            <div class="form-group">
              <label>ชื่อกิจการ / โรงแรม *</label>
              <input type="text" id="p-biz-name" value="${p.businessName||''}" placeholder="เช่น โรงแรมทะเลงาม" />
            </div>
            <div class="form-group">
              <label>ประเภทลูกค้า</label>
              <select id="p-cust-type">
                ${['โรงแรม','รีสอร์ท','ร้านอาหาร','โรงเรียน','โรงพยาบาล','อื่นๆ'].map(t=>`<option ${(p.customerType||'โรงแรม')===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="grid-3" style="margin-bottom:16px">
            <div class="form-group"><label>ชื่อผู้ติดต่อ</label><input type="text" id="p-contact-name" value="${p.contactName||''}" /></div>
            <div class="form-group"><label>เบอร์โทร</label><input type="text" id="p-contact-phone" value="${p.contactPhone||''}" /></div>
            <div class="form-group"><label>ที่อยู่จัดส่ง</label><input type="text" id="p-delivery-addr" value="${p.deliveryAddress||''}" /></div>
          </div>
          <div class="divider"></div>
          <div style="margin-bottom:12px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
              <input type="checkbox" id="p-use-manual" ${p.useManualGuests?'checked':''} style="width:16px;height:16px;accent-color:#F97316" />
              กำหนดจำนวนแขกเอง (ไม่คำนวณจากห้อง)
            </label>
          </div>
          <div id="p-room-fields" class="grid-4" style="${p.useManualGuests?'display:none':''}margin-bottom:4px">
            <div class="form-group">
              <label>จำนวนห้องทั้งหมด</label>
              <input type="number" id="p-total-rooms" min="1" value="${p.totalRooms||80}" />
            </div>
            <div class="form-group">
              <label>อัตราเข้าพัก (%)</label>
              <input type="number" id="p-occ-rate" min="0" max="100" value="${p.occupancyRate||75}" />
            </div>
            <div class="form-group">
              <label>ผู้เข้าพัก/ห้อง</label>
              <input type="number" id="p-guests-room" min="0.1" step="0.1" value="${p.guestsPerRoom||1.8}" />
            </div>
            <div class="form-group">
              <label>Buffer เผื่อขาด (%)</label>
              <input type="number" id="p-buf-rate" min="0" value="${p.bufferRate||5}" />
            </div>
          </div>
          <div id="p-manual-fields" style="${!p.useManualGuests?'display:none':''}">
            <div class="form-group" style="max-width:200px">
              <label>จำนวนแขก (คน)</label>
              <input type="number" id="p-manual-guests" min="1" value="${p.manualGuests||100}" />
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:16px;margin-top:8px;margin-bottom:20px">
            <div class="pill">แขกทั้งหมด: <strong id="p-guests-disp">${calcGuests(p)}</strong> คน</div>
          </div>
          <button id="p-save-btn" class="btn-primary">บันทึกข้อมูล</button>
          <span id="p-saved-msg" style="font-size:13px;color:#16A34A;margin-left:12px;display:none">บันทึกแล้ว</span>
        </div>
      </div>`;

    function calcGuests(data){
      if(data.useManualGuests) return data.manualGuests||0;
      return Calc.totalGuests(Number(data.totalRooms)||0, Number(data.occupancyRate)||0, Number(data.guestsPerRoom)||1);
    }

    function refreshGuests(){
      const cur = collectForm();
      document.getElementById('p-guests-disp').textContent = calcGuests(cur);
    }

    function collectForm(){
      return {
        businessName: document.getElementById('p-biz-name').value,
        customerType: document.getElementById('p-cust-type').value,
        contactName: document.getElementById('p-contact-name').value,
        contactPhone: document.getElementById('p-contact-phone').value,
        deliveryAddress: document.getElementById('p-delivery-addr').value,
        useManualGuests: document.getElementById('p-use-manual').checked,
        totalRooms: Number(document.getElementById('p-total-rooms').value)||0,
        occupancyRate: Number(document.getElementById('p-occ-rate').value)||0,
        guestsPerRoom: Number(document.getElementById('p-guests-room').value)||1,
        bufferRate: Number(document.getElementById('p-buf-rate').value)||5,
        manualGuests: Number(document.getElementById('p-manual-guests').value)||0,
      };
    }

    document.getElementById('p-use-manual').addEventListener('change', e => {
      document.getElementById('p-room-fields').style.display = e.target.checked ? 'none' : '';
      document.getElementById('p-manual-fields').style.display = e.target.checked ? '' : 'none';
      refreshGuests();
    });
    ['p-total-rooms','p-occ-rate','p-guests-room','p-buf-rate','p-manual-guests'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', refreshGuests);
    });
    document.getElementById('p-save-btn').addEventListener('click', () => {
      const data = collectForm();
      if(!data.businessName){ UI.toast('กรุณากรอกชื่อกิจการ','error'); return; }
      DB.saveProfile(data);
      const msg = document.getElementById('p-saved-msg');
      msg.style.display = '';
      setTimeout(()=>msg.style.display='none', 2500);
      UI.toast('บันทึกโปรไฟล์เรียบร้อย');
      showPage('daily-plans');
    });
  }

  return { render };
})();