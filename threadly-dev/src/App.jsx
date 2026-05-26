import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

// ─── GSAP motion helpers ───────────────────────────────────────────────────────

function motionOk() {
  return typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function taskEl(taskId) {
  return document.querySelector(`[data-task-id="${taskId}"]`);
}

function calDayEl(dayIndex) {
  return document.querySelector(`[data-cal-day="${dayIndex}"]`);
}

function animateTaskEnter(taskId) {
  if (!motionOk()) return;
  requestAnimationFrame(() => {
    const el = taskEl(taskId);
    if (!el) return;
    gsap.from(el, {
      scale: 0.55,
      opacity: 0,
      y: 24,
      duration: 0.55,
      ease: 'back.out(1.7)',
      clearProps: 'scale,opacity,y',
    });
  });
}

function animateTaskExit(taskId, onComplete) {
  const el = taskEl(taskId);
  if (!motionOk() || !el) {
    onComplete();
    return;
  }
  gsap.to(el, {
    scale: 0.35,
    opacity: 0,
    y: 36,
    duration: 0.32,
    ease: 'power2.in',
    onComplete,
  });
}

function animateMarkDone(taskId) {
  if (!motionOk()) return;
  requestAnimationFrame(() => {
    const el = taskEl(taskId);
    if (!el) return;
    gsap.timeline()
      .to(el, { scale: 1.06, duration: 0.12, ease: 'power2.out' })
      .to(el, { scale: 1, duration: 0.38, ease: 'elastic.out(1, 0.55)' });
  });
}

function animateCanvasSettle(taskId) {
  if (!motionOk()) return;
  requestAnimationFrame(() => {
    const el = taskEl(taskId);
    if (!el) return;
    gsap.fromTo(
      el,
      { y: 10, scale: 0.96 },
      { y: 0, scale: 1, duration: 0.42, ease: 'elastic.out(1, 0.65)', clearProps: 'scale,y' },
    );
  });
}

function animateScheduleFly(taskId, dayIndex, onComplete) {
  const card = taskEl(taskId);
  const day = calDayEl(dayIndex);
  if (!motionOk() || !card || !day) {
    onComplete();
    return;
  }
  const cardRect = card.getBoundingClientRect();
  const dayRect = day.getBoundingClientRect();
  const ghost = card.cloneNode(true);
  ghost.removeAttribute('data-task-id');
  ghost.querySelectorAll('button').forEach(b => b.remove());
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${cardRect.left}px`,
    top: `${cardRect.top}px`,
    width: `${cardRect.width}px`,
    margin: 0,
    zIndex: 10001,
    pointerEvents: 'none',
  });
  document.body.appendChild(ghost);
  gsap.to(ghost, {
    left: dayRect.left + dayRect.width / 2 - cardRect.width / 2,
    top: dayRect.top + 10,
    scale: 0.32,
    opacity: 0.9,
    duration: 0.58,
    ease: 'power3.inOut',
    onComplete: () => {
      gsap.to(ghost, {
        opacity: 0,
        scale: 0.15,
        duration: 0.16,
        onComplete: () => {
          ghost.remove();
          onComplete();
        },
      });
    },
  });
}

function animateNotepadOpen(overlay, paper) {
  if (!motionOk() || !overlay || !paper) return;
  gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.22 });
  gsap.from(paper, {
    scale: 0.9,
    y: 28,
    rotation: -3,
    opacity: 0,
    duration: 0.42,
    ease: 'power3.out',
    clearProps: 'scale,y,rotation,opacity',
  });
}

function animateNotepadClose(overlay, paper, onComplete) {
  if (!motionOk() || !overlay || !paper) {
    onComplete();
    return;
  }
  gsap.timeline({ onComplete })
    .to(paper, { scale: 0.92, y: 16, rotation: 2, opacity: 0, duration: 0.26, ease: 'power2.in' })
    .to(overlay, { opacity: 0, duration: 0.18 }, '-=0.08');
}

function animateTasksStaggerIn() {
  if (!motionOk()) return;
  requestAnimationFrame(() => {
    const els = document.querySelectorAll('[data-task-id]');
    if (!els.length) return;
    gsap.from(els, {
      scale: 0.5,
      opacity: 0,
      y: 28,
      stagger: 0.06,
      duration: 0.48,
      ease: 'back.out(1.35)',
      clearProps: 'scale,opacity,y',
    });
  });
}

function animateTasksStaggerOut(onComplete) {
  const els = document.querySelectorAll('[data-task-id]');
  if (!motionOk() || !els.length) {
    onComplete();
    return;
  }
  gsap.to(els, {
    scale: 0.55,
    opacity: 0,
    y: -18,
    stagger: 0.035,
    duration: 0.26,
    ease: 'power2.in',
    onComplete,
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = {
  cream: '#F5EFE3',
  charcoal: '#23201D',
  burgundy: '#6E1F2B',
  orange: '#E85D04',
  teal: '#5FB3B3',
  mustard: '#F3B23C',
  pink: '#E9A6A6',
  green: '#8FAF87',
};

// Verified bg → text pairs (WCAG AA on small UI type). Never pair cream with light accents.
const ACCESSIBLE_TEXT = {
  [BRAND.mustard]: BRAND.charcoal,
  [BRAND.pink]: BRAND.burgundy,
  [BRAND.green]: BRAND.charcoal,
  [BRAND.teal]: BRAND.charcoal,
  [BRAND.cream]: BRAND.charcoal,
  [BRAND.burgundy]: BRAND.cream,
  [BRAND.orange]: BRAND.cream,
  [BRAND.charcoal]: BRAND.cream,
};

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]) {
  const linear = [r, g, b].map(c => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(hexToRgb(fg));
  const l2 = relativeLuminance(hexToRgb(bg));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function textColorForBg(bg) {
  if (!bg) return BRAND.cream;
  const key = Object.keys(ACCESSIBLE_TEXT).find(k => k.toLowerCase() === bg.toLowerCase());
  if (key) return ACCESSIBLE_TEXT[key];
  const candidates = [BRAND.charcoal, BRAND.cream, BRAND.burgundy];
  return candidates.reduce((best, c) => (
    contrastRatio(c, bg) > contrastRatio(best, bg) ? c : best
  ), BRAND.charcoal);
}

function surfacePair(bg) {
  return { color: bg, textColor: textColorForBg(bg) };
}

const CANVAS_LAYER_DEFAULT = { washi: 2, deco: 5, task: 10 };

function resolveCanvasLayer(item, kind) {
  return item?.layer ?? CANVAS_LAYER_DEFAULT[kind];
}

function maxCanvasLayer(tasks, washi, decoStickers) {
  const all = [
    ...tasks.map(t => resolveCanvasLayer(t, 'task')),
    ...washi.map(w => resolveCanvasLayer(w, 'washi')),
    ...decoStickers.map(s => resolveCanvasLayer(s, 'deco')),
  ];
  return all.length ? Math.max(...all) : CANVAS_LAYER_DEFAULT.task;
}

function minCanvasLayer(tasks, washi, decoStickers) {
  const all = [
    ...tasks.map(t => resolveCanvasLayer(t, 'task')),
    ...washi.map(w => resolveCanvasLayer(w, 'washi')),
    ...decoStickers.map(s => resolveCanvasLayer(s, 'deco')),
  ];
  return all.length ? Math.min(...all) : CANVAS_LAYER_DEFAULT.washi;
}

const ROTATION_CLASSES = ['', 'rotate-m1', 'rotate-p1', 'rotate-m05', 'rotate-p05', 'rotate-p15'];

const ACCENT_PALETTE = [
  surfacePair(BRAND.mustard),
  surfacePair(BRAND.pink),
  surfacePair(BRAND.green),
  surfacePair(BRAND.teal),
  surfacePair(BRAND.cream),
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfWeekMonday(from = new Date()) {
  const date = new Date(from);
  const dow = date.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function localIso(year, month, dayOfMonth) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
}

function buildWeekDays(weekOffset = 0) {
  const start = startOfWeekMonday(new Date());
  start.setDate(start.getDate() + weekOffset * 7);
  return DAY_NAMES.map((dayName, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      day: dayName,
      date: String(d.getDate()),
      month: d.getMonth(),
      year: d.getFullYear(),
      iso: localIso(d.getFullYear(), d.getMonth(), d.getDate()),
    };
  });
}

function isTodayDay(day) {
  const today = new Date();
  return day.year === today.getFullYear()
    && day.month === today.getMonth()
    && Number(day.date) === today.getDate();
}

function buildWeekCalendar(weekOffset = 0, entriesByDay = null) {
  return buildWeekDays(weekOffset).map(d => ({
    ...d,
    entries: entriesByDay?.[d.day] ?? [],
  }));
}

function formatWeekRange(weekOffset = 0) {
  const days = buildWeekDays(weekOffset);
  const first = days[0];
  const last = days[6];
  const fDate = new Date(first.year, first.month, Number(first.date));
  const lDate = new Date(last.year, last.month, Number(last.date));
  if (fDate.getMonth() === lDate.getMonth()) {
    return `${MONTH_NAMES[fDate.getMonth()]} ${fDate.getDate()} – ${lDate.getDate()}, ${fDate.getFullYear()}`;
  }
  return `${MONTH_NAMES[fDate.getMonth()]} ${fDate.getDate()} – ${MONTH_NAMES[lDate.getMonth()]} ${lDate.getDate()}, ${lDate.getFullYear()}`;
}

function weekNavLabel(weekOffset = 0) {
  if (weekOffset === -1) return 'Last week';
  if (weekOffset === 0) return 'Current week';
  if (weekOffset === 1) return 'Upcoming week';
  return null;
}

const BLANK_CALENDAR = buildWeekCalendar(0);

const TIME_OPTIONS = ['30 min', '1 hr', '2 hrs', '3 hrs', '4 hrs', '5 hrs', '6+ hrs'];

const SLOT_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Anytime'];

const CARD_MIN_W = 120;
const CARD_MAX_W = 240;
const CARD_MIN_H = 100;

function estimateTaskCardH(task) {
  const titleExtra = Math.ceil(((task.title || '').length) / 26) * 17;
  const noteExtra = Math.ceil(((task.note || '').length) / 34) * 16;
  let h = CARD_MIN_H + titleExtra + noteExtra;
  if (task.scheduledDay) h += 16;
  if (task.deadline && task.deadline !== task.scheduledDay) h += 16;
  if (task.status !== 'done') h += 36;
  return Math.min(h, 340);
}

const TASK_CARD_SIZE = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 6,
  width: 'max-content',
  minWidth: CARD_MIN_W,
  maxWidth: CARD_MAX_W,
  boxSizing: 'border-box',
};

function computeCanvasH(tasks, washi, decoStickers) {
  return Math.max(
    520,
    ...tasks.map(t => (t.y ?? 0) + estimateTaskCardH(t) + 48),
    ...washi.map(w => (w.y ?? 0) + 40),
    ...decoStickers.map(s => (s.y ?? 0) + 48),
    520,
  );
}

function calDayIndexFromPoint(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY)?.closest('[data-cal-day]');
  if (!el) return null;
  const idx = Number(el.dataset.calDay);
  return Number.isNaN(idx) ? null : idx;
}

const WASHI_PALETTE = [
  { pattern: 'stripe', color: '#E9A6A6', opacity: 0.85, label: 'Pink' },
  { pattern: 'dots',   color: '#F3B23C', opacity: 0.8,  label: 'Mustard' },
  { pattern: 'grid',   color: '#5FB3B3', opacity: 0.75, label: 'Teal' },
  { pattern: 'stripe', color: '#8FAF87', opacity: 0.8,  label: 'Sage' },
  { pattern: 'dots',   color: '#E85D04', opacity: 0.7,  label: 'Orange' },
];

const STICKER_PNG_ASSETS = [
  { id: 'sticker-01', src: '/stickers/sticker-01.png', label: 'Showed up' },
  { id: 'sticker-02', src: '/stickers/sticker-02.png', label: 'Sticker 2' },
  { id: 'sticker-03', src: '/stickers/sticker-03.png', label: 'Sticker 3' },
  { id: 'sticker-04', src: '/stickers/sticker-04.png', label: 'Sticker 4' },
  { id: 'sticker-05', src: '/stickers/sticker-05.png', label: 'Sticker 5' },
  { id: 'sticker-06', src: '/stickers/sticker-06.png', label: 'Sticker 6' },
  { id: 'sticker-07', src: '/stickers/sticker-07.png', label: 'Sticker 7' },
  { id: 'sticker-08', src: '/stickers/sticker-08.png', label: 'Sticker 8' },
  { id: 'sticker-09', src: '/stickers/sticker-09.png', label: 'Sticker 9' },
  { id: 'sticker-10', src: '/stickers/sticker-10.png', label: 'Sticker 10' },
  { id: 'sticker-11', src: '/stickers/sticker-11.png', label: 'Sticker 11' },
  { id: 'sticker-12', src: '/stickers/sticker-12.png', label: 'Sticker 12' },
];

const URGENCY_OPTIONS = [
  { value: 'low',      label: 'Low',      color: '#8FAF87' },
  { value: 'medium',   label: 'Medium',   color: '#5FB3B3' },
  { value: 'high',     label: 'High',     color: '#F3B23C' },
  { value: 'critical', label: 'Critical', color: '#E85D04' },
];

const DEADLINE_OPTIONS_BASE = [{ value: '', label: 'No deadline' }];

const DEFAULT_TASK_FORM = { title: '', note: '', time: '1 hr', urgency: 'medium', deadline: '' };

const AI_MESSAGES = {
  empty: [
    'Name your project in the orange panel on the left.',
  ],
  default: [
    'Your flow looks solid. Two deep-work blocks should carry you through.',
    'Protect the middle cards — that\'s where plans usually slip.',
    'One card at a time.',
  ],
  realityCheck: [
    'Honest take: the build card is probably underestimated.',
    'Reduce scope or block extra time before the deadline.',
    'Consider deferring the last card to next week.',
  ],
  replan: [
    'Timeline reshuffled. Things moved to give you breathing room.',
    'Let\'s re-route, not panic. New path is still viable.',
    'Big picture is still alive. You have runway.',
  ],
  interruption: [
    'Life happened — and that\'s okay.',
    'Wednesday blocked. Shifted to Thursday.',
    'The flow is resilient. We\'ll pick up Friday.',
  ],
};

// ─── Project factory ──────────────────────────────────────────────────────────

function makeProject(id) {
  const cal = buildWeekCalendar(0);
  return {
    id, name: '', tasks: [],
    calendar: cal,
    calendarWeeks: { '0': cal },
    weekOffset: 0,
    washi: [], decoStickers: [], canvasLinks: [],
    interruption: false,
  };
}

function normalizeCalEntry(entry) {
  const color = entry.color ?? BRAND.teal;
  return {
    ...entry,
    color,
    textColor: entry.textColor ?? textColorForBg(color),
  };
}

function migrateCalendarDay(day) {
  if (day.entries) {
    return { ...day, entries: day.entries.map(normalizeCalEntry) };
  }
  const entries = (day.tasks || []).map((label, j) => normalizeCalEntry({
    taskId: null,
    label,
    color: day.colors?.[j] ?? BRAND.teal,
    slot: '',
    duration: '',
  }));
  const { tasks, colors, ...rest } = day;
  return { ...rest, entries };
}

function ensureTaskXY(task, index) {
  if (task.x != null && task.y != null) return task;
  return { ...task, x: 24 + (index % 4) * 155, y: 24 + Math.floor(index / 4) * 175 };
}

function migrateProject(p) {
  const { stamps: _stamps, goal: _goal, ...rest } = p;
  const weekOffset = p.weekOffset ?? 0;
  const rawWeeks = p.calendarWeeks ?? {};
  const weekKeys = new Set([
    ...Object.keys(rawWeeks),
    String(weekOffset),
    '-1', '0', '1',
  ]);
  const calendarWeeks = {};
  weekKeys.forEach(key => {
    const offset = Number(key);
    if (Number.isNaN(offset)) return;
    const stored = rawWeeks[key] ?? (offset === weekOffset ? p.calendar : null);
    calendarWeeks[key] = syncWeekCalendar(stored, offset).map(migrateCalendarDay);
  });
  return {
    ...rest,
    weekOffset,
    calendarWeeks,
    tasks: (p.tasks || []).map((t, i) => {
      const task = ensureTaskXY(t, i);
      return {
        ...task,
        onCanvas: task.onCanvas !== false,
        textColor: task.textColor ?? textColorForBg(task.color),
      };
    }),
    washi: p.washi || [],
    decoStickers: p.decoStickers || [],
    canvasLinks: p.canvasLinks || [],
    calendar: calendarWeeks[String(weekOffset)] ?? syncWeekCalendar(p.calendar, weekOffset).map(migrateCalendarDay),
  };
}

function taskAnchor(task, side = 'center') {
  const el = document.querySelector(`[data-task-id="${task.id}"]`);
  const canvas = el?.closest('.free-canvas');
  if (el && canvas) {
    const cRect = canvas.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const left = eRect.left - cRect.left + canvas.scrollLeft;
    const top = eRect.top - cRect.top + canvas.scrollTop;
    const w = eRect.width;
    const h = eRect.height;
    if (side === 'right') return { x: left + w, y: top + h / 2 };
    if (side === 'left') return { x: left, y: top + h / 2 };
    return { x: left + w / 2, y: top + h / 2 };
  }
  const x = task.x ?? 0;
  const y = task.y ?? 0;
  const h = estimateTaskCardH(task);
  if (side === 'right') return { x: x + CARD_MAX_W, y: y + h / 2 };
  if (side === 'left') return { x, y: y + h / 2 };
  return { x: x + CARD_MAX_W / 2, y: y + h / 2 };
}

function washiBackground(w) {
  if (w.pattern === 'dots') return `radial-gradient(circle, rgba(35,32,29,0.12) 1px, transparent 1px)`;
  if (w.pattern === 'grid') return `linear-gradient(rgba(35,32,29,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(35,32,29,0.08) 1px, transparent 1px)`;
  return `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(35,32,29,0.1) 3px, rgba(35,32,29,0.1) 6px)`;
}

function sameTaskId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function isOnCanvas(task) {
  return task?.onCanvas !== false;
}

function getCalEntries(day) {
  if (day.entries) return day.entries.map(normalizeCalEntry);
  return (day.tasks || []).map((label, j) => normalizeCalEntry({
    taskId: null,
    label,
    color: day.colors?.[j] ?? BRAND.teal,
    slot: '',
    duration: '',
  }));
}

function orphanCalendarEntries(days, taskId) {
  return days.map(d => ({
    ...d,
    entries: getCalEntries(d).map(e => (sameTaskId(e.taskId, taskId) ? { ...e, taskId: null } : e)),
  }));
}

function syncWeekCalendar(storedDays, weekOffset = 0) {
  const fresh = buildWeekCalendar(weekOffset);
  if (!storedDays?.length) return fresh;
  return fresh.map((day, i) => {
    const stored = storedDays[i];
    if (!stored) return day;
    return {
      ...day,
      entries: getCalEntries(stored),
      isInterruption: stored.isInterruption ?? false,
    };
  });
}

function dayLabel(day) {
  return `${day.day} ${day.date}`;
}

function timeToSeconds(timeStr) {
  if (!timeStr) return 3600;
  if (timeStr.includes('min')) return 30 * 60;
  if (timeStr.includes('6+')) return 6 * 3600;
  const n = parseInt(timeStr, 10);
  return (Number.isNaN(n) ? 1 : n) * 3600;
}

function formatTimerDisplay(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─── FontLink ─────────────────────────────────────────────────────────────────

function FontLink() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400&family=Space+Grotesk:wght@400;500;600;700&display=swap');

      html, body, #root {
        height: 100%;
        margin: 0;
        overflow: hidden;
      }

      .threadly-app {
        height: 100vh;
        height: 100dvh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .threadly-main {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 230px 1fr 260px;
        overflow: hidden;
      }

      .threadly-panel-col {
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .threadly-panel-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }

      .threadly-center-col {
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .threadly-canvas-scroll {
        flex: 1;
        min-height: 0;
        overflow: auto;
        position: relative;
      }

      .threadly-calendar-strip {
        flex-shrink: 0;
      }

      .font-serif { font-family: 'Fraunces', Georgia, serif; }
      .font-sans  { font-family: 'Space Grotesk', sans-serif; font-size: 13px; }

      .paper-texture {
        background-image: repeating-linear-gradient(
          0deg, transparent, transparent 24px,
          rgba(110,31,43,0.04) 24px, rgba(110,31,43,0.04) 25px
        );
      }
      .dot-pattern {
        background-image: radial-gradient(circle, rgba(110,31,43,0.15) 1px, transparent 1px);
        background-size: 12px 12px;
      }
      .diagonal-stripe {
        background-image: repeating-linear-gradient(
          45deg, transparent, transparent 4px,
          rgba(232,93,4,0.12) 4px, rgba(232,93,4,0.12) 8px
        );
      }

      .sticky-shadow { box-shadow: 3px 5px 18px rgba(35,32,29,0.22), 0 1px 3px rgba(35,32,29,0.12); }
      .panel-shadow  { box-shadow: 4px 0 18px rgba(35,32,29,0.14); }

      .rotate-m1  { transform: rotate(-1.2deg); }
      .rotate-p1  { transform: rotate(1.0deg);  }
      .rotate-m05 { transform: rotate(-0.5deg); }
      .rotate-p05 { transform: rotate(0.5deg);  }
      .rotate-p15 { transform: rotate(1.5deg);  }

      .chip-not-started {
        background: #e2ddd6; color: #23201D;
        font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
        padding: 2px 7px; border-radius: 20px; text-transform: uppercase;
        font-family: 'Space Grotesk', sans-serif;
        flex-shrink: 0; white-space: nowrap;
      }
      .chip-doing {
        background: #5FB3B3; color: #23201D;
        font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
        padding: 2px 7px; border-radius: 20px; text-transform: uppercase;
        font-family: 'Space Grotesk', sans-serif;
        display: inline-flex; align-items: center; gap: 4px;
        flex-shrink: 0; white-space: nowrap;
      }
      .chip-blocked {
        background: #E9A6A6; color: #6E1F2B;
        font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
        padding: 2px 7px; border-radius: 20px; text-transform: uppercase;
        font-family: 'Space Grotesk', sans-serif;
        flex-shrink: 0; white-space: nowrap;
      }
      .chip-done {
        background: #8FAF87; color: #23201D;
        font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
        padding: 2px 7px; border-radius: 20px; text-transform: uppercase;
        font-family: 'Space Grotesk', sans-serif;
        flex-shrink: 0; white-space: nowrap;
      }

      .btn-primary {
        background: #5FB3B3; color: #23201D; border: none; border-radius: 4px;
        font-family: 'Space Grotesk', sans-serif; font-weight: 700;
        font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
        padding: 5px 10px; cursor: pointer; transition: filter 0.1s, transform 0.1s;
      }
      .btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }

      .btn-orange {
        background: #E85D04; color: #F5EFE3; border: none; border-radius: 4px;
        font-family: 'Space Grotesk', sans-serif; font-weight: 700;
        font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
        padding: 5px 10px; cursor: pointer; transition: filter 0.1s, transform 0.1s;
      }
      .btn-orange:hover { filter: brightness(1.08); transform: translateY(-1px); }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.5; transform: scale(0.85); }
      }
      .pulse { animation: pulse 1.4s infinite; }

      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .slide-down { animation: slideDown 0.25s ease; }

      .arrow-connector { display: flex; align-items: center; flex-shrink: 0; }
      .arrow-line {
        width: 24px; height: 2px;
        background-image: repeating-linear-gradient(90deg, #6E1F2B 0 6px, transparent 6px 10px);
      }
      .arrow-head {
        width: 0; height: 0;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        border-left: 10px solid #6E1F2B;
      }

      .cal-block {
        font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600;
        border-radius: 4px; padding: 2px 5px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .cal-entry-slot {
        font-size: 12px; font-weight: 700; letter-spacing: 0.06em;
        opacity: 0.82; text-transform: uppercase;
      }

      /* drag */
      .card-draggable        { cursor: grab; user-select: none; }
      .card-draggable:active { cursor: grabbing; }
      .task-card-body { overflow-wrap: anywhere; word-break: break-word; }
      .task-card-meta {
        display: flex; align-items: center; justify-content: flex-start;
        gap: 14px; flex-wrap: wrap; width: 100%;
      }
      .task-card-meta-time { flex-shrink: 0; }
      .task-card-meta-status { flex-shrink: 0; }
      .task-card-done-btn { width: 100%; margin-top: 6px; }
      .card-drag-over { outline: 2.5px dashed #5FB3B3; outline-offset: 5px; }
      [data-cal-day] { transform-origin: center top; }
      .cal-day-drop {
        outline: 2.5px dashed #5FB3B3; outline-offset: 2px;
        background: rgba(95,179,179,0.18) !important;
        transform: scale(1.02);
      }
      .task-drag-ghost {
        cursor: grabbing; pointer-events: none;
        opacity: 0.97;
        box-shadow: 8px 14px 36px rgba(35,32,29,0.38), 0 2px 8px rgba(35,32,29,0.2);
      }
      .canvas-item-placeholder { opacity: 0.28; filter: saturate(0.85); }
      .assign-bar {
        background: rgba(35,32,29,0.55); border: 1.5px dashed rgba(95,179,179,0.45);
        border-radius: 4px; padding: 10px 12px;
      }
      .assign-select {
        background: rgba(245,239,227,0.1); border: 1.5px dashed rgba(95,179,179,0.35);
        border-radius: 4px; color: #F5EFE3; font-family: 'Space Grotesk', sans-serif;
        font-size: 12px; padding: 5px 8px; outline: none; cursor: pointer;
      }

      /* project name input */
      .proj-name-input {
        background: transparent; border: none;
        border-bottom: 2px dashed rgba(110,31,43,0.3); outline: none;
        font-family: 'Fraunces', Georgia, serif; font-size: 17px; font-weight: 700;
        color: #23201D; letter-spacing: -0.02em; width: 100%; padding: 2px 0 3px;
      }
      .proj-name-input::placeholder { color: rgba(35,32,29,0.3); font-style: italic; }
      .proj-name-input:focus { border-bottom-color: rgba(110,31,43,0.55); }

      /* inactive project card hover */
      .proj-card-inactive { transition: background 0.12s, border-color 0.12s; cursor: pointer; }
      .proj-card-inactive:hover { background: rgba(245,239,227,0.22) !important; }

      /* add task input */
      .add-task-input, .add-task-select {
        background: rgba(245,239,227,0.7); border: 2px dashed rgba(110,31,43,0.25);
        border-radius: 4px; outline: none;
        font-family: 'Space Grotesk', sans-serif; font-size: 13px;
        color: #23201D; padding: 7px 10px;
      }
      .add-task-input { flex: 1; min-width: 120px; }
      .add-task-select { cursor: pointer; padding-right: 22px; }
      .add-task-input::placeholder { color: rgba(35,32,29,0.35); }
      .add-task-input:focus, .add-task-select:focus { border-color: rgba(110,31,43,0.45); }
      .add-task-label {
        font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
        letter-spacing: 0.12em; text-transform: uppercase; color: rgba(35,32,29,0.45);
        margin-bottom: 3px; display: block;
      }
      .urgency-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

      /* co-flow panel */
      .coflow-step {
        font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase; color: rgba(243,178,60,0.75);
      }
      .coflow-prompt {
        font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 500;
        color: rgba(245,239,227,0.9); line-height: 1.55;
      }
      .coflow-input {
        background: rgba(245,239,227,0.08); border: 1.5px dashed rgba(243,178,60,0.35);
        border-radius: 4px; outline: none; width: 100%;
        font-family: 'Space Grotesk', sans-serif; font-size: 13px; color: #F5EFE3;
        padding: 8px 10px;
      }
      .coflow-input::placeholder { color: rgba(245,239,227,0.35); }
      .coflow-input:focus { border-color: rgba(243,178,60,0.6); }
      .coflow-link {
        background: none; border: none; cursor: pointer; padding: 0;
        font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
        letter-spacing: 0.04em; color: rgba(245,239,227,0.45); text-decoration: underline;
        text-underline-offset: 3px;
      }
      .coflow-link:hover { color: rgba(245,239,227,0.7); }

      /* focus timer */
      .timer-display {
        font-family: 'Fraunces', Georgia, serif; font-size: 34px; font-weight: 900;
        color: #F3B23C; letter-spacing: -0.03em; line-height: 1; text-align: center;
        font-variant-numeric: tabular-nums;
      }
      .live-clock-time {
        font-family: 'Fraunces', Georgia, serif; font-size: 30px; font-weight: 900;
        color: #F5EFE3; letter-spacing: -0.02em; line-height: 1; text-align: center;
        font-variant-numeric: tabular-nums;
      }
      .timer-bar {
        height: 5px; background: rgba(245,239,227,0.12); border-radius: 3px; overflow: hidden;
      }
      .timer-bar-fill {
        height: 100%; background: linear-gradient(90deg, #5FB3B3, #8FAF87);
        transition: width 0.4s ease;
      }
      .timer-btn {
        flex: 1; background: rgba(245,239,227,0.08); border: 1.5px dashed rgba(95,179,179,0.4);
        border-radius: 4px; color: #F5EFE3; font-family: 'Space Grotesk', sans-serif;
        font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
        padding: 6px 4px; cursor: pointer; transition: background 0.1s, border-color 0.1s;
      }
      .timer-btn:hover { background: rgba(95,179,179,0.15); border-color: rgba(95,179,179,0.65); }
      .timer-btn-primary {
        background: #5FB3B3; border: none; color: #23201D;
        font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
        letter-spacing: 0.08em; text-transform: uppercase; border-radius: 4px;
        padding: 8px 0; cursor: pointer; width: 100%; transition: filter 0.1s;
      }
      .timer-btn-primary:hover { filter: brightness(1.08); }
      .timer-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; filter: none; }
      @keyframes timerDone {
        0%, 100% { color: #F3B23C; }
        50%      { color: #8FAF87; }
      }
      .timer-finished { animation: timerDone 1.2s ease 3; }

      /* free canvas */
      .free-canvas { position: relative; min-height: 480px; touch-action: none; }
      .canvas-item { position: absolute; cursor: grab; user-select: none; touch-action: none; }
      .canvas-item:active { cursor: grabbing; }
      .canvas-item-dragging { cursor: grabbing; z-index: 30 !important; opacity: 0.92; box-shadow: 5px 8px 24px rgba(35,32,29,0.28); }
      .card-link-source { outline: 2.5px dashed #F3B23C !important; outline-offset: 6px; }
      .cal-hint {
        position: absolute; top: 4px; right: 4px; width: 20px; height: 20px;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; opacity: 0.35; border-radius: 3px;
        background: rgba(245,239,227,0.35); z-index: 2; pointer-events: none;
      }
      .canvas-connectors { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
      .canvas-toolbar-btn {
        background: rgba(245,239,227,0.5); border: 1px solid rgba(110,31,43,0.16);
        border-radius: 4px; padding: 6px 12px; cursor: pointer;
        font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700;
        letter-spacing: 0.05em; color: #23201D; transition: background 0.1s, border-color 0.1s;
      }
      .canvas-toolbar-btn:hover { background: rgba(245,239,227,0.85); border-color: rgba(110,31,43,0.4); }
      .canvas-toolbar-btn-active { background: rgba(95,179,179,0.25); border-color: #5FB3B3; color: #6E1F2B; }
      .canvas-toolbar-tape { padding: 7px 11px; min-width: 40px; display: inline-flex; align-items: center; justify-content: center; }
      .canvas-toolbar-swatch {
        display: block; width: 24px; height: 10px; border-radius: 1px;
        box-shadow: inset 0 0 0 1px rgba(35,32,29,0.08);
      }
      .canvas-toolbar-deco { font-size: 14px; padding: 2px 7px; line-height: 1.2; }
      .washi-strip {
        height: 22px; border-radius: 1px; opacity: 0.88;
        box-shadow: 0 1px 3px rgba(35,32,29,0.12);
        border-left: 2px solid rgba(35,32,29,0.08); border-right: 2px solid rgba(35,32,29,0.08);
      }
      .washi-strip-dots { background-size: 6px 6px; }
      .washi-strip-grid { background-size: 8px 8px; }
      .deco-sticker-play {
        line-height: 1; filter: drop-shadow(1px 2px 2px rgba(35,32,29,0.15));
        cursor: grab; user-select: none;
      }
      .deco-sticker-play img {
        width: 100%; height: auto; display: block; pointer-events: none;
      }
      .deco-sticker-play:active { cursor: grabbing; }
      .sticker-tray-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
        margin-top: 8px; max-height: 200px; overflow-y: auto; padding: 8px;
        background: rgba(35,32,29,0.18); border: 1.5px dashed rgba(243,178,60,0.15); border-radius: 4px;
      }
      .sticker-tray-item {
        background: rgba(245,239,227,0.06); border: 1px solid rgba(243,178,60,0.2);
        border-radius: 4px; padding: 5px; cursor: pointer;
        transition: background 0.12s, transform 0.12s;
      }
      .sticker-tray-item:hover { background: rgba(245,239,227,0.14); transform: scale(1.04); }
      .sticker-tray-item img { width: 100%; height: auto; display: block; pointer-events: none; }
      .canvas-item-delete {
        position: absolute; top: -6px; right: -6px; width: 16px; height: 16px;
        background: rgba(110,31,43,0.75); color: #F5EFE3; border: none; border-radius: 50%;
        font-size: 12px; line-height: 1; cursor: pointer; opacity: 0; transition: opacity 0.12s;
        display: flex; align-items: center; justify-content: center; z-index: 3;
      }
      .canvas-item:hover .canvas-item-delete { opacity: 1; }
      .canvas-item-delete-left { left: -6px; right: auto; }
      .canvas-layer-controls {
        position: absolute; bottom: -7px; right: -7px;
        display: flex; flex-direction: column; gap: 2px;
        opacity: 0; transition: opacity 0.12s; z-index: 4;
      }
      .canvas-item:hover .canvas-layer-controls { opacity: 1; }
      .canvas-layer-btn {
        width: 17px; height: 17px;
        background: rgba(95,179,179,0.92); color: #23201D;
        border: 1.5px solid rgba(35,32,29,0.12); border-radius: 3px;
        font-size: 12px; line-height: 1; cursor: pointer; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Space Grotesk', sans-serif;
      }
      .canvas-layer-btn:hover { background: #5FB3B3; }
      .canvas-layer-controls-left { right: auto; left: -7px; }
      .canvas-layer-controls-task {
        top: 24px; right: -7px; bottom: auto; left: auto;
      }

      /* task notepad overlay */
      .task-notepad-overlay {
        position: absolute; inset: 0; z-index: 50;
        background: rgba(245,239,227,0.94);
        display: flex; align-items: center; justify-content: center;
        padding: 28px 24px;
      }
      .task-notepad-paper {
        width: min(520px, 100%); max-height: 100%;
        display: flex; flex-direction: column; gap: 14px;
        padding: 26px 22px 18px; border-radius: 3px;
        position: relative;
      }
      .task-notepad-paper::before {
        content: ''; position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
        width: 52px; height: 16px; background: rgba(245,239,227,0.55); border-radius: 2px;
      }
      .task-notepad-textarea {
        flex: 1; min-height: 240px; width: 100%;
        background: transparent; border: none; outline: none; resize: none;
        font-family: 'Space Grotesk', sans-serif; font-size: 13px; line-height: 26px;
        padding: 4px 10px 4px 14px;
        border-left: 2px solid rgba(110,31,43,0.14);
        background-image: repeating-linear-gradient(
          transparent, transparent 25px,
          rgba(110,31,43,0.08) 25px, rgba(110,31,43,0.08) 26px
        );
      }
      .task-notepad-textarea::placeholder { opacity: 0.4; font-style: italic; }
      .task-notepad-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
      .task-notepad-close {
        margin-left: auto; background: none; border: none; cursor: pointer;
        font-family: 'Space Grotesk', sans-serif; font-size: 18px; line-height: 1;
        opacity: 0.45; padding: 0 4px;
      }
      .task-notepad-close:hover { opacity: 0.75; }

      .week-nav-btn {
        width: 32px; height: 32px; flex-shrink: 0;
        background: rgba(245,239,227,0.08); border: 1px solid rgba(245,239,227,0.18);
        border-radius: 4px; color: #F5EFE3; cursor: pointer;
        font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; line-height: 1;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.12s, border-color 0.12s, opacity 0.12s;
      }
      .week-nav-btn:hover:not(:disabled) { background: rgba(95,179,179,0.22); border-color: rgba(95,179,179,0.45); }
      .week-nav-btn:disabled { opacity: 0.28; cursor: default; }

      /* ghost cards */
      .ghost-card {
        min-width: 115px; max-width: 128px; height: 148px;
        border: 2px dashed rgba(110,31,43,0.15); border-radius: 3px; flex-shrink: 0;
      }
    `}</style>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

function StatusChip({ status }) {
  if (status === 'doing') {
    return (
      <span className="chip-doing">
        <span className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: '#23201D', display: 'inline-block', flexShrink: 0 }} />
        doing
      </span>
    );
  }
  const cls   = { done: 'chip-done', blocked: 'chip-blocked', 'not-started': 'chip-not-started' }[status] ?? 'chip-not-started';
  const label = status === 'not-started' ? 'not started' : status;
  return <span className={cls}>{label}</span>;
}

