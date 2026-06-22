import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: 'Match', icon: '🎾' },
  { to: '/mensajes', label: 'Mensajes', icon: '💬' },
  { to: '/ranking', label: 'Ranking', icon: '🏆' },
  { to: '/mapa', label: 'Mapa', icon: '📍' },
  { to: '/perfil', label: 'Perfil', icon: '👤' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => (isActive ? 'active' : '')}
          end={item.to === '/'}
        >
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
