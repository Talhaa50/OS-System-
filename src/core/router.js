import { DB } from './db.js';
import { save } from './save.js';
import { $, html } from './utils.js';

export let _curPage = null;
export const PAGE_RENDERS = {};

export const VALID_PAGES = [
  'dashboard','todo','calendar','goals','projects','university',
  'finance','habits','deepwork','notes','books','pacman','analytics','settings'
];

export function registerRenderers(map) {
  Object.assign(PAGE_RENDERS, map);
}

export function navigate(pageId) {
  if (!VALID_PAGES.includes(pageId)) pageId = 'dashboard';
  const prev = _curPage;
  _curPage = pageId;

  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === pageId));

  const pageEl = $('page-'+pageId);
  if (pageEl) html('bc-page', pageEl.dataset.title || pageId);

  if (prev) {
    const prevEl = $('page-'+prev);
    if (prevEl && prevEl.classList.contains('active')) {
      prevEl.classList.add('page-out');
      setTimeout(()=>{ prevEl.classList.remove('active','page-out'); }, 160);
    }
  }

  const delay = prev ? 180 : 0;
  setTimeout(()=>{
    if (pageEl) {
      pageEl.classList.add('active','page-in');
      setTimeout(()=>pageEl.classList.remove('page-in'), 220);
    }
    if (PAGE_RENDERS[pageId]) PAGE_RENDERS[pageId]();
  }, delay);

  DB.lastPage = pageId;
  save();
}
