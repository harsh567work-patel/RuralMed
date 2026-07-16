const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export default function Ic({ n, s = 16 }) {
  const m = {
    home:   <svg width={s} height={s} viewBox="0 0 24 24" {...P}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    users:  <svg width={s} height={s} viewBox="0 0 24 24" {...P}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    rx:     <svg width={s} height={s} viewBox="0 0 24 24" {...P}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>,
    refer:  <svg width={s} height={s} viewBox="0 0 24 24" {...P}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    msg:    <svg width={s} height={s} viewBox="0 0 24 24" {...P}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    grid:   <svg width={s} height={s} viewBox="0 0 24 24" {...P}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    menu:   <svg width={s} height={s} viewBox="0 0 24 24" {...P}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    search: <svg width={s} height={s} viewBox="0 0 24 24" {...P}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    plus:   <svg width={s} height={s} viewBox="0 0 24 24" {...P} strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash:  <svg width={s} height={s} viewBox="0 0 24 24" {...P}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
    print:  <svg width={s} height={s} viewBox="0 0 24 24" {...P}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    save:   <svg width={s} height={s} viewBox="0 0 24 24" {...P}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    check:  <svg width={s} height={s} viewBox="0 0 24 24" {...P} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    logout: <svg width={s} height={s} viewBox="0 0 24 24" {...P}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    eye:    <svg width={s} height={s} viewBox="0 0 24 24" {...P}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    pulse:  <svg width={s} height={s} viewBox="0 0 24 24" {...P}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    moon:   <svg width={s} height={s} viewBox="0 0 24 24" {...P}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
    sun:    <svg width={s} height={s} viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  };
  return m[n] || null;
}
