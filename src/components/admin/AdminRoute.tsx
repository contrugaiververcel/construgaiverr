import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, ShieldX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute — Guard de rota para o painel administrativo.
 *
 * Verifica via Supabase (server-side) se o usuário logado tem
 * permissão de administrador antes de renderizar o conteúdo.
 * Redireciona para /admin-login caso não esteja autenticado ou
 * não possua a permissão necessária.
 */
const AdminRoute = ({ children }: AdminRouteProps) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "authorized" | "denied">("checking");
  const { user, loading: authLoading } = useAuth(); // Usando o estado global confiável!

  useEffect(() => {
    const checkAdmin = async () => {
      // Aguarda o AuthContext terminar de carregar a sessão global
      if (authLoading) return;

      if (!user) {
        navigate("/admin-login", { replace: true });
        return;
      }

      try {
        const { data: adminCheck, error } = await supabase.rpc("is_admin", {
          _user_id: user.id,
        });

        if (error || !adminCheck) {
          setStatus("denied");
          setTimeout(() => navigate("/admin-login", { replace: true }), 1500);
          return;
        }

        setStatus("authorized");
      } catch {
        navigate("/admin-login", { replace: true });
      }
    };

    checkAdmin();
  }, [user, authLoading, navigate]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <ShieldX className="w-12 h-12 text-destructive" />
        <p className="text-lg font-semibold text-destructive">Acesso negado</p>
        <p className="text-sm text-muted-foreground">Redirecionando...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