function Arrow() {
  return (
    <div className="arrow-connector">
      <div className="arrow-line" /><div className="arrow-head" />
    </div>
  );
}

function Stamp({ children, color = '#6E1F2B' }) {
  return (
    <span className="font-sans" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderRadius: 3, opacity: 0.8, border: `2.5px dashed ${color}`, padding: '2px 6px', color, display: 'inline-block' }}>
      {children}
    </span>
  );
}

function SectionLabel({ children, color = '#6E1F2B', underline, opacity = 0.7 }) {
  const line = underline ?? color;
  return (
    <span
      className="font-sans"
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color,
        opacity,
        borderBottom: `2px solid ${line}`,
        paddingBottom: 5,
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}

function LayerControls({ onFront, onBack, className = '' }) {
  return (
    <div className={`canvas-layer-controls ${className}`} onPointerDown={e => e.stopPropagation()}>
      <button type="button" className="canvas-layer-btn" onClick={e => { e.stopPropagation(); onFront(); }} title="Bring to front">↑</button>
      <button type="button" className="canvas-layer-btn" onClick={e => { e.stopPropagation(); onBack(); }} title="Send to back">↓</button>
    </div>
  );
}

// ─── Task notepad ─────────────────────────────────────────────────────────────

function TaskNotepad({ task, draft, onChange, onSave, onClose, onDelete, overlayRef, paperRef }) {
  return (
    <div ref={overlayRef} className="task-notepad-overlay" onPointerDown={e => e.stopPropagation()}>
      <div
        ref={paperRef}
        className="task-notepad-paper sticky-shadow rotate-m05"
        style={{ background: task.color, color: task.textColor }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <Stamp color={task.textColor}>Task Notes</Stamp>
            <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginTop: 8, lineHeight: 1.15 }}>
              {task.title}
            </h2>
            <p className="font-sans" style={{ fontSize: 11, opacity: 0.55, marginTop: 4, letterSpacing: '0.06em' }}>
              ⏱ {task.time}{task.scheduledDay ? ` · ${task.scheduledDay}` : ''}
            </p>
          </div>
          <button type="button" className="task-notepad-close" style={{ color: task.textColor }} onClick={onClose} title="Close">✕</button>
        </div>
        <textarea
          className="task-notepad-textarea"
          value={draft}
          onChange={e => onChange(e.target.value)}
          placeholder="Write anything — context, links, sub-steps, reminders…"
          autoFocus
          onKeyDown={e => { if (e.key === 'Escape') onClose(); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSave(); }}
        />
        <div className="task-notepad-actions">
          <button type="button" className="btn-primary" style={{ padding: '7px 16px', fontSize: 11 }} onClick={onSave}>Save & return</button>
          <button type="button" className="coflow-link" style={{ color: task.textColor, opacity: 0.55 }} onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="coflow-link"
            style={{ color: '#6E1F2B', opacity: 0.7, marginLeft: 'auto' }}
            onClick={onDelete}
          >
            Remove from canvas
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function parseTaskHours(timeStr) {
  if (!timeStr) return 0;
  if (timeStr.includes('min')) return 0.5;
  const n = parseInt(timeStr, 10);
  return Number.isNaN(n) ? 0 : n;
}

function urgencyMeta(urgency) {
  return URGENCY_OPTIONS.find(u => u.value === urgency) ?? URGENCY_OPTIONS[1];
}

function getCoFlowStep(projectName, tasks, interruption) {
  if (!projectName.trim()) return { id: 'name', step: 1, label: 'Name your project', total: 2 };
  if (interruption) return { id: 'recover', label: 'Get back on track' };
  return { id: 'active', step: 2, label: 'Work the flow', total: 2 };
}

function CanvasConnectors({ tasks, canvasLinks }) {
  const [paths, setPaths] = useState([]);

  useLayoutEffect(() => {
    const lines = [];
    tasks.forEach(t => {
      if (t.dep) {
        const from = tasks.find(p => p.id === t.dep);
        if (from) lines.push({ key: `dep-${t.id}`, from, to: t });
      }
    });
    (canvasLinks || []).forEach(l => {
      const from = tasks.find(t => t.id === l.fromId);
      const to = tasks.find(t => t.id === l.toId);
      if (from && to) lines.push({ key: `link-${l.id}`, from, to });
    });
    setPaths(lines.map(({ key, from, to }) => {
      const a = taskAnchor(from, 'right');
      const b = taskAnchor(to, 'left');
      const mx = (a.x + b.x) / 2;
      return { key, d: `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}` };
    }));
  }, [tasks, canvasLinks]);

  return (
    <svg className="canvas-connectors">
      <defs>
        <marker id="conn-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#6E1F2B" opacity="0.7" />
        </marker>
      </defs>
      {paths.map(({ key, d }) => (
        <path
          key={key}
          d={d}
          fill="none"
          stroke="#6E1F2B"
          strokeWidth="2"
          strokeDasharray="7 5"
          opacity="0.55"
          markerEnd="url(#conn-arrow)"
        />
      ))}
    </svg>
  );
}

function WashiStrip({ item, displayX, displayY, onPointerDown, onDelete, onBringFront, onSendBack, isDragging }) {
  const bgSize = item.pattern === 'dots' ? '6px 6px' : item.pattern === 'grid' ? '8px 8px' : undefined;
  return (
    <div
      className={`canvas-item washi-strip washi-strip-${item.pattern} ${isDragging ? 'canvas-item-dragging' : ''}`}
      style={{
        left: displayX ?? item.x,
        top: displayY ?? item.y,
        width: item.width ?? 90,
        transform: `rotate(${item.rotation ?? 0}deg)`,
        backgroundColor: item.color,
        backgroundImage: washiBackground(item),
        backgroundSize: bgSize,
        opacity: item.opacity ?? 0.85,
        zIndex: isDragging ? 30 : resolveCanvasLayer(item, 'washi'),
      }}
      onPointerDown={e => onPointerDown(e, 'washi', item.id)}
    >
      <button type="button" className="canvas-item-delete" onClick={e => { e.stopPropagation(); onDelete(item.id); }}>×</button>
      <LayerControls onFront={onBringFront} onBack={onSendBack} />
    </div>
  );
}

function DecoStickerPlay({ item, displayX, displayY, onPointerDown, onDelete, onBringFront, onSendBack, isDragging }) {
  return (
    <div
      className={`canvas-item deco-sticker-play ${isDragging ? 'canvas-item-dragging' : ''}`}
      style={{
        left: displayX ?? item.x,
        top: displayY ?? item.y,
        width: item.width ?? 80,
        transform: `rotate(${item.rotation ?? 0}deg)`,
        zIndex: isDragging ? 30 : resolveCanvasLayer(item, 'deco'),
      }}
      onPointerDown={e => onPointerDown(e, 'deco', item.id)}
    >
      {item.src ? (
        <img src={item.src} alt="" draggable={false} />
      ) : (
        <span style={{ color: item.color, fontSize: 26, display: 'block', textAlign: 'center' }}>{item.emoji}</span>
      )}
      <button type="button" className="canvas-item-delete" onClick={e => { e.stopPropagation(); onDelete(item.id); }}>×</button>
      <LayerControls onFront={onBringFront} onBack={onSendBack} />
    </div>
  );
}

function TaskDragGhost({ task, clientX, clientY, grabX, grabY }) {
  const rotClass = ROTATION_CLASSES[task.rotation % ROTATION_CLASSES.length];
  return (
    <div
      className={`task-drag-ghost sticky-shadow canvas-item ${rotClass}`}
      style={{
        position: 'fixed',
        left: clientX - grabX,
        top: clientY - grabY,
        ...TASK_CARD_SIZE,
        background: task.color,
        color: task.textColor,
        padding: '20px 12px 14px',
        borderRadius: 3,
        border: task.status === 'blocked' ? '2px solid #E9A6A6' : 'none',
        zIndex: 10000,
      }}
    >
      <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', width: 36, height: 14, background: 'rgba(245,239,227,0.55)', borderRadius: 2 }} />
      <p className="font-serif task-card-body" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 4 }}>{task.title}</p>
      <p className="font-sans task-card-body" style={{ fontSize: 12, opacity: 0.75, marginBottom: 8, lineHeight: 1.4 }}>{task.note}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="font-sans" style={{ fontSize: 11, fontWeight: 700, opacity: 0.8 }}>⏱ {task.time}</span>
        <StatusChip status={task.status} />
      </div>
    </div>
  );
}

