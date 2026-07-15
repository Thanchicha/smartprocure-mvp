/* eslint-disable */
// SmartProcure — DB (localStorage)

const DB_KEYS = { dailyPlans:'sp_daily_plans', batchOrders:'sp_batch_orders', menus:'sp_menus', profile:'sp_profile' };

const DB = {
  _get(key){
    const u = Auth.getSession()?.username || 'default';
    const actualKey = `${key}_${u}`;
    try{ return JSON.parse(localStorage.getItem(actualKey)||'[]'); }catch{ return []; }
  },
  _getObj(key){
    const u = Auth.getSession()?.username || 'default';
    const actualKey = `${key}_${u}`;
    try{ return JSON.parse(localStorage.getItem(actualKey)||'{}'); }catch{ return {}; }
  },
  _set(key,val){
    const u = Auth.getSession()?.username || 'default';
    const actualKey = `${key}_${u}`;
    localStorage.setItem(actualKey,JSON.stringify(val));
  },
  _id(){ return 'id_'+Date.now()+'_'+Math.random().toString(36).slice(2,7); },

  // Profile
  getProfile(){ return this._getObj(DB_KEYS.profile); },
  saveProfile(p){ this._set(DB_KEYS.profile, p); },

  // DailyPlans
  getPlans(){ return this._get(DB_KEYS.dailyPlans); },
  savePlan(plan){
    const plans = this.getPlans();
    if(plan.id){
      const idx = plans.findIndex(p=>p.id===plan.id);
      if(idx>-1) plans[idx]={...plans[idx],...plan,updated_date:Date.now()};
      else plans.unshift({...plan,updated_date:Date.now()});
    } else {
      plan.id = this._id();
      plan.created_date = Date.now();
      plan.updated_date = Date.now();
      plans.unshift(plan);
    }
    this._set(DB_KEYS.dailyPlans, plans);
    return plan;
  },
  deletePlan(id){
    const plans = this.getPlans().filter(p=>p.id!==id);
    this._set(DB_KEYS.dailyPlans, plans);
  },
  getPlan(id){ return this.getPlans().find(p=>p.id===id)||null; },

  // BatchOrders
  getOrders(){ return this._get(DB_KEYS.batchOrders); },
  saveOrder(order){
    const orders = this.getOrders();
    if(order.id){
      const idx = orders.findIndex(o=>o.id===order.id);
      if(idx>-1) orders[idx]={...orders[idx],...order,updated_date:Date.now()};
      else orders.unshift({...order,updated_date:Date.now()});
    } else {
      order.id = this._id();
      order.created_date = Date.now();
      order.updated_date = Date.now();
      orders.unshift(order);
    }
    this._set(DB_KEYS.batchOrders, orders);
    return order;
  },
  deleteOrder(id){
    const orders = this.getOrders().filter(o=>o.id!==id);
    this._set(DB_KEYS.batchOrders, orders);
  },
  getAllAdminOrders(){
    const prefix = DB_KEYS.batchOrders + '_';
    let all = [];
    for(let i=0; i<localStorage.length; i++){
      const k = localStorage.key(i);
      if(k.startsWith(prefix)){
        const tenant = k.substring(prefix.length);
        try {
          const tenantOrders = JSON.parse(localStorage.getItem(k)||'[]');
          tenantOrders.forEach(o => o._tenant = tenant);
          all = all.concat(tenantOrders);
        } catch(e){}
      }
    }
    return all.sort((a,b) => b.created_date - a.created_date);
  },

  getMenus(){
    const u = Auth.getSession()?.username || 'default';
    const initKey = `sp_menus_initialized_v2_${u}`;
    if(!localStorage.getItem(initKey)) {
      this._set(DB_KEYS.menus, DEFAULT_MENUS);
      localStorage.setItem(initKey, 'true');
    }
    return this._get(DB_KEYS.menus);
  },
  saveMenu(menu){
    const menus = this.getMenus();
    if(menu.id){
      const idx = menus.findIndex(m=>m.id===menu.id);
      if(idx>-1) menus[idx]={...menus[idx],...menu,updated_date:Date.now()};
      else menus.unshift({...menu,updated_date:Date.now()});
    } else {
      menu.id = this._id();
      menu.created_date = Date.now();
      menu.updated_date = Date.now();
      menus.unshift(menu);
    }
    this._set(DB_KEYS.menus, menus);
    return menu;
  },
  deleteMenu(id){
    const menus = this.getMenus().filter(m=>m.id!==id);
    this._set(DB_KEYS.menus, menus);
  },
};