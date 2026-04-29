import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

/**
 * AuthProvider — envolve o app e expõe estado de autenticação.
 * --------------------------------------------------------------
 * Supabase Auth cuida de:
 *  - Persistência da sessão (localStorage)
 *  - Refresh do token automaticamente
 *  - Evento onAuthStateChange (login, logout, refresh)
 *
 * Aqui só precisamos escutar esse evento e expor user/loading.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega sessão atual (se já estiver logado, vem instantâneo do localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças (login/logout em outras abas, refresh, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }

  async function register({ name, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // armazena no user_metadata
      },
    });
    if (error) throw error;

    // Se o projeto exigir confirmação por email, data.session será null.
    // Avisamos o usuário pra clicar no link recebido.
    if (!data.session) {
      throw new Error('CONFIRM_EMAIL');
    }
    return data.user;
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  // Wrapper para extrair nome amigável (vem do user_metadata)
  const userInfo = user
    ? {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
      }
    : null;

  return (
    <AuthContext.Provider value={{ user: userInfo, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve estar dentro de AuthProvider');
  return ctx;
}
