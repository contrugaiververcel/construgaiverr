import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'usuarios'>;
type UserRole = 'cliente' | 'vendedor' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  userRole: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tempo máximo (ms) para esperar o carregamento até liberar o app
const AUTH_TIMEOUT_MS = 5000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Timeout de segurança: se auth demorar mais de 5s, libera o app mesmo assim
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, AUTH_TIMEOUT_MS);

    // onAuthStateChange é a fonte de verdade oficial do Supabase.
    // ATENÇÃO: NÃO DEVE CONTER QUERIE "AWAIT" AQUI DENTRO! 
    // Pois a query tenta chamar `getSession()`, que espera o `onAuthStateChange` terminar, gerando um DEADLOCK CIRCULAR nas abas!
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;

        const currentUser = newSession?.user ?? null;
        setSession(newSession);
        setUser(currentUser);

        if (!currentUser) {
          setProfile(null);
          setUserRole(null);
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  // Busca dados de perfil SEPARADAMENTE após o usuário ser definido (fora do escopo do onAuthStateChange)
  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async (currentUser: User) => {
      try {
        const [profileResult, roleResult] = await Promise.all([
          supabase
            .from('usuarios')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle(),
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentUser.id)
            .maybeSingle(),
        ]);

        if (!isMounted) return;

        setProfile(profileResult.data ?? null);
        setUserRole((roleResult.data?.role as UserRole) ?? null);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        if (isMounted) {
          setProfile(null);
          setUserRole(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (user) {
      // Começa o loading do perfil, e busca os dados
      fetchUserData(user);
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setUserRole(null);
  };

  const value = {
    session,
    user,
    profile,
    userRole,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};