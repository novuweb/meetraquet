import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth.jsx';
import { ModoProvider } from './hooks/useModo.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import BottomNav from './components/BottomNav.jsx';
import Tutorial, { tutorialYaVisto } from './components/Tutorial.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Matchmaking from './pages/Matchmaking.jsx';
import Messages from './pages/Messages.jsx';
import ChatRoom from './pages/ChatRoom.jsx';
import Ranking from './pages/Ranking.jsx';
import ClubsPage from './pages/ClubsPage.jsx';
import Profile from './pages/Profile.jsx';
import PlayerProfile from './pages/PlayerProfile.jsx';
import PagoExitoso from './pages/PagoExitoso.jsx';
import SelectorModo from './pages/SelectorModo.jsx';

const RUTAS_SIN_NAV = ['/login', '/onboarding', '/pago-exitoso', '/modo'];

export default function App() {
  useTheme(); // aplica data-theme guardado en localStorage al cargar
  const location = useLocation();
  const { profile, user } = useAuth();
  const [tutorialVisible, setTutorialVisible] = useState(false);

  const mostrarNav = !RUTAS_SIN_NAV.some((r) => location.pathname.startsWith(r))
    && !location.pathname.startsWith('/chat/')
    && !location.pathname.startsWith('/jugador/')
    && !location.pathname.startsWith('/pago-exitoso');

  useEffect(() => {
    if (profile?.perfil_completo && user?.id && !tutorialYaVisto(user.id)) {
      setTutorialVisible(true);
    }
  }, [profile?.perfil_completo, user?.id]);

  return (
    <ModoProvider>
      <div className="app-shell">
        <div className="scroll-area">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<ProtectedRoute requireCompleteProfile={false}><Onboarding /></ProtectedRoute>} />
            <Route path="/modo" element={<ProtectedRoute><SelectorModo /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Matchmaking /></ProtectedRoute>} />
            <Route path="/mensajes" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/chat/:chatId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
            <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
            <Route path="/clubs" element={<ProtectedRoute><ClubsPage /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/jugador/:id" element={<ProtectedRoute><PlayerProfile /></ProtectedRoute>} />
            <Route path="/pago-exitoso" element={<PagoExitoso />} />
          </Routes>
        </div>
        {mostrarNav && <BottomNav />}
        {tutorialVisible && <Tutorial uid={user?.id} onFinish={() => setTutorialVisible(false)} />}
      </div>
    </ModoProvider>
  );
}
