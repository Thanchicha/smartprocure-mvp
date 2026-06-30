// SmartProcure — Menu Select Page

const MenuSelectPage = (() => {
  let container = null;
  let filterNat = 'All';
  let searchQuery = '';
  let expandedMenuId = null;

  function renderList() {
    const allMenus = DB.getMenus();
    const nats = ['All', ...new Set(allMenus.map(m => m.nationality).filter(Boolean))];
    
    let menus = allMenus;
    
    // Search Filter
    if(searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      menus = menus.filter(m => m.name.toLowerCase().includes(q));
    }

    // Nat Filter
    if(filterNat !== 'All') {
      menus = menus.filter(m => m.nationality === filterNat);
    }

    const renderMenuRow = (menu) => {
      const isExpanded = expandedMenuId === menu.id;
      const ingRows = menu.items.map(item => {
        const ing = getIngredientById(item.ingredientId);
        return `
          <div style="display:flex; justify-content:space-between; font-size:13px; padding:4px 0; border-bottom:1px dashed #E2E8F0">
            <div style="color:#475569">- ${ing ? ing.name : 'Unknown'}</div>
            <div style="color:#64748B">${item.gramsPerPerson} กรัม/คน</div>
          </div>
        `;
      }).join('');

      return `
      <div class="card" style="margin-bottom:12px; border:1px solid ${isExpanded ? '#3B82F6' : '#E2E8F0'}">
        <div class="card-body" style="padding:12px 16px">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;color:#1E293B;font-size:15px;display:flex;align-items:center;gap:8px; flex-wrap:wrap">
                ${menu.name}
                ${menu.nationality ? `<span class="badge" style="background:#E0E7FF;color:#4338CA">${menu.nationality}</span>` : ''}
              </div>
              <div style="font-size:13px;color:#64748B;margin-top:4px">${menu.items.length} วัตถุดิบ</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn-secondary btn-toggle-ing" data-id="${menu.id}" style="padding:6px 10px; font-size:13px">
                ${isExpanded ? 'ซ่อนวัตถุดิบ' : 'ดูวัตถุดิบ'}
              </button>
              <button class="btn-primary btn-import-menu" data-id="${menu.id}" style="padding:6px 12px; font-size:13px">นำเข้า</button>
            </div>
          </div>
          ${isExpanded ? `
            <div style="margin-top:12px; padding-top:12px; border-top:1px solid #E2E8F0; background:#F8FAFC; padding:12px; border-radius:8px">
              <div style="font-weight:600; font-size:13px; margin-bottom:8px; color:#334155">ส่วนผสม (ต่อ 1 ท่าน)</div>
              ${ingRows || '<div style="font-size:13px; color:#94A3B8">ไม่มีวัตถุดิบ</div>'}
            </div>
          ` : ''}
        </div>
      </div>
    `;
    };

    const adultMenus = menus.filter(m => m.targetAudience !== 'Child');
    const childMenus = menus.filter(m => m.targetAudience === 'Child');

    const tabsHTML = nats.map(n => `
      <button class="btn-filter-nat ${filterNat === n ? 'active' : ''}" data-nat="${n}" style="padding:6px 16px; border-radius:20px; border:1px solid ${filterNat === n ? '#3B82F6' : '#CBD5E1'}; background:${filterNat === n ? '#EFF6FF' : '#FFF'}; color:${filterNat === n ? '#1D4ED8' : '#64748B'}; cursor:pointer; font-size:14px; font-weight:500; transition:all 0.2s;">
        ${n === 'All' ? 'ทั้งหมด' : n}
      </button>
    `).join('');

    container.innerHTML = `
      <div class="page-header" style="display:flex; align-items:center; gap:12px">
        <button id="btn-back-calc" class="btn-icon" style="font-size:20px">←</button>
        <div>
          <div class="section-title">เลือกเมนูอาหาร</div>
          <div class="section-sub">ดึงวัตถุดิบจากเมนูประจำร้านเข้าสู่แผนรายวัน</div>
        </div>
      </div>
      
      <div class="card" style="margin-bottom:20px">
        <div class="card-body" style="display:flex; gap:12px; align-items:center">
          <div style="flex:1; position:relative">
            <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94A3B8">🔍</span>
            <input type="text" id="menu-search-inp" class="inline-input" placeholder="ค้นหาชื่อเมนู..." value="${searchQuery}" style="width:100%; padding-left:36px; padding-top:10px; padding-bottom:10px" />
          </div>
          <button id="btn-create-menu" class="btn-secondary" style="white-space:nowrap">+ สร้างเมนูใหม่</button>
        </div>
      </div>

      <div style="margin-bottom:20px; display:flex; gap:8px; overflow-x:auto; padding-bottom:4px">
        ${tabsHTML}
      </div>

      ${menus.length === 0 ? `<div class="empty-state" style="margin-top:40px"><h3>ไม่พบเมนู</h3><p>ลองค้นหาด้วยคำอื่น หรือสร้างเมนูใหม่</p></div>` : `
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

    document.getElementById('btn-back-calc')?.addEventListener('click', () => {
      showPage('calculator');
    });

    const searchInp = document.getElementById('menu-search-inp');
    if(searchInp) {
      searchInp.focus();
      searchInp.selectionStart = searchInp.selectionEnd = searchInp.value.length;
      searchInp.addEventListener('input', e => {
        searchQuery = e.target.value;
        renderList();
      });
    }

    container.querySelectorAll('.btn-filter-nat').forEach(btn => {
      btn.addEventListener('click', () => {
        filterNat = btn.dataset.nat;
        renderList();
      });
    });

    container.querySelectorAll('.btn-toggle-ing').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if(expandedMenuId === id) expandedMenuId = null;
        else expandedMenuId = id;
        renderList();
      });
    });

    container.querySelectorAll('.btn-import-menu').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const mk = window.menuSelectTargetMeal;
        if(mk) {
          CalculatorPage.importMenuData(id, mk);
          showPage('calculator');
        } else {
          UI.toast('เกิดข้อผิดพลาด ไม่พบมื้ออาหารที่ต้องการนำเข้า', 'error');
        }
      });
    });

    document.getElementById('btn-create-menu')?.addEventListener('click', () => {
      window.returnToAfterMenu = 'menu-select';
      MenusPage.showNewForm();
      showPage('menus');
    });
  }

  function render(c) {
    container = c;
    renderList();
  }

  return { render };
})();
