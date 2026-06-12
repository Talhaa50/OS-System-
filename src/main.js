import { DB, loadDB } from './core/db.js';
import { save } from './core/save.js';
import { $, esc, val, clamp, pct, showToast } from './core/utils.js';
import { navigate, _curPage, VALID_PAGES, registerRenderers, PAGE_RENDERS } from './core/router.js';
import { dailyReset } from './core/reset.js';
import { openModal, saveModal, closeModalDirect, closeEditModal, saveEdit, confirmDelete } from './modals/index.js';
import { openGlobalSearch, closeGlobalSearch, runGlobalSearch, searchGo } from './search/index.js';
import { runMigrations } from './core/db.js';
import { updateFocusPill } from './pages/deepwork.js';

// Page renderers
import { rDashboard, dashToggleTask } from './pages/dashboard.js';
import { rHabits, toggleHabit, editHabit, delHabit } from './pages/habits.js';
import { rTodo, toggleTask, addTask, delTask, saveNTF, delNTF } from './pages/todo.js';
import { rFinance, editBudget, editExpense, delExpense } from './pages/finance.js';
import { rGoals, updateGoalPct, markGoalDone, reopenGoal, editGoal, delGoal } from './pages/goals.js';
import { rProjects, openProj, toggleProjTodo, addProjTodo, delProjTodo, editProj, delProj } from './pages/projects.js';
import { rCalendar, calNav, calNavToday, delCalEv } from './pages/calendar.js';
import { rUniversity, c_upd, c_updGrade, c_updItem, c_addItem, c_delItem, toggleCourse, setCourseTab, delTT, delSemHist } from './pages/university.js';
import { rDeepwork, applyDwSettings, setDwMode, toggleDwTimer, resetDwTimer, skipDwSession, toggleMonk, dwToggle } from './pages/deepwork.js';
import { rNotes, rNotesList, selNote, addNote, autoSaveNote, updNoteWC, deleteActiveNote } from './pages/notes.js';
import { rBooks, filterBooks, selectBook, updateBookPage, saveBookNotes, addBookQuote, delBookQuote } from './pages/books.js';
import { rAnalytics } from './pages/analytics.js';
import { rPacman, pacToggle, pacRestart } from './pages/pacman.js';
import { rSettings, updateUserName, updateUserStatus, expAll, impAll, expCSV, expFin, printWeeklySummary, clearAll } from './pages/settings.js';
import { setWater } from './widgets/water.js';
import { updateCountdown, setCountdownMode } from './widgets/countdown.js';
import { openZoom, closeZoom } from './widgets/zoom.js';
import { toggleNotifs, closeNotifs, updateNotifBadge } from './widgets/notifications.js';

// Wire up router
registerRenderers({
  dashboard:  rDashboard,
  todo:       rTodo,
  calendar:   rCalendar,
  goals:      rGoals,
  projects:   rProjects,
  university: rUniversity,
  finance:    rFinance,
  habits:     rHabits,
  deepwork:   rDeepwork,
  notes:      rNotes,
  books:      rBooks,
  pacman:     rPacman,
  analytics:  rAnalytics,
  settings:   rSettings
});

