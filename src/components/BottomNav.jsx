import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';

const IconMatch = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="5" />
    <circle cx="16" cy="16" r="5" />
  </svg>
);
const IconMessages = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const IconRanking = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19h16M7 19V11M12 19V5M17 19v-7" />
  </svg>
);
const IconClubs = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconProfile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />
  </svg>
);

const ITEMS = [
  { to: '/', label: 'Partidos', Icon: IconMatch },
  { to: '/mensajes', label: 'Mensajes', Icon: IconMessages },
  { to: '/ranking', label: 'Ranking', Icon: IconRanking },
  { to: '/clubs', label: 'Clubs', Icon: IconClubs },
  { to: '/perfil', label: 'Perfil', Icon: IconProfile },
];

export default function BottomNav() {
  const navRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const scrollEl = document.querySelector('.scroll-area');
    if (!scrollEl || !navRef.current) return;

    const onScroll = () => {
      const current = scrollEl.scrollTop;
      const atBottom = scrollEl.scrollHeight - current - scrollEl.clientHeight < 10;

      if (atBottom || current < lastScrollY.current) {
        navRef.current?.classList.remove('nav-hidden');
      } else if (current > lastScrollY.current && current > 40) {
        navRef.current?.classList.add('nav-hidden');
      }
      lastScrollY.current = current;
    };

    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="bottom-nav" ref={navRef}>
      {ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => (isActive ? 'active' : '')}
          end={to === '/'}
        >
          <span className="icon"><Icon /></span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
