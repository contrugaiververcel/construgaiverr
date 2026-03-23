import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

// Hardcoded Admin Credentials
const ADMIN_USERNAME = "construgaiver-admin!@";
const ADMIN_PASSWORD = "Paineladministrativo!@constru";
const ADMIN_SESSION_KEY = "construgaiver_admin_session";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Trim whitespace from inputs before comparing
    if (username.trim() === ADMIN_USERNAME && password.trim() === ADMIN_PASSWORD) {
      // Simulate successful admin login by setting a session token
      localStorage.setItem(ADMIN_SESSION_KEY, "true");
      toast.success("Login administrativo realizado!");
      navigate("/gerenciar-painel-administrativo");
    } else {
      toast.error("Credenciais inválidas.");
    }
    setLoading(false);
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
            Insira as credenciais de administrador
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              type="text"
              placeholder="Usuário Admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
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