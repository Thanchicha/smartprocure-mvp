/* eslint-disable */
// SmartProcure — Auth 

const AUTH_KEY = 'sp_auth_v1';
const CREDENTIALS = [
  {username:'admin',password:'password',name:'Admin User'},
  {username:'chef',password:'chef1234',name:'Chef'},
  {username:'pakarang',password:'supply2024',name:'Pakarang Supply'},
];

const Auth = {
  login(username, password){
    const u = CREDENTIALS.find(c => c.username===username.trim() && c.password===password);
    if(u){
      const session = {username:u.username, name:u.name, loginAt:Date.now()};
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return {success:true, user:session};
    }
    return {success:false, error:'Username หรือ Password ไม่ถูกต้อง'};
  },
  logout(){
    localStorage.removeItem(AUTH_KEY);
  },
  getSession(){
    try{ return JSON.parse(localStorage.getItem(AUTH_KEY)||'null'); } catch{ return null; }
  },
  isAuthenticated(){
    return !!this.getSession();
  }
};