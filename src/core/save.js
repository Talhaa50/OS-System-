import { DB } from './db.js';
import { $, showToast } from './utils.js';

let _saveTimer = null;
let _warnedFail = false;

export function save() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(_doSave, 400);
}

// Flush pending debounced save immediately (called on tab close).
export function flushSave() {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; _doSave(); }
}

function _doSave() {
  _saveTimer = null;
  let failed = false;
  const keys = ['habits','water','todoWeek','ntfItems','transactions','subscriptions','goals',
    'projects','courses','timetable','semesterHistory','calEvents','notes','books','quotes',
    'dw','calYear','calMonth','activeNote','quoteIdx','todoNextId','ntfNextId','openProjectId',
    'openCourseId','activeSem','openCourseTab','activeBook','bookFilter','recurringTasks',
    'journal','budgets','username','userStatus','lastPage','lastDate','lastWeek','projView',
    'theme','countdownMode','history','pacHigh','lastBackup'];
  keys.forEach(k => { try { localStorage.setItem('pos4_'+k, JSON.stringify(DB[k])); } catch(e) { failed = true; } });
  try {
    localStorage.setItem('pos4_dwTodayMins', JSON.stringify(DB.dw.todayMins));
    localStorage.setItem('pos4_dwWeekMins',  JSON.stringify(DB.dw.weekMins));
    localStorage.setItem('pos4_dwAllMins',   JSON.stringify(DB.dw.allMins));
    localStorage.setItem('pos4_dwLog',       JSON.stringify((DB.dw.log||[]).slice(-500)));
    localStorage.setItem('pos4_dwDailyMins', JSON.stringify(DB.dw.dailyMins));
  } catch(e) { failed = true; }
  if (failed && !_warnedFail) {
    _warnedFail = true;
    showToast('⚠ SAVE FAILED — storage may be full. Export a backup now!');
  }
  if (!failed) _warnedFail = false;
  const dot = $('save-dot');
  if (dot) { dot.classList.remove('flash'); void dot.offsetWidth; dot.classList.add('flash'); }
}

// Don't lose the last edit if the tab closes within the debounce window.
window.addEventListener('beforeunload', flushSave);
