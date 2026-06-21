// SmartProcure — Menu Management Page

const MenusPage = (() => {
  let container = null;
  let view = 'list'; // 'list' or 'form'
  let currentMenu = null;

  function renderList() {
    const menus = DB.getMenus();
    const rows = menus.length ? menus.map(menu => `
      <div class="card" style="margin-bottom:16px">
        <div class="card-body" style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700;color:#1E293B;font-size:16px">${menu.name}</div>
            <div style="font-size:13px;color:#64748B;margin-top:4px">${menu.items.length} วัตถุดิบ</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-secondary btn-edit-menu" data-id="${menu.id}">แก้ไข</button>
            <button class="btn-secondary btn-del-menu" data-id="${menu.id}" style="color:#EF4444;border-color:#FECACA">ลบ</button>
          </div>
        </div>
      </div>
    `).join('') : `<div class="empty-state"><h3>ยังไม่มีเมนู</h3><p>สร้างเมนูอาหารของคุณเพื่อนำไปใช้ในแผนรายวัน</p></div>`;

    container.innerHTML = `
      <div class="page-header">
        <div class="section-title">จัดการเมนูอาหาร</div>
        <div class="section-sub">สร้างและจัดการเมนูประจำร้านเพื่อความรวดเร็วในการจัดแผน</div>
      </div>
      <div style="margin-bottom:20px">
        <button id="btn-new-menu" class="btn-primary">+ สร้างเมนูใหม่</button>
      </div>
      <div>${rows}</div>
    `;

    document.getElementById('btn-new-menu')?.addEventListener('click', () => {
      currentMenu = { id: null, name: '', items: [] };
      view = 'form';
      render(container);
    });

    container.querySelectorAll('.btn-edit-menu').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        currentMenu = JSON.parse(JSON.stringify(menus.find(m => m.id === id)));
        view = 'form';
        render(container);
      });
    });

    container.querySelectorAll('.btn-del-menu').forEach(btn => {
      btn.addEventListener('click', () => {
        if(confirm('ต้องการลบเมนูนี้ใช่หรือไม่?')) {
          DB.deleteMenu(btn.dataset.id);
          render(container);
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
          <input type="number" class="inline-input menu-item-grams" data-idx="${idx}" value="${item.gramsPerPerson}" style="width:80px" />
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
          <div class="form-group" style="margin-bottom:0">
            <label>ชื่อเมนู</label>
            <input type="text" id="menu-name-inp" value="${currentMenu.name}" placeholder="เช่น กะเพราหมูสับไข่ดาว" />
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
        gramsPerPerson: item.defaultGrams?.breakfast || 0 // fallback
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
      currentMenu = { id: null, name: '', items: [] };
      view = 'form';
    }
  };
})();
