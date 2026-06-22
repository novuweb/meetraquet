import { Routes, Route, useLocation } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import BottomNav from './components/BottomNav.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Matchmaking from './pages/Matchmaking.jsx';
import Messages from './pages/Messages.jsx';
import ChatRoom from './pages/ChatRoom.jsx';
import Ranking from './pages/Ranking.jsx';
import MapPage from './pages/MapPage.jsx';
import Profile from './pages/Profile.jsx';

const RUTAS_SIN_NAV = ['/login', '/onboarding'];

export default function App() {
  useTheme(); // aplica data-theme guardado en localStorage al cargar
  const location = useLocation();
  const mostrarNav = !RUTAS_SIN_NAV.some((r) => location.pathname.startsWith(r))
    && !location.pathname.startsWith('/chat/');

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<ProtectedRoute requireCompleteProfile={false}><Onboarding /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Matchmaking /></ProtectedRoute>} />
        <Route path="/mensajes" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/chat/:chatId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
        <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
        <Route path="/mapa" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
      {mostrarNav && <BottomNav />}
    </div>
  );
}
