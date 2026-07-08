// SmartProcure — Menu Select Page

const MenuSelectPage = (() => {
  let container = null;
  let filterNat = 'All';
  let searchQuery = '';
  let expandedMenuId = null;
  let selectedMenuIds = new Set();

  function renderList() {
    const mk = window.menuSelectTargetMeal;
    const plan = CalculatorPage.getCurrentPlan ? CalculatorPage.getCurrentPlan() : null;
    const addedMenuIds = (plan && plan.meals && plan.meals[mk] && plan.meals[mk].addedMenus) ? plan.meals[mk].addedMenus : [];
    
    const allMenus = DB.getMenus();
    const nats = ['All', ...new Set(allMenus.map(m => m.nationality).filter(Boolean))];
    
    const addedMenusObj = addedMenuIds.map(id => allMenus.find(m => m.id === id)).filter(Boolean);
    const addedMenusText = addedMenusObj.length ? addedMenusObj.map(m => `
      <span style="display:inline-flex;align-items:center;background:#DCFCE7;color:#166534;padding:2px 8px;border-radius:12px;margin:0 4px 4px 0;border:1px solid #BBF7D0;font-size:13px">
        ${m.name}
        <button class="btn-remove-added-menu" data-id="${m.id}" style="background:transparent;border:none;color:#166534;margin-left:4px;cursor:pointer;font-size:14px;padding:0;line-height:1">&times;</button>
      </span>
    `).join('') : '<span style="color:#64748B">ยังไม่มีเมนูในมื้อนี้</span>';

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
                ${addedMenuIds.includes(menu.id) ? `<span class="badge" style="background:#DCFCE7;color:#16A34A;border:1px solid #BBF7D0">✅ เพิ่มแล้ว</span>` : ''}
              </div>
              <div style="font-size:13px;color:#64748B;margin-top:4px">${menu.items.length} วัตถุดิบ</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn-secondary btn-toggle-ing" data-id="${menu.id}" style="padding:6px 10px; font-size:13px">
                ${isExpanded ? 'ซ่อนวัตถุดิบ' : 'ดูวัตถุดิบ'}
              </button>
              <label style="display:flex;align-items:center;cursor:pointer;gap:6px;background:#F1F5F9;padding:4px 10px;border-radius:6px;border:1px solid #CBD5E1">
                <input type="checkbox" class="menu-select-cb" data-id="${menu.id}" ${selectedMenuIds.has(menu.id) ? 'checked' : ''} style="width:16px;height:16px;accent-color:#10B981" />
                <span style="font-size:13px;color:#1E293B;font-weight:500">เลือก</span>
              </label>
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
          <button id="btn-ai-recommend" class="btn-primary" style="white-space:nowrap; background:#8B5CF6; border-color:#7C3AED;">✨ AI แนะนำเมนู</button>
          <button id="btn-create-menu" class="btn-secondary" style="white-space:nowrap">+ สร้างเมนูใหม่</button>
        </div>
      </div>

      <div style="margin-bottom:20px; display:flex; gap:8px; overflow-x:auto; padding-bottom:4px">
        ${tabsHTML}
      </div>

      <div class="card" style="margin-bottom:20px; background:#F8FAFC; border:1px dashed #CBD5E1">
        <div class="card-body" style="padding:16px">
          <div style="font-weight:600; color:#334155; margin-bottom:8px; font-size:14px;">เมนูที่เลือกไว้ในแผนของคุณ (มื้อนี้):</div>
          <div>${addedMenusText}</div>
        </div>
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

      ${selectedMenuIds.size > 0 ? `
        <div style="position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1E293B; color:white; padding:12px 24px; border-radius:30px; display:flex; align-items:center; gap:16px; box-shadow:0 10px 25px rgba(0,0,0,0.2); z-index:9999; animation: slideUp 0.3s ease;">
          <style>@keyframes slideUp { from { bottom:-50px; opacity:0; } to { bottom:24px; opacity:1; } }</style>
          <span style="font-weight:500">เลือกไว้ ${selectedMenuIds.size} เมนู</span>
          <button id="btn-import-multiple" style="background:#10B981; color:white; border:none; padding:8px 20px; border-radius:20px; font-weight:600; cursor:pointer; font-size:14px; transition:background 0.2s" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10B981'">นำเข้าทั้งหมด</button>
        </div>
      ` : ''}
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

    container.querySelectorAll('.menu-select-cb').forEach(cb => {
      cb.addEventListener('change', e => {
        const id = e.target.dataset.id;
        if(e.target.checked) selectedMenuIds.add(id);
        else selectedMenuIds.delete(id);
        renderList(); // Re-render to update the floating bar
      });
    });

    document.getElementById('btn-import-multiple')?.addEventListener('click', () => {
      const mk = window.menuSelectTargetMeal;
      if(mk) {
        let count = 0;
        selectedMenuIds.forEach(id => {
          CalculatorPage.importMenuData(id, mk, true); // true = silent
          count++;
        });
        UI.toast(`นำเข้า ${count} เมนูเรียบร้อยแล้ว`);
        selectedMenuIds.clear();
        CalculatorPage.forceRenderTabs();
        showPage('calculator');
      } else {
        UI.toast('เกิดข้อผิดพลาด ไม่พบมื้ออาหารที่ต้องการนำเข้า', 'error');
      }
    });

    container.querySelectorAll('.btn-remove-added-menu').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const mk = window.menuSelectTargetMeal;
        CalculatorPage.removeMenuData(id, mk, false); // false = show toast
        renderList(); 
        CalculatorPage.forceRenderTabs();
      });
    });

    document.getElementById('btn-create-menu')?.addEventListener('click', () => {
      window.returnToAfterMenu = 'menu-select';
      MenusPage.showNewForm();
      showPage('menus');
    });

    document.getElementById('btn-ai-recommend')?.addEventListener('click', () => {
      const plan = CalculatorPage.getCurrentPlan ? CalculatorPage.getCurrentPlan() : null;
      if (!plan) {
        UI.toast('เกิดข้อผิดพลาดในการดึงข้อมูลแผน', 'error');
        return;
      }
      
      const mk = window.menuSelectTargetMeal;
      const btn = document.getElementById('btn-ai-recommend');
      btn.innerHTML = 'กำลังประมวลผล...';
      btn.disabled = true;

      AI.recommendMenus(plan, mk, DB.getMenus(), (result) => {
        btn.innerHTML = '✨ AI แนะนำเมนู';
        btn.disabled = false;

        if (result && result.recommendedMenuIds) {
          // Clear previous selection and select recommended ones
          selectedMenuIds.clear();
          result.recommendedMenuIds.forEach(id => {
            if (DB.getMenus().find(m => m.id === id)) {
              selectedMenuIds.add(id);
            }
          });
          
          UI.toast('AI ทำการเลือกเมนูแนะนำให้แล้ว!', 'success');
          
          // Show modal with reasoning
          const formattedReasoning = result.reasoning.replace(/\n/g, '<br>').replace(/\* /g, '&bull; ');
          const modalHtml = `
            <div style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:10000; display:flex; align-items:center; justify-content:center; padding:20px;">
              <div style="background:white; border-radius:12px; padding:24px; max-width:600px; width:100%; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                <h3 style="margin-bottom:16px; display:flex; align-items:center; gap:8px;"><span style="font-size:24px">✨</span> คำแนะนำจาก AI</h3>
                <div style="font-size:14px; color:#334155; line-height:1.8; margin-bottom:20px; background:#F8FAFC; padding:20px; border-radius:8px; border-left:4px solid #8B5CF6; max-height: 400px; overflow-y: auto;">
                  ${formattedReasoning}
                </div>
                <div style="display:flex; justify-content:flex-end; gap:12px;">
                  <button id="btn-close-ai-modal" class="btn-secondary">ปิด</button>
                  <button id="btn-import-ai" class="btn-primary" style="background:#10B981;">นำเข้า ${selectedMenuIds.size} เมนู</button>
                </div>
              </div>
            </div>
          `;
          
          const modalWrapper = document.createElement('div');
          modalWrapper.innerHTML = modalHtml;
          document.body.appendChild(modalWrapper);
          
          document.getElementById('btn-close-ai-modal').addEventListener('click', () => {
            document.body.removeChild(modalWrapper);
            renderList();
          });
          
          document.getElementById('btn-import-ai').addEventListener('click', () => {
            document.body.removeChild(modalWrapper);
            document.getElementById('btn-import-multiple').click();
          });

          renderList();
        }
      });
    });
  }

  function render(c) {
    container = c;
    renderList();
  }

  return { render };
})();
