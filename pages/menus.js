// SmartProcure — Menu Management Page

const MenusPage = (() => {
  let container = null;
  let view = 'list'; // 'list' or 'form'
  let currentMenu = null;

  let filterNat = 'All';

  function renderList() {
    const allMenus = DB.getMenus();
    const nats = ['All', 'Thai', 'Chinese', 'Indian', 'American'];
    
    let menus = allMenus;
    if(filterNat !== 'All') {
      menus = menus.filter(m => m.nationality === filterNat);
    }

    const renderMenuRow = (menu) => `
      <div class="card" style="margin-bottom:12px">
        <div class="card-body" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px">
          <div>
            <div style="font-weight:700;color:#1E293B;font-size:15px;display:flex;align-items:center;gap:8px">
              ${menu.name}
              ${menu.nationality ? `<span class="badge" style="background:#E0E7FF;color:#4338CA">${menu.nationality}</span>` : ''}
              ${menu.targetAudience === 'Child' ? `<span class="badge" style="background:#FEF08A;color:#854D0E">👦 เด็ก</span>` : `<span class="badge" style="background:#E2E8F0;color:#475569">👨 ผู้ใหญ่</span>`}
            </div>
            <div style="font-size:13px;color:#64748B;margin-top:4px">${menu.items.length} วัตถุดิบ</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-secondary btn-edit-menu" data-id="${menu.id}">แก้ไข</button>
            <button class="btn-secondary btn-del-menu" data-id="${menu.id}" style="color:#EF4444;border-color:#FECACA">ลบ</button>
          </div>
        </div>
      </div>
    `;

    const adultMenus = menus.filter(m => m.targetAudience !== 'Child');
    const childMenus = menus.filter(m => m.targetAudience === 'Child');

    const tabsHTML = nats.map(n => `
      <button class="btn-filter-nat ${filterNat === n ? 'active' : ''}" data-nat="${n}" style="padding:6px 16px; border-radius:20px; border:1px solid ${filterNat === n ? '#3B82F6' : '#CBD5E1'}; background:${filterNat === n ? '#EFF6FF' : '#FFF'}; color:${filterNat === n ? '#1D4ED8' : '#64748B'}; cursor:pointer; font-size:14px; font-weight:500; transition:all 0.2s;">
        ${n === 'All' ? 'ทั้งหมด' : n}
      </button>
    `).join('');

    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">จัดการเมนูอาหาร</div>
        <div class="section-sub">สร้างและจัดการเมนูประจำร้านเพื่อความรวดเร็วในการจัดแผน</div>
      </div>
      <div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center">
        <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:4px">
          ${tabsHTML}
        </div>
        <button id="btn-new-menu" class="btn-primary">+ สร้างเมนูใหม่</button>
      </div>

      ${menus.length === 0 ? `<div class="empty-state" style="margin-top:40px"><h3>ยังไม่มีเมนูในหมวดหมู่นี้</h3><p>สร้างเมนูใหม่เพื่อใช้งาน</p></div>` : `
        <div class="grid-2" style="gap:24px; align-items:start">
          <div>
            <h3 style="color:#334155; margin-bottom:12px; font-size:15px; display:flex; align-items:center; gap:8px"><span style="font-size:20px">👨</span> เมนูสำหรับผู้ใหญ่ (${adultMenus.length})</h3>
            ${adultMenus.length ? adultMenus.map(renderMenuRow).join('') : '<div style="color:#94A3B8; font-size:14px; text-align:center; padding:20px 0;">ไม่มีเมนูผู้ใหญ่</div>'}
          </div>
          <div>
            <h3 style="color:#334155; margin-bottom:12px; font-size:15px; display:flex; align-items:center; gap:8px"><span style="font-size:20px">👦</span> เมนูสำหรับเด็ก (${childMenus.length})</h3>
            ${childMenus.length ? childMenus.map(renderMenuRow).join('') : '<div style="color:#94A3B8; font-size:14px; text-align:center; padding:20px 0;">ไม่มีเมนูเด็ก</div>'}
          </div>
        </div>
      `}
    `;

    container.querySelectorAll('.btn-filter-nat').forEach(btn => {
      btn.addEventListener('click', () => {
        filterNat = btn.dataset.nat;
        renderList();
      });
    });

    document.getElementById('btn-new-menu')?.addEventListener('click', () => {
      currentMenu = { id: null, name: '', nationality: filterNat === 'All' ? 'Thai' : filterNat, targetAudience: 'Adult', items: [] };
      view = 'form';
      render(container);
    });

    container.querySelectorAll('.btn-edit-menu').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        currentMenu = JSON.parse(JSON.stringify(allMenus.find(m => m.id === id)));
        view = 'form';
        render(container);
      });
    });

    container.querySelectorAll('.btn-del-menu').forEach(btn => {
      btn.addEventListener('click', () => {
        if(confirm('ต้องการลบเมนูนี้ใช่หรือไม่?')) {
          DB.deleteMenu(btn.dataset.id);
          renderList();
        }
      });
    });
  }

  function renderForm() {
    const rows = currentMenu.items.length ? currentMenu.items.map((item, idx) => {
      const ing = getIngredientById(item.ingredientId);
      return `
      <tr>
        <td>
          <div class="td-name">${ing?.name || 'ไม่ทราบชื่อ'}</div>
          <div class="td-code">${ing?.code || ''}</div>
        </td>
        <td class="c">${catBadgeHtml(ing?.category || '')}</td>
        <td class="c">
          <input type="number" class="inline-input menu-item-grams" data-idx="${idx}" value="${item.gramsPerPerson ?? item.gramsPerPax ?? 100}" style="width:80px" />
        </td>
        <td class="c">
          <button class="btn-icon menu-item-remove" data-idx="${idx}" style="color:#EF4444;font-size:18px">&times;</button>
        </td>
      </tr>
      `;
    }).join('') : `<tr><td colspan="4" class="c" style="color:#94A3B8;padding:20px">ยังไม่มีวัตถุดิบ</td></tr>`;

    container.innerHTML = `
      <div class="page-header" style="display:flex;align-items:center;gap:12px">
        <button id="btn-back-list" class="btn-icon" style="font-size:20px">←</button>
        <div>
          <div class="section-title">${currentMenu.id ? 'แก้ไขเมนู' : 'สร้างเมนูใหม่'}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px">
        <div class="card-body">
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group" style="margin-bottom:0">
              <label>ชื่อเมนู</label>
              <input type="text" id="menu-name-inp" class="inline-input" style="width:100%" value="${currentMenu.name}" placeholder="เช่น กะเพราหมูสับไข่ดาว" />
            </div>
            <div class="grid-2" style="gap:16px;">
              <div class="form-group" style="margin-bottom:0">
                <label>สัญชาติอาหาร (Nationality)</label>
                <input type="text" id="menu-nat-inp" class="inline-input" style="width:100%" value="${currentMenu.nationality || 'Thai'}" list="nat-list" />
                <datalist id="nat-list">
                  <option value="Thai">Thai (ไทย)</option>
                  <option value="Chinese">Chinese (จีน)</option>
                  <option value="Indian">Indian (อินเดีย)</option>
                  <option value="American">American (อเมริกา/ตะวันตก)</option>
                </datalist>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label>กลุ่มเป้าหมาย (Target)</label>
                <select id="menu-target-inp" class="inline-input" style="width:100%">
                  <option value="Adult" ${currentMenu.targetAudience === 'Adult' ? 'selected' : ''}>ผู้ใหญ่ (Adult)</option>
                  <option value="Child" ${currentMenu.targetAudience === 'Child' ? 'selected' : ''}>เด็ก (Child)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>วัตถุดิบในเมนู</h3></div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>วัตถุดิบ</th>
                <th class="c">หมวด</th>
                <th class="c">ปริมาณต่อคน (กรัม)</th>
                <th class="c"></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="padding:16px; border-top:1px solid #F1F5F9" id="menu-search-wrap"></div>
      </div>

      <div style="margin-top:20px; display:flex; justify-content:flex-end">
        <button id="btn-save-menu" class="btn-primary" style="padding:12px 32px; font-size:16px">บันทึกเมนู</button>
      </div>
    `;

    document.getElementById('btn-back-list')?.addEventListener('click', () => {
      if (currentMenu.name && currentMenu.name.trim() !== '' && currentMenu.items.length > 0) {
        DB.saveMenu(currentMenu);
        UI.toast('บันทึกเมนูอัตโนมัติเรียบร้อย');
      }

      if (window.returnToAfterMenu) {
        const ret = window.returnToAfterMenu;
        window.returnToAfterMenu = null;
        showPage(ret);
      } else {
        view = 'list';
        render(container);
      }
    });

    document.getElementById('menu-name-inp')?.addEventListener('input', e => {
      currentMenu.name = e.target.value;
    });

    document.getElementById('menu-nat-inp')?.addEventListener('input', e => {
      currentMenu.nationality = e.target.value;
    });

    document.getElementById('menu-target-inp')?.addEventListener('change', e => {
      currentMenu.targetAudience = e.target.value;
    });

    container.querySelectorAll('.menu-item-grams').forEach(inp => {
      inp.addEventListener('change', e => {
        currentMenu.items[+inp.dataset.idx].gramsPerPerson = Number(e.target.value) || 0;
      });
    });

    container.querySelectorAll('.menu-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        currentMenu.items.splice(+btn.dataset.idx, 1);
        renderForm();
      });
    });

    document.getElementById('btn-save-menu')?.addEventListener('click', () => {
      if (!currentMenu.name.trim()) {
        UI.toast('กรุณากรอกชื่อเมนู', 'error'); return;
      }
      if (currentMenu.items.length === 0) {
        UI.toast('กรุณาเพิ่มวัตถุดิบอย่างน้อย 1 รายการ', 'error'); return;
      }
      DB.saveMenu(currentMenu);
      UI.toast('บันทึกเมนูเรียบร้อยแล้ว');
      
      if (window.returnToAfterMenu) {
        const ret = window.returnToAfterMenu;
        window.returnToAfterMenu = null;
        showPage(ret);
      } else {
        view = 'list';
        render(container);
      }
    });

    // Make Search
    UI.makeSearch('menu-search-wrap', item => {
      if (currentMenu.items.find(i => i.ingredientId === item.id)) {
        UI.toast('มีสินค้านี้แล้ว', 'error'); return;
      }
      currentMenu.items.push({
        ingredientId: item.id,
        gramsPerPerson: item.defaultGrams?.lunch || item.defaultGrams?.dinner || item.defaultGrams?.breakfast || 100
      });
      renderForm();
    });
  }

  function render(c) {
    container = c;
    if (view === 'list') renderList();
    else renderForm();
  }

  return { 
    render, 
    showNewForm() {
      currentMenu = { id: null, name: '', category: '', items: [] };
      view = 'form';
    }
  };
})();