function TaskCard({
  task, onMarkDone, onPointerDown, onOpenNotepad, onDelete, onBringFront, onSendBack,
  isLinkSource, linkMode, onLinkClick, isFloatDragging,
}) {
  const rotClass = ROTATION_CLASSES[task.rotation % ROTATION_CLASSES.length];
  const urgency = urgencyMeta(task.urgency);
  return (
    <div
      data-task-id={task.id}
      className={`sticky-shadow canvas-item card-draggable ${rotClass} ${isLinkSource ? 'card-link-source' : ''} ${isFloatDragging ? 'canvas-item-placeholder' : ''}`}
      style={{
        left: task.x ?? 0,
        top: task.y ?? 0,
        ...TASK_CARD_SIZE,
        background: task.color,
        color: task.textColor,
        padding: '20px 12px 14px',
        borderRadius: 3,
        border: task.status === 'blocked' ? '2px solid #E9A6A6' : 'none',
        zIndex: resolveCanvasLayer(task, 'task'),
      }}
      onPointerDown={e => {
        if (linkMode) { e.preventDefault(); onLinkClick(task.id); return; }
        onPointerDown(e, 'task', task.id);
      }}
      onDoubleClick={e => {
        e.stopPropagation();
        e.preventDefault();
        onOpenNotepad(task.id);
      }}
    >
      <span className="cal-hint" title="Drag to calendar · double-tap for notes">📅</span>
      <button
        type="button"
        className="canvas-item-delete canvas-item-delete-left"
        onClick={e => { e.stopPropagation(); onDelete(task.id); }}
        title={task.scheduledDay ? 'Remove from canvas — stays on calendar' : 'Remove from canvas'}
      >×</button>
      <LayerControls className="canvas-layer-controls-task" onFront={onBringFront} onBack={onSendBack} />
      <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', width: 36, height: 14, background: 'rgba(245,239,227,0.55)', borderRadius: 2, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <p className="font-serif task-card-body" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', flex: 1, minWidth: 0 }}>{task.title}</p>
        {task.urgency && task.urgency !== 'medium' && (
          <span className="urgency-dot" style={{ background: urgency.color, marginTop: 4, flexShrink: 0 }} title={`${urgency.label} urgency`} />
        )}
      </div>
      {task.note ? (
        <p className="font-sans task-card-body" style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.4, margin: 0 }}>{task.note}</p>
      ) : null}
      <div className="task-card-meta">
        <span className="font-sans task-card-meta-time" style={{ fontSize: 11, fontWeight: 700, opacity: 0.8 }}>⏱ {task.time}</span>
        <span className="task-card-meta-status"><StatusChip status={task.status} /></span>
      </div>
      {task.scheduledDay && (
        <p className="font-sans" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.65, margin: 0 }}>
          📌 {task.scheduledDay}{task.scheduledSlot ? ` · ${task.scheduledSlot}` : ''}
        </p>
      )}
      {task.deadline && (!task.scheduledDay || task.deadline !== task.scheduledDay) && (
        <p className="font-sans" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.65, margin: 0 }}>
          📅 Due {task.deadline}
        </p>
      )}
      {task.status !== 'done' && (
        <button className="btn-primary task-card-done-btn" onClick={e => { e.stopPropagation(); onMarkDone(task.id); }}>✓ Mark Done</button>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Threadly() {
  const [projects,  setProjects]  = useState(() => load('threadly_projects',  [makeProject(1)]).map(migrateProject));
  const [activeId,  setActiveId]  = useState(() => load('threadly_active_id', 1));
  const [aiMessages, setAiMessages] = useState(AI_MESSAGES.empty);
  const [flashAI,   setFlashAI]   = useState(false);
  const [newTaskForm, setNewTaskForm] = useState(DEFAULT_TASK_FORM);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAdjust,  setShowAdjust]  = useState(false);
  const [dragOverCalDay, setDragOverCalDay] = useState(null);
  const [pendingAssign,  setPendingAssign]  = useState(null);
  const [selectedTimerTaskId, setSelectedTimerTaskId] = useState(null);
  const [timerTaskId, setTimerTaskId] = useState(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(0);
  const [timerStatus, setTimerStatus] = useState('idle');
  const [linkMode, setLinkMode] = useState(false);
  const [linkFrom, setLinkFrom] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [notepadTaskId, setNotepadTaskId] = useState(null);
  const [notepadDraft, setNotepadDraft] = useState('');
  const [now, setNow] = useState(() => new Date());

  const canvasDrag = useRef(null);
  const canvasRef = useRef(null);
  const taskTapRef = useRef({ id: null, time: 0 });
  const notepadOverlayRef = useRef(null);
  const notepadPaperRef = useRef(null);
  const calDayTweenRef = useRef(null);

  // ── persist ───────────────────────────────────────────────────────────────────
  useEffect(() => { save('threadly_projects',  projects);  }, [projects]);
  useEffect(() => { save('threadly_active_id', activeId);  }, [activeId]);

  useEffect(() => {
    setTimerTaskId(null);
    setTimerSecondsLeft(0);
    setTimerTotalSeconds(0);
    setTimerStatus('idle');
    setSelectedTimerTaskId(null);
    setLinkMode(false);
    setLinkFrom(null);
    setNotepadTaskId(null);
    setNotepadDraft('');
  }, [activeId]);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (timerStatus !== 'running') return undefined;
    const tick = setInterval(() => {
      setTimerSecondsLeft(prev => {
        if (prev <= 1) {
          setTimerStatus('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [timerStatus]);

  useEffect(() => {
    if (timerStatus !== 'finished' || !motionOk()) return;
    const el = document.querySelector('.timer-display');
    if (!el) return;
    gsap.fromTo(el, { scale: 1 }, { scale: 1.08, duration: 0.14, yoyo: true, repeat: 3, ease: 'power2.inOut' });
  }, [timerStatus]);

  useEffect(() => {
    if (!notepadTaskId) return;
    requestAnimationFrame(() => {
      animateNotepadOpen(notepadOverlayRef.current, notepadPaperRef.current);
    });
  }, [notepadTaskId]);

  useEffect(() => {
    calDayTweenRef.current?.kill();
    calDayTweenRef.current = null;
    if (dragOverCalDay == null || !motionOk()) return;
    const el = calDayEl(dragOverCalDay);
    if (!el) return;
    calDayTweenRef.current = gsap.to(el, { scale: 1.025, duration: 0.18, ease: 'power2.out' });
    return () => {
      calDayTweenRef.current?.kill();
      if (el) gsap.to(el, { scale: 1, duration: 0.14 });
    };
  }, [dragOverCalDay]);

  useEffect(() => {
    if (!pendingAssign || !motionOk()) return;
    requestAnimationFrame(() => {
      const bar = document.querySelector('.assign-bar');
      if (bar) gsap.from(bar, { y: -10, opacity: 0, duration: 0.32, ease: 'power2.out', clearProps: 'y,opacity' });
    });
  }, [pendingAssign?.taskId, pendingAssign?.dayIndex]);

  // ── active project (derived) ──────────────────────────────────────────────────
  const active = projects.find(p => p.id === activeId) ?? projects[0];
  const { tasks, calendar, interruption, name: projectName, washi = [], decoStickers = [], canvasLinks = [], weekOffset = 0, calendarWeeks = {} } = active;
  const canvasTasks = tasks.filter(isOnCanvas);

  function patchActive(patch) {
    setProjects(ps => ps.map(p => p.id === active.id ? { ...p, ...patch } : p));
  }

  const setTasks       = v => patchActive({ tasks:        typeof v === 'function' ? v(tasks)       : v });
  const setCalendar    = v => {
    const next = typeof v === 'function' ? v(calendar) : v;
    patchActive({
      calendar: next,
      calendarWeeks: { ...calendarWeeks, [String(weekOffset)]: next },
    });
  };
  const setInterruption= v => patchActive({ interruption: typeof v === 'function' ? v(interruption): v });

  const deadlineOptions = [
    ...DEADLINE_OPTIONS_BASE,
    ...calendar.map(d => ({ value: dayLabel(d), label: dayLabel(d) })),
  ];

  function navigateWeek(delta) {
    const next = weekOffset + delta;
    const weeks = { ...calendarWeeks, [String(weekOffset)]: calendar };
    const nextCal = syncWeekCalendar(weeks[String(next)], next).map(migrateCalendarDay);
    patchActive({ weekOffset: next, calendarWeeks: weeks, calendar: nextCal });
    setPendingAssign(null);
  }

  useEffect(() => {
    const synced = syncWeekCalendar(calendar, weekOffset).map(migrateCalendarDay);
    const datesStale = synced.some((d, i) =>
      d.date !== calendar[i]?.date || d.month !== calendar[i]?.month || d.year !== calendar[i]?.year,
    );
    if (datesStale) {
      patchActive({
        calendar: synced,
        calendarWeeks: { ...calendarWeeks, [String(weekOffset)]: synced },
      });
    }
  }, [activeId]);

  useEffect(() => {
    if (tasks.some(t => t.x == null || t.y == null)) {
      setTasks(ts => ts.map((t, i) => ensureTaskXY(t, i)));
    }
  }, [activeId]);

  // ── derived stats ─────────────────────────────────────────────────────────────
  const totalHrs  = tasks.reduce((s, t) => s + parseTaskHours(t.time), 0);
  const doneHrs   = tasks.filter(t => t.status === 'done').reduce((s, t) => s + parseTaskHours(t.time), 0);

  function resetTaskForm() {
    setNewTaskForm(DEFAULT_TASK_FORM);
    setShowAddTask(false);
  }

  function patchTaskForm(field, value) {
    setNewTaskForm(f => ({ ...f, [field]: value }));
  }

  // ── project management ────────────────────────────────────────────────────────
  function handleAddProject() {
    const newId = Math.max(...projects.map(p => p.id)) + 1;
    setProjects(ps => [...ps, makeProject(newId)]);
    setActiveId(newId);
    setAiMessages(AI_MESSAGES.empty);
    setShowAdjust(false);
  }

  function handleDeleteProject(id) {
    if (projects.length === 1) return; // always keep one
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    if (activeId === id) setActiveId(remaining[0].id);
  }

  // ── AI ────────────────────────────────────────────────────────────────────────
  function getContextualMessages(mode) {
    if (mode !== 'realityCheck' || tasks.length === 0) return AI_MESSAGES[mode];
    const msgs = [...AI_MESSAGES.realityCheck];
    const urgent = tasks.filter(t => t.urgency === 'high' || t.urgency === 'critical');
    const dueSoon = tasks.filter(t => t.deadline && t.status !== 'done');
    const heavy = tasks.filter(t => parseTaskHours(t.time) >= 4 && t.status !== 'done');
    if (urgent.length) {
      msgs[0] = `${urgent.length} high-priority card${urgent.length > 1 ? 's' : ''} — lead with "${urgent[0].title}" before anything else slips.`;
    }
    if (dueSoon.length) {
      msgs[1] = `${dueSoon.length} task${dueSoon.length > 1 ? 's' : ''} with deadlines this week — guard those calendar slots.`;
    }
    if (heavy.length) {
      msgs[2] = `${heavy.length} deep-work block${heavy.length > 1 ? 's' : ''} on the board — don't stack them back-to-back.`;
    }
    return msgs;
  }

  function triggerAI(mode) {
    setAiMessages(getContextualMessages(mode));
    setFlashAI(true);
    setTimeout(() => setFlashAI(false), 600);
  }

  function handleMarkDone(id) {
    const task = tasks.find(t => t.id === id);
    if (!task || task.status === 'done') return;
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: 'done' } : t));
    animateMarkDone(id);
    if (timerTaskId === id) {
      setTimerTaskId(null);
      setTimerSecondsLeft(0);
      setTimerTotalSeconds(0);
      setTimerStatus('idle');
    }
  }

  const focusableTasks = tasks.filter(t => t.status !== 'done');
  const timerTask = timerTaskId ? tasks.find(t => t.id === timerTaskId) : null;
  const pickerTask = tasks.find(t => t.id === (selectedTimerTaskId ?? focusableTasks[0]?.id));
  const timerProgress = timerTotalSeconds ? ((timerTotalSeconds - timerSecondsLeft) / timerTotalSeconds) * 100 : 0;
  const timerRunning = timerStatus === 'running' || timerStatus === 'paused' || timerStatus === 'finished';

  function handleStartTimer() {
    const id = selectedTimerTaskId ?? focusableTasks[0]?.id;
    if (!id) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const total = timeToSeconds(task.time);
    setSelectedTimerTaskId(id);
    setTimerTaskId(id);
    setTimerTotalSeconds(total);
    setTimerSecondsLeft(total);
    setTimerStatus('running');
    setTasks(ts => ts.map(t => ({
      ...t,
      status: t.id === id ? 'doing' : (t.status === 'doing' ? 'not-started' : t.status),
    })));
  }

  function handlePauseTimer() {
    if (timerStatus === 'running') setTimerStatus('paused');
  }

  function handleResumeTimer() {
    if (timerStatus === 'paused') setTimerStatus('running');
  }

  function handleRestartTimer() {
    if (!timerTaskId) return;
    const task = tasks.find(t => t.id === timerTaskId);
    if (!task) return;
    const total = timeToSeconds(task.time);
    setTimerTotalSeconds(total);
    setTimerSecondsLeft(total);
    setTimerStatus('running');
  }

  function handleEndTimer() {
    const endingId = timerTaskId;
    setTimerTaskId(null);
    setTimerSecondsLeft(0);
    setTimerTotalSeconds(0);
    setTimerStatus('idle');
    if (endingId) {
      setTasks(ts => ts.map(t => t.id === endingId && t.status === 'doing' ? { ...t, status: 'not-started' } : t));
    }
  }

  function handleAddTask() {
    if (!newTaskForm.title.trim()) return;
    const ci    = tasks.length % ACCENT_PALETTE.length;
    const newId = Math.max(0, ...tasks.map(t => t.id)) + 1;
    const layer = maxCanvasLayer(tasks, washi, decoStickers) + 1;
    setTasks(ts => [...ts, {
      id: newId,
      title: newTaskForm.title.trim(),
      time: newTaskForm.time,
      urgency: newTaskForm.urgency,
      deadline: newTaskForm.deadline,
      status: 'not-started',
      dep: null,
      note: newTaskForm.note.trim() || 'New task',
      color: ACCENT_PALETTE[ci].color,
      textColor: ACCENT_PALETTE[ci].textColor,
      rotation: tasks.length % ROTATION_CLASSES.length,
      x: 40 + (canvasTasks.length % 4) * 160,
      y: 40 + Math.floor(canvasTasks.length / 4) * 180,
      layer,
      onCanvas: true,
    }]);
    resetTaskForm();
    animateTaskEnter(newId);
    if (tasks.length === 0) triggerAI('default');
  }

  function commitClearFlow() {
    setProjects(ps => ps.map(p => {
      if (p.id !== activeId) return p;
      const blank = buildWeekCalendar(p.weekOffset ?? 0);
      const weekKey = String(p.weekOffset ?? 0);
      return {
        ...p,
        tasks: [],
        calendar: blank,
        calendarWeeks: { ...(p.calendarWeeks ?? {}), [weekKey]: blank },
        washi: [],
        decoStickers: [],
        canvasLinks: [],
        interruption: false,
      };
    }));
    resetTaskForm();
    setShowAdjust(false);
    setPendingAssign(null);
    handleEndTimer();
    setAiMessages(AI_MESSAGES.empty);
  }

  function handleClearFlow() {
    animateTasksStaggerOut(commitClearFlow);
  }

  function handleSomethingCameUp() {
    setInterruption(true);
    setCalendar(cal => cal.map((d, i) => i === 2
      ? { ...d, entries: [{ taskId: null, label: '⚡ Interruption', color: '#6E1F2B', slot: '', duration: '' }], isInterruption: true }
      : d
    ));
    triggerAI('interruption');
  }

  function handleReplanning() {
    setCalendar(cal => cal.map((d, i) => {
      if (i === 3) return { ...d, entries: [{ taskId: 5, label: 'Design Pass ↗', color: '#F3B23C', slot: 'Afternoon', duration: '4 hrs' }] };
      if (i === 6) return { ...d, entries: [
        { taskId: 7, label: 'Review', color: '#E9A6A6', slot: 'Morning', duration: '1 hr' },
        { taskId: 8, label: 'Polish Portfolio', color: '#8FAF87', slot: 'Afternoon', duration: '2 hrs' },
        { taskId: null, label: '+buffer', color: '#5FB3B3', slot: 'Anytime', duration: '' },
      ]};
      return d;
    }));
    triggerAI('replan');
  }

  function commitScheduleAssign() {
    if (!pendingAssign) return;
    const { taskId, dayIndex, slot, duration } = pendingAssign;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const targetDay = calendar[dayIndex];
    const label = dayLabel(targetDay);

    setProjects(ps => ps.map(p => {
      if (p.id !== activeId) return p;
      const weekKey = String(p.weekOffset ?? 0);
      const cal = p.calendar ?? [];
      const nextCal = cal.map(d => ({
        ...d,
        entries: getCalEntries(d).filter(e => !sameTaskId(e.taskId, taskId)),
      }));
      nextCal[dayIndex] = {
        ...nextCal[dayIndex],
        entries: [...getCalEntries(nextCal[dayIndex]), normalizeCalEntry({
          taskId,
          label: task.title,
          color: task.color,
          textColor: task.textColor,
          slot,
          duration,
        })],
        isInterruption: false,
      };
      return {
        ...p,
        tasks: p.tasks.map(t => t.id === taskId ? {
          ...t,
          scheduledDay: label,
          scheduledSlot: slot,
          deadline: label,
          time: duration,
        } : t),
        calendar: nextCal,
        calendarWeeks: { ...(p.calendarWeeks ?? {}), [weekKey]: nextCal },
      };
    }));

    setPendingAssign(null);
    setAiMessages([`"${task.title}" → ${label} · ${slot}.`, `${duration} blocked on the calendar.`]);
    setFlashAI(true);
    setTimeout(() => setFlashAI(false), 600);
  }

  function handleConfirmAssign() {
    if (!pendingAssign) return;
    const { taskId, dayIndex } = pendingAssign;
    if (!motionOk()) {
      commitScheduleAssign();
      return;
    }
    animateScheduleFly(taskId, dayIndex, commitScheduleAssign);
  }

  function handleRemoveFromCalendar(taskId) {
    setProjects(ps => ps.map(p => {
      if (p.id !== activeId) return p;
      const weekKey = String(p.weekOffset ?? 0);
      const nextCal = (p.calendar ?? []).map(d => ({
        ...d,
        entries: getCalEntries(d).filter(e => !sameTaskId(e.taskId, taskId)),
      }));
      return {
        ...p,
        tasks: p.tasks.map(t => {
          if (t.id !== taskId) return t;
          const wasScheduled = t.scheduledDay;
          return {
            ...t,
            scheduledDay: null,
            scheduledSlot: null,
            deadline: t.deadline === wasScheduled ? '' : t.deadline,
          };
        }),
        calendar: nextCal,
        calendarWeeks: { ...(p.calendarWeeks ?? {}), [weekKey]: nextCal },
      };
    }));
  }

  function handleRemoveCalendarEntry(dayIndex, entryIndex) {
    setCalendar(cal => cal.map((d, i) => {
      if (i !== dayIndex) return d;
      return { ...d, entries: getCalEntries(d).filter((_, j) => j !== entryIndex) };
    }));
  }

  function commitRemoveFromCanvas(taskId) {
    setProjects(ps => ps.map(p => {
      if (p.id !== activeId) return p;
      return {
        ...p,
        tasks: p.tasks.map(t => (t.id === taskId ? { ...t, onCanvas: false } : t)),
        canvasLinks: (p.canvasLinks ?? []).filter(l => !sameTaskId(l.fromId, taskId) && !sameTaskId(l.toId, taskId)),
      };
    }));
    if (timerTaskId === taskId) handleEndTimer();
    if (selectedTimerTaskId === taskId) setSelectedTimerTaskId(null);
    if (notepadTaskId === taskId) closeTaskNotepad(false);
    if (pendingAssign?.taskId === taskId) setPendingAssign(null);
    if (linkFrom === taskId) setLinkFrom(null);
  }

  function handleDeleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    animateTaskExit(taskId, () => {
      commitRemoveFromCanvas(taskId);
      if (task?.scheduledDay) {
        setAiMessages([
          `"${task.title}" removed from canvas — still on your calendar.`,
          `${task.scheduledDay}${task.scheduledSlot ? ` · ${task.scheduledSlot}` : ''} · ${task.time}`,
        ]);
        setFlashAI(true);
        setTimeout(() => setFlashAI(false), 600);
      }
    });
  }

  function openTaskNotepad(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setNotepadTaskId(taskId);
    setNotepadDraft(task.note || '');
    taskTapRef.current = { id: null, time: 0 };
  }

  function saveTaskNotepad() {
    if (!notepadTaskId) return;
    const trimmed = notepadDraft.trim();
    const id = notepadTaskId;
    animateNotepadClose(notepadOverlayRef.current, notepadPaperRef.current, () => {
      setTasks(ts => ts.map(t => t.id === id ? { ...t, note: trimmed || t.note } : t));
      setNotepadTaskId(null);
      setNotepadDraft('');
    });
  }

  function closeTaskNotepad(animated = true) {
    if (!notepadTaskId) return;
    if (!animated) {
      setNotepadTaskId(null);
      setNotepadDraft('');
      return;
    }
    animateNotepadClose(notepadOverlayRef.current, notepadPaperRef.current, () => {
      setNotepadTaskId(null);
      setNotepadDraft('');
    });
  }

  function handleTaskTap(taskId) {
    const now = Date.now();
    const t = taskTapRef.current;
    if (t.id === taskId && now - t.time < 380) {
      openTaskNotepad(taskId);
    } else {
      taskTapRef.current = { id: taskId, time: now };
    }
  }

  // ── canvas drag & decorate ───────────────────────────────────────────────────
  function applyCanvasDragPosition(d, nx, ny) {
    const x = Math.max(0, nx);
    const y = Math.max(0, ny);
    if (d.kind === 'task') {
      setTasks(ts => ts.map(t => t.id === d.id ? { ...t, x, y } : t));
    } else if (d.kind === 'washi') {
      patchActive({ washi: washi.map(w => w.id === d.id ? { ...w, x, y } : w) });
    } else {
      patchActive({ decoStickers: decoStickers.map(s => s.id === d.id ? { ...s, x, y } : s) });
    }
  }

  function endCanvasDrag() {
    canvasDrag.current = null;
    setDraggingId(null);
    setDragPreview(null);
    setDragOverCalDay(null);
  }

  function openTaskSchedule(taskId, dayIndex) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setPendingAssign({
      taskId,
      dayIndex,
      slot: task.scheduledSlot || 'Morning',
      duration: task.time || '1 hr',
    });
  }

  function canvasPointFromClient(clientX, clientY, grabX, grabY) {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return null;
    const rect = canvasEl.getBoundingClientRect();
    const inCanvas = clientX >= rect.left && clientX <= rect.right
      && clientY >= rect.top && clientY <= rect.bottom;
    if (!inCanvas) return null;
    return {
      x: Math.max(0, clientX - rect.left + canvasEl.scrollLeft - grabX),
      y: Math.max(0, clientY - rect.top + canvasEl.scrollTop - grabY),
    };
  }

  function finishCanvasDrag(ev) {
    const d = canvasDrag.current;
    if (!d) return;

    if (d.kind === 'task') {
      const dayIndex = calDayIndexFromPoint(ev.clientX, ev.clientY);
      if (dayIndex != null) {
        openTaskSchedule(d.id, dayIndex);
        endCanvasDrag();
        return;
      }

      const pt = canvasPointFromClient(ev.clientX, ev.clientY, d.grabX, d.grabY);
      if (pt) {
        applyCanvasDragPosition(d, pt.x, pt.y);
        animateCanvasSettle(d.id);
      }
      endCanvasDrag();
      return;
    }

    const nx = Math.max(0, d.startX + ev.clientX - d.ox);
    const ny = Math.max(0, d.startY + ev.clientY - d.oy);
    const canvasEl = canvasRef.current;
    if (canvasEl) {
      const rect = canvasEl.getBoundingClientRect();
      const inCanvas = ev.clientX >= rect.left && ev.clientX <= rect.right
        && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
      if (inCanvas) applyCanvasDragPosition(d, nx, ny);
    }
    endCanvasDrag();
  }

  function handleCanvasPointerDown(e, kind, id) {
    if (notepadTaskId) return;
    if (e.button !== 0 || e.target.closest('button')) return;
    if (kind === 'task' && e.detail >= 2) {
      e.preventDefault();
      openTaskNotepad(id);
      return;
    }
    e.preventDefault();

    let startX = 0;
    let startY = 0;
    if (kind === 'task') {
      const t = tasks.find(x => x.id === id);
      startX = t?.x ?? 0;
      startY = t?.y ?? 0;
    } else if (kind === 'washi') {
      const w = washi.find(x => x.id === id);
      startX = w?.x ?? 0;
      startY = w?.y ?? 0;
    } else {
      const s = decoStickers.find(x => x.id === id);
      startX = s?.x ?? 0;
      startY = s?.y ?? 0;
    }

    const cardRect = e.currentTarget.getBoundingClientRect();
    const grabX = e.clientX - cardRect.left;
    const grabY = e.clientY - cardRect.top;

    canvasDrag.current = { kind, id, ox: e.clientX, oy: e.clientY, startX, startY, grabX, grabY, moved: false };
    setDraggingId(id);

    if (kind === 'task') {
      setDragPreview({
        kind: 'task',
        id,
        float: true,
        clientX: e.clientX,
        clientY: e.clientY,
        grabX,
        grabY,
      });
    }

    const onMove = (ev) => {
      const d = canvasDrag.current;
      if (!d) return;
      if (Math.hypot(ev.clientX - d.ox, ev.clientY - d.oy) > 8) d.moved = true;

      if (d.kind === 'task') {
        setDragPreview({
          kind: 'task',
          id: d.id,
          float: true,
          clientX: ev.clientX,
          clientY: ev.clientY,
          grabX: d.grabX,
          grabY: d.grabY,
        });
        setDragOverCalDay(calDayIndexFromPoint(ev.clientX, ev.clientY));
        return;
      }

      setDragPreview({
        kind: d.kind,
        id: d.id,
        x: Math.max(0, d.startX + ev.clientX - d.ox),
        y: Math.max(0, d.startY + ev.clientY - d.oy),
      });
    };

    const onUp = (ev) => {
      const d = canvasDrag.current;
      if (d?.kind === 'task' && !d.moved) handleTaskTap(d.id);
      finishCanvasDrag(ev);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  function addWashi(paletteIndex) {
    const w = WASHI_PALETTE[paletteIndex];
    patchActive({
      washi: [...washi, {
        id: Date.now(),
        x: 60 + Math.random() * 280,
        y: 60 + Math.random() * 200,
        rotation: Math.round((Math.random() * 24 - 12) * 10) / 10,
        width: 70 + Math.floor(Math.random() * 50),
        layer: maxCanvasLayer(tasks, washi, decoStickers) + 1,
        ...w,
      }],
    });
  }

  function addPngSticker(assetIndex) {
    const asset = STICKER_PNG_ASSETS[assetIndex];
    if (!asset) return;
    patchActive({
      decoStickers: [...decoStickers, {
        id: Date.now(),
        x: 100 + Math.random() * 280,
        y: 100 + Math.random() * 200,
        rotation: Math.round((Math.random() * 24 - 12) * 10) / 10,
        src: asset.src,
        stickerId: asset.id,
        width: 84,
        layer: maxCanvasLayer(tasks, washi, decoStickers) + 1,
      }],
    });
  }

  function handleLinkClick(taskId) {
    if (!linkFrom) { setLinkFrom(taskId); return; }
    if (linkFrom === taskId) { setLinkFrom(null); return; }
    patchActive({ canvasLinks: [...canvasLinks, { id: Date.now(), fromId: linkFrom, toId: taskId }] });
    setLinkFrom(null);
  }

  function deleteWashi(id) { patchActive({ washi: washi.filter(w => w.id !== id) }); }
  function deleteDeco(id) { patchActive({ decoStickers: decoStickers.filter(s => s.id !== id) }); }

  function patchCanvasLayer(kind, id, layer) {
    if (kind === 'task') {
      setTasks(ts => ts.map(t => t.id === id ? { ...t, layer } : t));
    } else if (kind === 'washi') {
      patchActive({ washi: washi.map(w => w.id === id ? { ...w, layer } : w) });
    } else {
      patchActive({ decoStickers: decoStickers.map(s => s.id === id ? { ...s, layer } : s) });
    }
  }

  function bringCanvasToFront(kind, id) {
    patchCanvasLayer(kind, id, maxCanvasLayer(tasks, washi, decoStickers) + 1);
  }

  function sendCanvasToBack(kind, id) {
    patchCanvasLayer(kind, id, minCanvasLayer(tasks, washi, decoStickers) - 1);
  }

  // ── calendar drop (pointer drag from canvas) ─────────────────────────────────
  function handleKeepGoing() {
    setInterruption(false);
    triggerAI('default');
  }

  const coFlow    = getCoFlowStep(projectName, tasks, interruption);
  const canvasH = computeCanvasH(canvasTasks, washi, decoStickers);
  const weekLabel = weekNavLabel(weekOffset);

  function previewPos(kind, id, x, y) {
    if (dragPreview?.float && kind === 'task') {
      return { x: x ?? 0, y: y ?? 0 };
    }
    if (dragPreview?.kind === kind && dragPreview.id === id && dragPreview.x != null) {
      return { x: dragPreview.x, y: dragPreview.y };
    }
    return { x: x ?? 0, y: y ?? 0 };
  }

  const floatDragTask = dragPreview?.float && dragPreview.kind === 'task'
    ? tasks.find(t => t.id === dragPreview.id)
    : null;

  const notepadTask = notepadTaskId ? tasks.find(t => t.id === notepadTaskId) : null;

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="paper-texture font-sans threadly-app" style={{ background: '#F5EFE3' }}>
      <FontLink />

      {/* ── Top banner ── */}
      <div style={{ background: '#23201D', borderBottom: '3px solid #E85D04', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span className="font-serif" style={{ fontSize: 20, fontWeight: 900, color: '#F3B23C', letterSpacing: '-0.02em' }}>Threadly</span>
        <span className="font-sans"  style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,239,227,0.45)', marginTop: 2 }}>— personal planning wall</span>
      </div>

      <div className="threadly-main">

        {/* ════════════════════════════════
            LEFT — Projects
            ════════════════════════════════ */}
        <div className="panel-shadow threadly-panel-col" style={{ background: '#E85D04', borderRight: '3px solid #6E1F2B' }}>

          {/* Header */}
          <div style={{ padding: '24px 18px 20px' }}>
            <SectionLabel color="#F5EFE3" underline="#6E1F2B" opacity={0.9}>Plan Board</SectionLabel>
            <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 900, color: '#F5EFE3', letterSpacing: '-0.03em', marginTop: 12, lineHeight: 1.1, marginBottom: 0 }}>Your Projects</h2>
          </div>

          <div style={{ height: 1, margin: '0 18px', background: 'rgba(110,31,43,0.28)' }} />

          {/* Scrollable project list */}
          <div className="threadly-panel-scroll" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projects.map(p => {
              const isActive = p.id === active.id;
              const pPct = p.tasks.length ? Math.round(p.tasks.filter(t => t.status === 'done').length / p.tasks.length * 100) : 0;
              const taskCount = p.tasks.length;

              return (
                <div
                  key={p.id}
                  className={isActive ? '' : 'proj-card-inactive'}
                  onClick={() => !isActive && setActiveId(p.id)}
                  style={{
                    background: isActive ? '#F5EFE3' : 'rgba(245,239,227,0.12)',
                    border: isActive ? '3px solid #6E1F2B' : '1.5px solid rgba(245,239,227,0.2)',
                    borderRadius: 4, padding: '10px 12px',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Texture on active card */}
                  {isActive && <div className="diagonal-stripe" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />}

                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
                      <p className="font-sans" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: isActive ? 'rgba(110,31,43,0.55)' : 'rgba(245,239,227,0.45)', marginBottom: 4 }}>
                        {isActive ? 'Active' : taskCount > 0 ? `${taskCount} task${taskCount !== 1 ? 's' : ''}` : 'Empty'}
                      </p>
                      {/* Delete button — only when >1 project */}
                      {projects.length > 1 && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteProject(p.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? 'rgba(110,31,43,0.3)' : 'rgba(245,239,227,0.3)', fontSize: 13, lineHeight: 1, padding: '0 0 2px', flexShrink: 0 }}
                          title="Remove project"
                        >×</button>
                      )}
                    </div>

                    {/* Active: editable name | Inactive: static name */}
                    {isActive ? (
                      <input
                        className="proj-name-input"
                        value={p.name}
                        onChange={e => patchActive({ name: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        placeholder="Name your project…"
                        maxLength={40}
                      />
                    ) : (
                      <p className="font-serif" style={{ fontSize: 14, fontWeight: 700, color: p.name ? '#F5EFE3' : 'rgba(245,239,227,0.4)', letterSpacing: '-0.02em', lineHeight: 1.2, fontStyle: p.name ? 'normal' : 'italic' }}>
                        {p.name || 'Untitled'}
                      </p>
                    )}

                    {/* Progress bar */}
                    <div style={{ marginTop: 8, background: isActive ? '#e2ddd6' : 'rgba(245,239,227,0.15)', height: 5, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pPct}%`, background: 'linear-gradient(90deg, #5FB3B3, #8FAF87)', transition: 'width 0.4s ease' }} />
                    </div>
                    <p className="font-serif" style={{ fontSize: isActive ? 18 : 13, fontWeight: 900, color: isActive ? '#E85D04' : 'rgba(245,239,227,0.55)', letterSpacing: '-0.02em', marginTop: 2 }}>
                      {pPct}%
                    </p>

                    {/* Stats — active project only */}
                    {isActive && tasks.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {[['Total', `${totalHrs}h`], ['Done', `${doneHrs}h`], ['Left', `${totalHrs - doneHrs}h`]].map(([label, val]) => (
                          <div key={label} style={{ background: 'rgba(232,93,4,0.1)', border: '1px solid rgba(110,31,43,0.2)', borderRadius: 3, padding: '3px 7px', display: 'flex', gap: 4, alignItems: 'center' }}>
                            <span className="font-sans" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(35,32,29,0.5)' }}>{label}</span>
                            <span className="font-sans" style={{ fontSize: 12, fontWeight: 700, color: '#23201D' }}>{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* + Add Project */}
          <div style={{ padding: '14px 18px 20px', borderTop: '1px solid rgba(110,31,43,0.22)' }}>
            <button
              onClick={handleAddProject}
              style={{ width: '100%', background: 'rgba(245,239,227,0.12)', border: '1px solid rgba(245,239,227,0.28)', color: '#F5EFE3', borderRadius: 4, padding: '10px 0', fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,239,227,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,239,227,0.12)'}
            >
              + New Project
            </button>
          </div>
        </div>

        {/* ══════════════════════════════
            CENTER — Canvas
            ══════════════════════════════ */}
        <div className="threadly-center-col" style={{ background: '#F5EFE3', borderRight: '3px solid #6E1F2B' }}>

          {/* Canvas header */}
          <div style={{ padding: '26px 24px 22px', borderBottom: '1px solid rgba(110,31,43,0.1)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span
                className="font-sans"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#6E1F2B',
                  opacity: 0.7,
                  borderBottom: '2px solid #F3B23C',
                  paddingBottom: 5,
                  alignSelf: 'flex-start',
                }}
              >
                Task Map
              </span>
              <h1 className="font-serif" style={{ fontSize: 22, fontWeight: 900, color: '#23201D', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
                {projectName.trim() || 'Visual Task Flow'}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 2, flexShrink: 0 }}>
              {canvasTasks.length > 0 && (
                <span className="font-sans" style={{ fontSize: 12, opacity: 0.4, fontWeight: 600, letterSpacing: '0.08em', lineHeight: 1.5, textAlign: 'right', maxWidth: 180 }}>
                  drag cards · double-tap for notes · drop on calendar
                </span>
              )}
              {(tasks.length > 0 || washi.length > 0 || decoStickers.length > 0) && (
                <button
                  onClick={handleClearFlow}
                  style={{ background: 'rgba(245,239,227,0.5)', border: '1px solid rgba(110,31,43,0.18)', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', color: 'rgba(110,31,43,0.55)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'border-color 0.1s, color 0.1s, background 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(110,31,43,0.35)'; e.currentTarget.style.color = 'rgba(110,31,43,0.85)'; e.currentTarget.style.background = 'rgba(245,239,227,0.85)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(110,31,43,0.18)'; e.currentTarget.style.color = 'rgba(110,31,43,0.55)'; e.currentTarget.style.background = 'rgba(245,239,227,0.5)'; }}
                >
                  Clear Flow
                </button>
              )}
            </div>
          </div>

          {/* Decorate toolbar */}
          <div style={{ padding: '14px 24px 16px', borderBottom: '1px solid rgba(110,31,43,0.08)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: 'rgba(245,239,227,0.35)' }}>
            <span className="font-sans" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(35,32,29,0.4)', marginRight: 6 }}>Decorate</span>
            {WASHI_PALETTE.map((w, i) => (
              <button
                key={i}
                type="button"
                className="canvas-toolbar-btn canvas-toolbar-tape"
                onClick={() => addWashi(i)}
                title={`Add ${w.label} tape`}
                aria-label={`Add ${w.label} tape`}
              >
                <span className="canvas-toolbar-swatch" style={{ background: w.color, opacity: w.opacity }} />
              </button>
            ))}
            <span style={{ width: 1, height: 16, background: 'rgba(110,31,43,0.15)', margin: '0 2px' }} />
            <button
              type="button"
              className={`canvas-toolbar-btn ${linkMode ? 'canvas-toolbar-btn-active' : ''}`}
              onClick={() => { setLinkMode(v => !v); setLinkFrom(null); }}
            >
              ↗ {linkMode ? (linkFrom ? 'pick target…' : 'link from…') : 'Link cards'}
            </button>
          </div>

          {/* Free canvas */}
          <div
            ref={canvasRef}
            className="free-canvas threadly-canvas-scroll"
          >
            <div className="dot-pattern" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

            {canvasTasks.length === 0 && washi.length === 0 && decoStickers.length === 0 ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, pointerEvents: 'none' }}>
                <div style={{ display: 'flex', gap: 12, opacity: 0.2 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="ghost-card" style={{ width: 100, height: 120, transform: `rotate(${[-2, 1, -1][i]}deg)` }} />
                  ))}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p className="font-serif" style={{ fontSize: 20, fontWeight: 900, color: '#6E1F2B', opacity: 0.28, letterSpacing: '-0.02em', marginBottom: 8 }}>
                    {projectName.trim() ? 'Your free wall.' : 'No project selected.'}
                  </p>
                  <p className="font-sans" style={{ fontSize: 13, color: '#23201D', opacity: 0.25, lineHeight: 1.7 }}>
                    Add tasks, drag them anywhere, tape & stickers from the bar above.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', minWidth: 720, height: canvasH, padding: '20px 16px 24px' }}>
                {washi.map(w => {
                  const pos = previewPos('washi', w.id, w.x, w.y);
                  return (
                    <WashiStrip
                      key={w.id}
                      item={w}
                      displayX={pos.x}
                      displayY={pos.y}
                      onPointerDown={handleCanvasPointerDown}
                      onDelete={deleteWashi}
                      onBringFront={() => bringCanvasToFront('washi', w.id)}
                      onSendBack={() => sendCanvasToBack('washi', w.id)}
                      isDragging={draggingId === w.id}
                    />
                  );
                })}
                {decoStickers.map(s => {
                  const pos = previewPos('deco', s.id, s.x, s.y);
                  return (
                    <DecoStickerPlay
                      key={s.id}
                      item={s}
                      displayX={pos.x}
                      displayY={pos.y}
                      onPointerDown={handleCanvasPointerDown}
                      onDelete={deleteDeco}
                      onBringFront={() => bringCanvasToFront('deco', s.id)}
                      onSendBack={() => sendCanvasToBack('deco', s.id)}
                      isDragging={draggingId === s.id}
                    />
                  );
                })}
                {canvasTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMarkDone={handleMarkDone}
                    onPointerDown={handleCanvasPointerDown}
                    onOpenNotepad={openTaskNotepad}
                    onDelete={handleDeleteTask}
                    onBringFront={() => bringCanvasToFront('task', task.id)}
                    onSendBack={() => sendCanvasToBack('task', task.id)}
                    linkMode={linkMode}
                    isLinkSource={linkFrom === task.id}
                    onLinkClick={handleLinkClick}
                    isFloatDragging={dragPreview?.float && dragPreview.id === task.id}
                  />
                ))}
                <CanvasConnectors tasks={canvasTasks} canvasLinks={canvasLinks} />
              </div>
            )}

            {interruption && (
              <div className="sticky-shadow slide-down rotate-m1" style={{ position: 'absolute', bottom: 70, right: 30, background: '#6E1F2B', border: '2px solid #E85D04', padding: '16px 14px 12px', borderRadius: 3, maxWidth: 160, zIndex: 20 }}>
                <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', width: 36, height: 14, background: 'rgba(245,239,227,0.55)', borderRadius: 2 }} />
                <p className="font-sans"  style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#F3B23C', marginBottom: 5, opacity: 0.8 }}>Interruption Log</p>
                <p className="font-serif" style={{ fontSize: 13, fontWeight: 700, color: '#F5EFE3', lineHeight: 1.3 }}>Life happened — and that's okay.</p>
                <p className="font-sans"  style={{ fontSize: 11, color: 'rgba(245,239,227,0.7)', marginTop: 5 }}>Wed blocked. Re-routed.</p>
              </div>
            )}

            {notepadTask && (
              <TaskNotepad
                task={notepadTask}
                draft={notepadDraft}
                onChange={setNotepadDraft}
                onSave={saveTaskNotepad}
                onClose={() => closeTaskNotepad(true)}
                onDelete={() => handleDeleteTask(notepadTask.id)}
                overlayRef={notepadOverlayRef}
                paperRef={notepadPaperRef}
              />
            )}
          </div>

          {/* Add task bar */}
          <div style={{ borderTop: '2px dashed rgba(110,31,43,0.15)', padding: '10px 20px', display: 'flex', alignItems: showAddTask ? 'flex-start' : 'center', gap: 10, background: 'rgba(245,239,227,0.6)' }}>
            {showAddTask ? (
              <div className="slide-down" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <label className="add-task-label">Task</label>
                    <input
                      className="add-task-input"
                      autoFocus
                      value={newTaskForm.title}
                      onChange={e => patchTaskForm('title', e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleAddTask(); if (e.key === 'Escape') resetTaskForm(); }}
                      placeholder="What needs doing?"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 180px' }}>
                    <label className="add-task-label">Context</label>
                    <input
                      className="add-task-input"
                      value={newTaskForm.note}
                      onChange={e => patchTaskForm('note', e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleAddTask(); if (e.key === 'Escape') resetTaskForm(); }}
                      placeholder="Notes for the AI…"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <label className="add-task-label">Time</label>
                    <select className="add-task-select" value={newTaskForm.time} onChange={e => patchTaskForm('time', e.target.value)}>
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="add-task-label">Urgency</label>
                    <select className="add-task-select" value={newTaskForm.urgency} onChange={e => patchTaskForm('urgency', e.target.value)}>
                      {URGENCY_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="add-task-label">Deadline</label>
                    <select className="add-task-select" value={newTaskForm.deadline} onChange={e => patchTaskForm('deadline', e.target.value)}>
                      {deadlineOptions.map(d => <option key={d.value || 'none'} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <button className="btn-primary" onClick={handleAddTask} style={{ padding: '7px 14px', fontSize: 12, alignSelf: 'flex-end' }}>Add</button>
                  <button onClick={resetTaskForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(35,32,29,0.35)', fontSize: 16, lineHeight: 1, alignSelf: 'flex-end', paddingBottom: 6 }} title="Cancel">✕</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTask(true)}
                style={{ background: 'none', border: '2px dashed rgba(110,31,43,0.2)', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', color: 'rgba(35,32,29,0.4)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                onMouseEnter={e => { e.target.style.borderColor = 'rgba(110,31,43,0.4)'; e.target.style.color = 'rgba(35,32,29,0.65)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'rgba(110,31,43,0.2)'; e.target.style.color = 'rgba(35,32,29,0.4)'; }}
              >
                + Add Task
              </button>
            )}
            {!showAddTask && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="font-sans" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.32, marginRight: 2 }}>Status</span>
              {['not-started', 'doing', 'blocked', 'done'].map(s => <StatusChip key={s} status={s} />)}
            </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════
            RIGHT — Focus desk
            ══════════════════════════════ */}
        <div className="threadly-panel-col threadly-panel-scroll" style={{ background: '#6E1F2B', padding: '22px 16px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          <div>
            <SectionLabel color="#F3B23C" underline="#F3B23C" opacity={0.85}>Local Time</SectionLabel>
            <div style={{ marginTop: 14, background: 'rgba(35,32,29,0.28)', border: '1px solid rgba(243,178,60,0.22)', borderRadius: 4, padding: '14px 12px', textAlign: 'center' }}>
              <p className="live-clock-time">
                {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="font-sans" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(245,239,227,0.55)', marginTop: 8, lineHeight: 1.4 }}>
                {now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {(coFlow.id === 'name' || coFlow.id === 'recover') && (
            <div style={{ background: 'rgba(35,32,29,0.22)', border: '1px solid rgba(243,178,60,0.2)', borderRadius: 4, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {coFlow.id === 'name' && (
                <p className="coflow-prompt" style={{ fontSize: 13 }}>Name your project in the <strong style={{ color: '#F3B23C' }}>orange panel</strong> first.</p>
              )}
              {coFlow.id === 'recover' && (
                <>
                  <p className="coflow-prompt" style={{ fontSize: 13 }}>Week got messy? Replan or keep going.</p>
                  <button onClick={handleReplanning} style={{ width: '100%', background: 'transparent', border: '2px solid rgba(143,175,135,0.5)', borderRadius: 4, color: '#8FAF87', fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '7px 0', cursor: 'pointer' }}>Replan week</button>
                  <button type="button" className="coflow-link" onClick={handleKeepGoing}>Keep going</button>
                </>
              )}
            </div>
          )}

          {/* Focus timer */}
          <div>
            <SectionLabel color="#F3B23C" underline="#F3B23C" opacity={0.85}>Focus Session</SectionLabel>
            <div style={{ marginTop: 14, background: 'rgba(35,32,29,0.28)', border: '1px solid rgba(95,179,179,0.22)', borderRadius: 4, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!timerRunning ? (
                <>
                  <p className="font-sans" style={{ fontSize: 12, color: 'rgba(245,239,227,0.65)', lineHeight: 1.45 }}>
                    Pick a card, hit start — timer matches its block ({pickerTask?.time ?? '1 hr'}).
                  </p>
                  {focusableTasks.length > 0 ? (
                    <select
                      className="assign-select"
                      style={{ width: '100%' }}
                      value={selectedTimerTaskId ?? focusableTasks[0]?.id ?? ''}
                      onChange={e => setSelectedTimerTaskId(Number(e.target.value))}
                    >
                      {focusableTasks.map(t => (
                        <option key={t.id} value={t.id}>{t.title} · {t.time}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-sans" style={{ fontSize: 11, color: 'rgba(245,239,227,0.35)', fontStyle: 'italic' }}>Add a task to start a session</p>
                  )}
                  <button className="timer-btn-primary" onClick={handleStartTimer} disabled={focusableTasks.length === 0}>
                    ▶ Start focus
                  </button>
                </>
              ) : (
                <>
                  <p className="font-sans" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(243,178,60,0.6)', textAlign: 'center' }}>
                    {timerStatus === 'finished' ? 'Time\'s up!' : timerStatus === 'paused' ? 'Paused' : 'In session'}
                  </p>
                  <p className="font-serif" style={{ fontSize: 13, fontWeight: 700, color: '#F5EFE3', textAlign: 'center', lineHeight: 1.3, opacity: 0.85 }}>
                    {timerTask?.title}
                  </p>
                  <div className={`timer-display ${timerStatus === 'finished' ? 'timer-finished' : ''}`}>
                    {formatTimerDisplay(timerSecondsLeft)}
                  </div>
                  <div className="timer-bar">
                    <div className="timer-bar-fill" style={{ width: `${timerProgress}%` }} />
                  </div>
                  <p className="font-sans" style={{ fontSize: 12, color: 'rgba(245,239,227,0.4)', textAlign: 'center' }}>
                    {timerTask?.time} block · {Math.round(timerProgress)}% done
                  </p>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {timerStatus === 'paused' ? (
                      <button className="timer-btn" onClick={handleResumeTimer}>Resume</button>
                    ) : timerStatus !== 'finished' ? (
                      <button className="timer-btn" onClick={handlePauseTimer}>Pause</button>
                    ) : (
                      <button className="timer-btn" onClick={handleRestartTimer}>Restart</button>
                    )}
                    {timerStatus !== 'finished' && (
                      <button className="timer-btn" onClick={handleRestartTimer}>Restart</button>
                    )}
                    <button className="timer-btn" onClick={handleEndTimer}>End</button>
                  </div>
                  {timerTask && timerTask.status !== 'done' && (
                    <button
                      className="btn-primary"
                      style={{ width: '100%', fontSize: 11, padding: '7px 0' }}
                      onClick={() => handleMarkDone(timerTask.id)}
                    >
                      ✓ Mark done
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sticker wall — PNG tray */}
          <div>
            <SectionLabel color="#F3B23C" underline="#F3B23C" opacity={0.85}>Sticker Wall</SectionLabel>
            <p className="font-sans" style={{ fontSize: 12, color: 'rgba(245,239,227,0.55)', marginTop: 12, marginBottom: 12, lineHeight: 1.55 }}>
              Tap a sticker to drop it on the canvas — then drag it anywhere.
            </p>
            <div className="sticker-tray-grid">
              {STICKER_PNG_ASSETS.map((asset, i) => (
                <button
                  key={asset.id}
                  type="button"
                  className="sticker-tray-item"
                  onClick={() => addPngSticker(i)}
                  title={`Add ${asset.label}`}
                >
                  <img src={asset.src} alt={asset.label} draggable={false} />
                </button>
              ))}
            </div>
          </div>

          {coFlow.id === 'active' && (
            <div>
              <button type="button" className="coflow-link" style={{ textAlign: 'left' }} onClick={() => setShowAdjust(v => !v)}>
                {showAdjust ? '▾ Something changed?' : '▸ Something changed?'}
              </button>
              {showAdjust && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  <button className="btn-orange" style={{ width: '100%', padding: '7px 0', fontSize: 11 }} onClick={handleSomethingCameUp}>Life happened</button>
                  <button onClick={handleReplanning} style={{ width: '100%', background: 'transparent', border: '2px solid rgba(143,175,135,0.5)', borderRadius: 4, color: '#8FAF87', fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '7px 0', cursor: 'pointer' }}>Replan week</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom calendar strip ── */}
      <div className="threadly-calendar-strip" style={{ background: '#23201D', borderTop: '3px solid #E85D04', padding: '16px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="week-nav-btn"
              onClick={() => navigateWeek(-1)}
              aria-label="Previous week"
            >
              ←
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SectionLabel color="#F3B23C" underline="#F3B23C" opacity={0.85}>Week View</SectionLabel>
              {weekLabel && (
                <span className="font-sans" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(243,178,60,0.72)' }}>
                  {weekLabel}
                </span>
              )}
              <h3 className="font-serif" style={{ fontSize: 15, fontWeight: 700, color: '#F5EFE3', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                {formatWeekRange(weekOffset)}
              </h3>
            </div>
            <button
              type="button"
              className="week-nav-btn"
              onClick={() => navigateWeek(1)}
              aria-label="Next week"
            >
              →
            </button>
          </div>
          {canvasTasks.length > 0 && !pendingAssign && (
            <span className="font-sans" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: dragOverCalDay != null ? '#5FB3B3' : 'rgba(245,239,227,0.35)' }}>
              {dragOverCalDay != null ? 'Release on the day to schedule' : 'Drag a card onto a day below'}
            </span>
          )}
        </div>

        {pendingAssign && (() => {
          const task = tasks.find(t => t.id === pendingAssign.taskId);
          const day = calendar[pendingAssign.dayIndex];
          if (!task || !day) return null;
          return (
            <div className="assign-bar" style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p className="font-sans" style={{ fontSize: 12, fontWeight: 600, color: '#F5EFE3', lineHeight: 1.4 }}>
                Schedule <strong style={{ color: '#F3B23C' }}>{task.title}</strong> on {dayLabel(day)}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="font-sans" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,239,227,0.45)' }}>When</span>
                  <select
                    className="assign-select"
                    value={pendingAssign.slot}
                    onChange={e => setPendingAssign(a => ({ ...a, slot: e.target.value }))}
                  >
                    {SLOT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="font-sans" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,239,227,0.45)' }}>Block</span>
                  <select
                    className="assign-select"
                    value={pendingAssign.duration}
                    onChange={e => setPendingAssign(a => ({ ...a, duration: e.target.value }))}
                  >
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 11 }} onClick={handleConfirmAssign}>Schedule</button>
                <button type="button" className="coflow-link" style={{ color: 'rgba(245,239,227,0.45)' }} onClick={() => setPendingAssign(null)}>Cancel</button>
              </div>
            </div>
          );
        })()}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {calendar.map((day, i) => {
            const entries = getCalEntries(day);
            const isToday = weekOffset === 0 && isTodayDay(day);
            return (
              <div
                key={day.iso ?? i}
                data-cal-day={i}
                className={dragOverCalDay === i ? 'cal-day-drop' : ''}
                style={{
                  background: isToday ? 'rgba(243,178,60,0.12)' : 'rgba(245,239,227,0.05)',
                  borderRadius: 4,
                  border: day.isInterruption
                    ? '1.5px solid rgba(232,93,4,0.5)'
                    : isToday
                      ? '1.5px solid rgba(243,178,60,0.55)'
                      : dragOverCalDay === i ? undefined : '1px solid rgba(245,239,227,0.08)',
                  padding: '8px 6px',
                  minHeight: 72,
                  transition: 'background 0.12s',
                }}
              >
                <p className="font-sans"  style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isToday ? 'rgba(243,178,60,0.85)' : 'rgba(245,239,227,0.45)', marginBottom: 2 }}>{day.day}</p>
                <p className="font-serif" style={{ fontSize: 15, fontWeight: 700, color: '#F5EFE3', marginBottom: 5 }}>{day.date}</p>
                {entries.length === 0
                  ? <p className="font-sans" style={{ fontSize: 11, color: dragOverCalDay === i ? 'rgba(95,179,179,0.7)' : 'rgba(245,239,227,0.2)' }}>
                      {dragOverCalDay === i ? 'Release to schedule' : 'Free'}
                    </p>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {entries.map((entry, j) => {
                        const blockText = entry.textColor ?? textColorForBg(entry.color);
                        return (
                        <div
                          key={entry.taskId ?? `entry-${j}`}
                          className="cal-block"
                          style={{
                            background: entry.color ?? BRAND.teal,
                            color: blockText,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 4,
                            whiteSpace: 'normal',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            {entry.slot && <div className="cal-entry-slot">{entry.slot}{entry.duration ? ` · ${entry.duration}` : ''}</div>}
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.label}</div>
                          </div>
                          {entry.taskId && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCalendar(entry.taskId)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: blockText, opacity: 0.5, fontSize: 13, lineHeight: 1, padding: 0, flexShrink: 0 }}
                              title="Remove from day"
                            >×</button>
                          )}
                          {!entry.taskId && entry.label && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCalendarEntry(i, j)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: blockText, opacity: 0.5, fontSize: 13, lineHeight: 1, padding: 0, flexShrink: 0 }}
                              title="Remove from day"
                            >×</button>
                          )}
                        </div>
                        );
                      })}
                    </div>
                }
              </div>
            );
          })}
        </div>
      </div>

      {floatDragTask && dragPreview && (
        <TaskDragGhost
          task={floatDragTask}
          clientX={dragPreview.clientX}
          clientY={dragPreview.clientY}
          grabX={dragPreview.grabX}
          grabY={dragPreview.grabY}
        />
      )}
    </div>
  );
}
