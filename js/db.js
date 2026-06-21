/* eslint-disable */
// SmartProcure — DB (localStorage)

const DB_KEYS = { dailyPlans:'sp_daily_plans', batchOrders:'sp_batch_orders', menus:'sp_menus' };

const DB = {
  _get(key){ try{ return JSON.parse(localStorage.getItem(key)||'[]'); }catch{ return []; } },
  _set(key,val){ localStorage.setItem(key,JSON.stringify(val)); },
  _id(){ return 'id_'+Date.now()+'_'+Math.random().toString(36).slice(2,7); },

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

  // Menus
  getMenus(){ return this._get(DB_KEYS.menus); },
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