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

  // Generic confirm
  confirm(msg){ return window.confirm(msg); },

  fmtDate(ts){
    if(!ts) return '-';
    return new Date(ts).toLocaleDateString('th-TH');
  },

  fmtMoney(n){ return (n||0).toLocaleString(); },
};