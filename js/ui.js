/* eslint-disable */
// SmartProcure — UI Helpers 

const UI = {
  // Toast
  toast(msg, type='success'){
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(()=>el.remove(), 3200);
  },

  // Ingredient search widget — returns HTML string wrapper ID, then binds
  makeSearch(containerId, onSelect){
    const c = document.getElementById(containerId);
    if(!c) return;
    c.innerHTML = `
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" placeholder="ค้นหาสินค้า (พิมพ์ชื่อ หรือ รหัส)" autocomplete="off" />
        <button class="search-clear" style="display:none">✕</button>
        <div class="search-dropdown" style="display:none"></div>
      </div>`;
    const inp = c.querySelector('input');
    const clr = c.querySelector('.search-clear');
    const drop = c.querySelector('.search-dropdown');

    inp.addEventListener('input',()=>{
      const q = inp.value.trim();
      clr.style.display = q ? '' : 'none';
      if(!q){ drop.style.display='none'; return; }
      const results = searchIngredients(q);
      if(!results.length){ drop.innerHTML=`<div class="search-empty">ไม่พบสินค้า</div>`; drop.style.display=''; return; }
      drop.innerHTML = results.map(item=>`
        <div class="search-item" data-id="${item.id}">
          <div class="search-item-left">
            <span class="search-item-code">${item.code}</span>
            <span class="search-item-name">${this._hl(item.name,q)}</span>
          </div>
          <div class="search-item-right">
            ${catBadgeHtml(item.category)}
            <span style="font-size:11px;color:#94A3B8">฿${item.pricePerKg.toLocaleString()}/กก.</span>
          </div>
        </div>`).join('');
      drop.style.display = '';
      drop.querySelectorAll('.search-item').forEach(el=>{
        el.addEventListener('mousedown',e=>{
          e.preventDefault();
          const item = getIngredientById(el.dataset.id);
          if(item){ onSelect(item); inp.value=''; clr.style.display='none'; drop.style.display='none'; }
        });
      });
    });
    clr.addEventListener('click',()=>{ inp.value=''; clr.style.display='none'; drop.style.display='none'; });
    document.addEventListener('mousedown',e=>{ if(!c.contains(e.target)) drop.style.display='none'; });
  },

  _hl(text, q){
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if(idx===-1) return text;
    return text.slice(0,idx)+`<span class="hl">${text.slice(idx,idx+q.length)}</span>`+text.slice(idx+q.length);
  },

  // Modal confirm using Promise
  confirm(title, msg, options = {}) {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'modal-backdrop sp-modal-container';
      
      const okText = options.okText || 'ยืนยัน';
      const okColor = options.okColor || '#3B82F6';
      
      el.innerHTML = `
        <div class="modal" style="max-width: 400px;">
          <div class="modal-header" style="border-bottom:none; padding-bottom:8px;">
            <h3 style="margin:0;font-size:18px;color:#1E293B">${title}</h3>
          </div>
          <div class="modal-body" style="padding-top:0;">
            <p style="color:#64748B; font-size:14px; margin-bottom: 24px; line-height: 1.5; white-space: pre-wrap;">${msg}</p>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
              <button class="btn-cancel" style="padding:10px 16px; border:1px solid #E2E8F0; background:#fff; color:#64748B; border-radius:8px; font-weight:600; cursor:pointer;">ยกเลิก</button>
              <button class="btn-ok" style="padding:10px 16px; border:none; background:${okColor}; color:#fff; border-radius:8px; font-weight:600; cursor:pointer;">${okText}</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(el);
      
      const close = (result) => {
        el.remove();
        resolve(result);
      };
      
      el.querySelector('.btn-cancel').addEventListener('click', () => close(false));
      el.querySelector('.btn-ok').addEventListener('click', () => close(true));
      el.addEventListener('click', e => { if(e.target===el) close(false); });
    });
  },

  fmtDate(ts){
    if(!ts) return '-';
    return new Date(ts).toLocaleDateString('th-TH');
  },

  fmtMoney(n){ return (n||0).toLocaleString(); },
  
  modal(title, contentHtml) {
    const el = document.createElement('div');
    el.className = 'modal-backdrop sp-modal-container';
    el.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 style="margin:0;font-size:16px;color:#1E293B">${title}</h3>
          <button class="modal-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94A3B8">&times;</button>
        </div>
        <div class="modal-body">
          ${contentHtml}
        </div>
      </div>
    `;
    document.body.appendChild(el);
    el.querySelector('.modal-close').addEventListener('click', () => el.remove());
    el.addEventListener('click', e => { if(e.target===el) el.remove(); });
  }
};