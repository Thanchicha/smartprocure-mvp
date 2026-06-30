/* eslint-disable */
// SmartProcure — App Entry

const PAGES = {
  'calculator': CalculatorPage,
  'daily-plans': DailyPlansPage,
  'batch-order': BatchOrderPage,
  'menus': MenusPage,
  'menu-select': MenuSelectPage,
  'order-history': OrderHistoryPage,
  'profile': ProfilePage,
  'admin-orders': AdminOrdersPage,
  'admin-dashboard': AdminDashboardPage,
};

let currentPage = 'calculator';

function showPage(name) {
  currentPage = name;
  // hide all subpages
  Object.keys(PAGES).forEach(k => {
    const el = document.getElementById(`subpage-${k}`);
    if(el) el.style.display = 'none';
  });
  const el = document.getElementById(`subpage-${name}`);
  if(el) el.style.display = '';

  // update nav active
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === name);
  });
  document.querySelectorAll('.mobile-nav .nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === name);
  });

  // render page
  PAGES[name].render(el);

  // close mobile menu
  const mob = document.getElementById('mobile-nav');
  if(mob) mob.style.display = 'none';
}

function initApp() {
  const session = Auth.getSession();
  document.getElementById('nav-username').textContent = session?.name || '';

  const isAdmin = session?.role === 'admin';
  document.querySelectorAll('.cust-link').forEach(el => el.style.display = isAdmin ? 'none' : '');
  document.querySelectorAll('.admin-link').forEach(el => el.style.display = isAdmin ? '' : 'none');

  // nav links
  document.querySelectorAll('.nav-link[data-page]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); showPage(a.dataset.page); });
  });

  // mobile menu
  const mobBtn = document.getElementById('mobile-menu-btn');
  const mobNav = document.getElementById('mobile-nav');
  if(mobBtn && mobNav) {
    // build mobile nav
    const custNav = {'daily-plans':'แผนรายวัน','batch-order':'Batch Order',menus:'เมนูอาหาร','order-history':'ประวัติสั่งซื้อ',profile:'โปรไฟล์'};
    const adminNav = {'admin-orders':'ออเดอร์ทั้งหมด','admin-dashboard':'สรุปวัตถุดิบ'};
    const navItems = isAdmin ? adminNav : custNav;
    mobNav.innerHTML = Object.entries(navItems).map(([k,v])=>`<a href="#" class="nav-link" data-page="${k}">${v}</a>`).join('');
    mobNav.querySelectorAll('.nav-link').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); showPage(a.dataset.page); });
    });
    mobBtn.addEventListener('click', () => {
      mobNav.style.display = mobNav.style.display === 'none' ? '' : 'none';
    });
  }

  // logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    Auth.logout();
    location.reload();
  });

  showPage(isAdmin ? 'admin-dashboard' : 'profile');
}

function initLogin() {
  const form = document.getElementById('login-form');
  const pwToggle = document.getElementById('toggle-pw');
  const pwInp = document.getElementById('login-pass');

  pwToggle?.addEventListener('click', () => {
    pwInp.type = pwInp.type === 'password' ? 'text' : 'password';
  });

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('login-user').value;
    const password = pwInp.value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    btn.textContent = 'กำลังเข้าสู่ระบบ...'; btn.disabled = true;
    setTimeout(() => {
      const result = Auth.login(username, password);
      if(result.success) {
        document.getElementById('page-login').style.display = 'none';
        document.getElementById('page-app').style.display = '';
        initApp();
      } else {
        errEl.textContent = result.error;
        errEl.style.display = '';
        btn.textContent = 'เข้าสู่ระบบ'; btn.disabled = false;
      }
    }, 400);
  });
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  if(Auth.isAuthenticated()) {
    document.getElementById('page-login').style.display = 'none';
    document.getElementById('page-app').style.display = '';
    initApp();
  } else {
    initLogin();
  }
});