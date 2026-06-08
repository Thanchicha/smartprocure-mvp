/**
 * auth.js — SmartProcure Authentication
 * Mock login (admin / password). Redirects between index.html ↔ dashboard.html.
 */

const AUTH_KEY  = 'sp_auth_v2';
const CREDS     = { username: 'admin', password: 'password' };

/* ── Session helpers ── */
function isLoggedIn() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY))?.ok === true; }
  catch { return false; }
}
function setSession()   { localStorage.setItem(AUTH_KEY, JSON.stringify({ ok: true })); }
function clearSession() { localStorage.removeItem(AUTH_KEY); }

/* ── Redirect guards ── */
(function guard() {
  const onDash  = location.pathname.includes('dashboard');
  const onLogin = !onDash;

  if (onDash && !isLoggedIn()) {
    location.replace('index.html');
  }
  if (onLogin && isLoggedIn()) {
    location.replace('dashboard.html');
  }
})();

/* ── Login handler (called by index.html form) ── */
function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('inp-user')?.value.trim();
  const pass = document.getElementById('inp-pass')?.value;
  const btn  = document.getElementById('login-btn');
  const err  = document.getElementById('login-err');

  if (!btn || !err) return;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  err.classList.add('hidden');

  setTimeout(() => {
    if (user === CREDS.username && pass === CREDS.password) {
      setSession();
      location.replace('dashboard.html');
    } else {
      err.classList.remove('hidden');
      btn.disabled  = false;
      btn.setAttribute('data-i18n', 'login.submit');
      btn.textContent = typeof t === 'function' ? t('login.submit') : 'เข้าสู่ระบบ';
    }
  }, 550);
}

/* ── Logout handler (called by dashboard.html) ── */
function handleLogout() {
  clearSession();
  location.replace('index.html');
}

/* ── Password toggle ── */
function togglePw() {
  const inp = document.getElementById('inp-pass');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}
