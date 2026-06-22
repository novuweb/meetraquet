import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

// Protege rutas privadas y obliga a completar el onboarding antes de usar la app.
export default function ProtectedRoute({ children, requireCompleteProfile = true }) {
  const { session, loadingSession, profile, loadingProfile } = useAuth();

  if (loadingSession || (session && loadingProfile)) {
    return <div className="center-screen"><div className="spinner" /></div>;
  }

  if (!session) return <Navigate to="/login" replace />;

  if (requireCompleteProfile && profile && !profile.perfil_completo) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
