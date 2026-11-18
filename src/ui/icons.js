// Small stroke icons (24px grid, currentColor).
const I = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICON = {
  today: I(`<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>`),
  week: I(`<path d="M4 5h16M4 10h16M4 15h16M4 20h10"/>`),
  block: I(`<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16M13 4v16M18 4v5"/>`),
  library: I(`<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>`),
  back: I(`<path d="M15 5l-7 7 7 7"/>`),
  prev: I(`<path d="M15 5l-7 7 7 7"/>`),
  next: I(`<path d="M9 5l7 7-7 7"/>`),
  more: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`,
  close: I(`<path d="M6 6l12 12M18 6 6 18"/>`),
  search: I(`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`),
  swap: I(`<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>`),
  plus: I(`<path d="M12 5v14M5 12h14"/>`),
  minus: I(`<path d="M5 12h14"/>`),
  run: I(`<circle cx="14" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v4M6 12l3-3 4 1 3 4 3 1M10 15l-1-4"/>`),
  timer: I(`<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>`),
};