// Clock tick (also watches for the midnight rollover — without this,
// daily stats only reset on a page reload, not while the app stays open)
let _tickDay = null;
function tick() {
  const now = new Date();
  const dayKey = now.toDateString();
  if (_tickDay && _tickDay !== dayKey) {
    dailyReset();
    if (_curPage && PAGE_RENDERS[_curPage]) PAGE_RENDERS[_curPage]();
  }
  _tickDay = dayKey;
  const h = now.getHours(), m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  const ts   = `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
  const clk  = $('tb-clock'); if (clk) clk.textContent = ts;
  const hd   = $('hero-date');
  if (hd) hd.textContent = now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const gr = $('hero-greeting');
  if (gr) gr.textContent = h<12?'Good morning,':(h<17?'Good afternoon,':'Good evening,');
  const hn = $('hero-name'); if (hn) hn.textContent = DB.username||'Zyrax';
  updateCountdown();
  if (now.getSeconds() === 0) updateNotifBadge();   // refresh badge once a minute
}
setInterval(tick, 1000);

// Surface runtime errors instead of failing silently to a blank page
window.addEventListener('error', e => {
  showToast('⚠ Error: ' + (e.message || 'unknown'));
});

// Warn when a second tab opens — both tabs hold DB in memory and the
// last one to save silently overwrites the other's changes.
try {
  const bc = new BroadcastChannel('pos4_tab');
  bc.onmessage = e => {
    if (e.data === 'hello') bc.postMessage('taken');
    if (e.data === 'taken') showToast('⚠ Personal OS is open in another tab — use one tab to avoid losing changes');
  };
  bc.postMessage('hello');
} catch (e) {}

// Offline support / installable app (production builds only)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(()=>{});
}

// Theme (dark default / Pirsch-style light)
function applyTheme() {
  const light = DB.theme === 'light';
  document.documentElement.classList.toggle('light', light);
  const moon = $('theme-icon-moon'); if (moon) moon.style.display = light ? 'none' : '';
  const sun  = $('theme-icon-sun');  if (sun)  sun.style.display  = light ? '' : 'none';
}
function toggleTheme() {
  DB.theme = DB.theme === 'light' ? 'dark' : 'light';
  save(); applyTheme();
}

// pos:saveEdit handler
document.addEventListener('pos:saveEdit', e=>{
  const {type,id}=e.detail;
  if(type==='habit') {
    const h=DB.habits.find(x=>x.id==id); if(!h) return;
    h.icon=val('eh_icon')||h.icon; h.name=val('eh_name')||h.name; h.color=val('eh_color')||h.color;
    save(); closeEditModal(); rHabits(); if(_curPage==='dashboard')rDashboard(); showToast('Habit updated!');
  }
  if(type==='goal') {
    const g=DB.goals.find(x=>x.id==id); if(!g) return;
    if(val('eg_icon'))  g.icon=val('eg_icon');
    if(val('eg_title')) g.title=val('eg_title');
    g.cat=val('eg_cat')||g.cat;
    if(val('eg_status'))   g.status=val('eg_status');
    g.deadline=val('eg_deadline');
    const tv=parseFloat(val('eg_target'))||null;
    const cv=parseFloat(val('eg_current'))||0;
    if(tv){ g.targetVal=tv; g.currentVal=cv; g.pct=pct(cv,tv); }
    save(); closeEditModal(); rGoals(); showToast('Goal updated!');
  }
  if(type==='project') {
    const p=DB.projects.find(x=>x.id==id); if(!p) return;
    if(val('ep_name'))   p.name=val('ep_name');
    if(val('ep_client')) p.client=val('ep_client');
    const cv=parseFloat(val('ep_value')); if(!isNaN(cv)) p.contractValue=cv;
    const pv=parseFloat(val('ep_paid'));  if(!isNaN(pv)) p.paidAmount=pv;
    const pr=parseInt(val('ep_progress')); if(!isNaN(pr)) p.progress=clamp(pr,0,100);
    if(val('ep_status'))   p.status=val('ep_status');
    if(val('ep_deadline')) p.deadline=val('ep_deadline');
    p.notes=val('ep_notes');
    save(); closeEditModal(); rProjects(); showToast('Project updated!');
  }
  if(type==='expense') {
    const t=DB.transactions.find(x=>x.id==id); if(!t) return;
    if(val('ee_name')) t.name=val('ee_name');
    const av=parseFloat(val('ee_amount')); if(!isNaN(av)) t.amount=av;
    t.cat=val('ee_cat')||t.cat; t.date=val('ee_date')||t.date;
    save(); closeEditModal(); rFinance(); showToast('Transaction updated!');
  }
});

document.addEventListener('pos:deleteItem', e=>{
  const {type,id}=e.detail;
  // soft delete: keep the item + position so the toast's Undo can restore it
  const CFG={
    habit:   {arr:'habits',       label:'Habit',       rerender:()=>{ rHabits(); if(_curPage==='dashboard')rDashboard(); }},
    goal:    {arr:'goals',        label:'Goal',        rerender:rGoals},
    project: {arr:'projects',     label:'Project',     rerender:rProjects},
    expense: {arr:'transactions', label:'Transaction', rerender:rFinance}
  };
  const cfg=CFG[type]; if(!cfg) return;
  const idx=DB[cfg.arr].findIndex(x=>x.id==id); if(idx<0) return;
  const item=DB[cfg.arr][idx];
  DB[cfg.arr]=DB[cfg.arr].filter(x=>x.id!=id);
  if(type==='project') DB.openProjectId=null;
  save(); cfg.rerender();
  showToast(cfg.label+' deleted', { label:'Undo', fn:()=>{
    DB[cfg.arr].splice(Math.min(idx,DB[cfg.arr].length),0,item);
    save(); cfg.rerender(); showToast(cfg.label+' restored');
  }});
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  const tag  = document.activeElement?.tagName;
  const busy = ['INPUT','TEXTAREA','SELECT'].includes(tag) || document.activeElement?.isContentEditable;
  if (e.key === 'Escape') {
    if (closeZoom())   return;
    if (closeNotifs()) return;
    if ($('search-overlay').classList.contains('open'))    { closeGlobalSearch();  return; }
    if ($('editModalOverlay').classList.contains('open'))  { closeEditModal();     return; }
    if ($('modalOverlay').classList.contains('open'))      { closeModalDirect();   return; }
  }
  if ((e.ctrlKey&&e.key==='k')||(!busy&&e.key==='/')) { e.preventDefault(); openGlobalSearch(); return; }
  if (!busy) {
    const map={'1':'dashboard','2':'todo','3':'habits','4':'finance','5':'goals',
               '6':'projects','7':'university','8':'deepwork','9':'notes','0':'analytics'};
    if (map[e.key]) { navigate(map[e.key]); return; }
    if (e.key===' ' && _curPage!=='pacman') { e.preventDefault(); dwToggle(); }
    if (e.key==='b'||e.key==='B') $('sb-toggle').click();
  }
});

// Event delegation
document.addEventListener('click', e => {
  const ni = e.target.closest('.nav-item');
  if (ni && ni.dataset.page) navigate(ni.dataset.page);
});
$('sb-toggle').addEventListener('click', ()=>$('sidebar').classList.toggle('collapsed'));
$('theme-toggle').addEventListener('click', toggleTheme);
$('search-btn').addEventListener('click', openGlobalSearch);
$('search-input').addEventListener('input', e=>runGlobalSearch(e.target.value));
document.addEventListener('click', e=>{
  if(e.target===$('search-overlay'))    closeGlobalSearch();
  if(e.target===$('modalOverlay'))      closeModalDirect();
  if(e.target===$('editModalOverlay'))  closeEditModal();
  if(!e.target.closest('#notif-panel')&&!e.target.closest('#notif-btn')) closeNotifs();
});
// double-click the zoom backdrop to close fullscreen view
$('zoom-overlay').addEventListener('dblclick', e=>{ if(e.target===$('zoom-overlay')) closeZoom(); });

// Expose all globals for inline onclick handlers
Object.assign(window, {
  // core
  DB, save, navigate,
  // modals
  openModal, saveModal, closeModalDirect, closeEditModal, saveEdit, confirmDelete,
  // search
  openGlobalSearch, closeGlobalSearch, runGlobalSearch, searchGo,
  // habits
  rHabits, toggleHabit, editHabit, delHabit,
  // dashboard
  rDashboard, dashToggleTask,
  // todo
  rTodo, toggleTask, addTask, delTask, saveNTF, delNTF,
  // finance
  rFinance, editBudget, editExpense, delExpense,
  // goals
  rGoals, updateGoalPct, markGoalDone, reopenGoal, editGoal, delGoal,
  // projects
  rProjects, openProj, toggleProjTodo, addProjTodo, delProjTodo, editProj, delProj,
  // calendar
  rCalendar, calNav, calNavToday, delCalEv,
  // university
  rUniversity, c_upd, c_updGrade, c_updItem, c_addItem, c_delItem, toggleCourse, setCourseTab, delTT, delSemHist,
  // deepwork
  rDeepwork, applyDwSettings, setDwMode, toggleDwTimer, resetDwTimer, skipDwSession, toggleMonk, dwToggle,
  // notes
  rNotes, rNotesList, selNote, addNote, autoSaveNote, updNoteWC, deleteActiveNote,
  // books
  rBooks, filterBooks, selectBook, updateBookPage, saveBookNotes, addBookQuote, delBookQuote,
  // analytics
  rAnalytics,
  // settings
  rSettings, updateUserName, updateUserStatus, expAll, impAll, expCSV, expFin, printWeeklySummary, clearAll,
  // water
  setWater,
  // countdown
  setCountdownMode,
  // pacman
  rPacman, pacToggle, pacRestart,
  // zoom + notifications
  openZoom, closeZoom, toggleNotifs,
  // clock
  tick,
  // showToast
  showToast
});

// Expose _curPage as a live getter (used in inline onclick strings)
Object.defineProperty(window, '_curPage', { get: () => _curPage, configurable: true });

// Boot
(function boot() {
  loadDB();
  runMigrations();
  dailyReset();
  applyTheme();

  DB.dw.running = false;

  const name    = DB.username||'Zyrax';
  const initial = name.charAt(0).toUpperCase();
  const sn=$('sb-name');    if(sn) sn.textContent=name;
  const sa=$('sb-avatar');  if(sa) sa.textContent=initial;
  const ta=$('tb-avatar');  if(ta) ta.textContent=initial;
  const us=document.querySelector('.u-status'); if(us) us.textContent=DB.userStatus||'Deep Work Active';
  updateFocusPill();

  document.querySelectorAll('.nav-item').forEach(ni=>{
    const lbl=ni.querySelector('.nav-label');
    if(lbl) ni.setAttribute('data-tip', lbl.textContent);
  });

  tick();
  updateNotifBadge();
  navigate(VALID_PAGES.includes(DB.lastPage)?DB.lastPage:'dashboard');

  // Backup nag: localStorage is fragile (browser data clears wipe it) —
  // remind weekly if there's meaningful data and no recent export.
  const hasData = (DB.habits||[]).length || (DB.notes||[]).length || (DB.transactions||[]).length;
  if (hasData && (!DB.lastBackup || Date.now()-DB.lastBackup > 7*86400000)) {
    setTimeout(()=>showToast('💾 No backup in 7+ days — Settings → Export All Data'), 4000);
  }
  console.log('%c Personal OS v1.0  booted ✓','color:#22c55e;font-weight:800;font-size:13px;background:#080c08;padding:4px 8px;');
})();
