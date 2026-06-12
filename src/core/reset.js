import { DB } from './db.js';
import { save } from './save.js';
import { today, localISO, isoWeek, uid } from './utils.js';

export function dailyReset() {
  const t = today(), w = isoWeek();
  if (DB.lastDate !== t) {
    snapshotDay(DB.lastDate);
    DB.water = 0;
    DB.dw.todayMins = 0;
    DB.dw.sessCount = 0;
    DB.lastDate = t;
    recalcStreaks();
    addRecurring(t);
    save();
  }
  if (DB.lastWeek !== w) {
    DB.dw.weekMins = 0;
    DB.lastWeek = w;
    save();
  }
}

// Roll up the closing day's stats into DB.history so analytics can chart
// long-term trends (task state for that day is wiped/overwritten later).
function snapshotDay(dateStr) {
  if (!dateStr) return;
  if (!DB.history) DB.history = {};
  if (DB.history[dateStr]) return;
  const dName = new Date(dateStr).toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();
  const tasks = (DB.todoWeek||{})[dName] || [];
  const habits = DB.habits || [];
  DB.history[dateStr] = {
    tasksDone:   tasks.filter(x=>x.done).length,
    tasksTotal:  tasks.length,
    habitsDone:  habits.filter(h=>h.doneHistory && h.doneHistory[dateStr]).length,
    habitsTotal: habits.length,
    focusMins:   (DB.dw.dailyMins||{})[dateStr] || 0,
    water:       DB.water || 0
  };
}

export function recalcStreaks() {
  const t = today();
  (DB.habits||[]).forEach(h => {
    if (!h.doneHistory) h.doneHistory = {};
    let streak = 0;
    const d = new Date(t); d.setDate(d.getDate()-1);
    while (true) {
      const ds = localISO(d);
      if (h.doneHistory[ds]) { streak++; d.setDate(d.getDate()-1); } else break;
    }
    h.streak = streak;
  });
}

export function addRecurring(dateStr) {
  const dName = new Date(dateStr).toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();
  const rec   = DB.recurringTasks || {};
  if (rec[dName] && DB.todoWeek[dName]) {
    rec[dName].forEach(rt => {
      if (!DB.todoWeek[dName].find(x => x.text===rt.text)) {
        DB.todoWeek[dName].push({id:uid(), text:rt.text, done:false, repeat:true});
      }
    });
  }
}
