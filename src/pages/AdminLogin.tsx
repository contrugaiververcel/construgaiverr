import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

// ⚠️  CREDENCIAIS REMOVIDAS DO CÓDIGO-FONTE
// O login admin agora usa Supabase Auth real (e-mail + senha).
// Para configurar:
//   1. Crie (ou use) um usuário no Supabase Auth Dashboard
//   2. Execute no SQL Editor:
//      INSERT INTO public.admin_users (user_id) VALUES ('<UUID>');

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Autenticar via Supabase Auth (server-side)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // 2. Verificar server-side se este usuário é administrador
      const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin", {
        _user_id: data.user.id,
      });

      if (adminError || !isAdmin) {
        // Faz logout imediatamente para não deixar sessão ativa de não-admin
        await supabase.auth.signOut();
        toast.error("Acesso negado. Usuário não é administrador.");
        return;
      }

      toast.success("Login administrativo realizado!");
      navigate("/gerenciar-painel-administrativo");
    } catch (error: any) {
      const msg = error?.message || "Credenciais inválidas.";
      // Traduz mensagens comuns do Supabase para português
      if (msg.includes("Invalid login credentials")) {
        toast.error("E-mail ou senha incorretos.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-background">
        <div className="text-center space-y-2">
          <div className="inline-block p-2 rounded-lg bg-primary shadow-lg">
            <img src={logo} alt="Construgaiver" className="h-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold">Acesso Administrativo</h1>
          <p className="text-sm text-muted-foreground">
            Insira suas credenciais de administrador
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verificando..." : "Entrar no Painel"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;