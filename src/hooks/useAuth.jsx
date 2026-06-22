import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DEMO_MODE } from '../lib/demo';
import { demoPerfilPropio, DEMO_USER_ID } from '../lib/demoData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(DEMO_MODE ? { user: { id: DEMO_USER_ID } } : undefined);
  const [profile, setProfile] = useState(DEMO_MODE ? demoPerfilPropio : null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) return; // sesión y perfil demo ya inicializados arriba
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    setLoadingProfile(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!error) setProfile(data);
    setLoadingProfile(false);
    return data;
  }

  useEffect(() => {
    if (DEMO_MODE) return;
    if (session?.user?.id) {
      fetchProfile(session.user.id);
    } else if (session === null) {
      setProfile(null);
    }
  }, [session?.user?.id]);

  async function signUp(email, password, nombre) {
    if (DEMO_MODE) return { error: null };
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });
  }

  async function signIn(email, password) {
    if (DEMO_MODE) return { error: null };
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    if (DEMO_MODE) return;
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (DEMO_MODE) return profile;
    if (session?.user?.id) return fetchProfile(session.user.id);
    return null;
  }

  const value = {
    session,
    user: session?.user || null,
    profile,
    loadingProfile,
    loadingSession: session === undefined,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    setProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
