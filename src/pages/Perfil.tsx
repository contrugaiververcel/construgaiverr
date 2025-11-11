import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Perfil = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/home");
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold">Perfil</h1>
          <Card className="p-8 text-center space-y-4">
            <User className="h-16 w-16 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Faça login para acessar seu perfil</p>
            <Button onClick={() => navigate("/auth")}>Entrar</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Perfil</h1>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.nome || "Usuário"}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {profile?.cidade && (
            <div className="text-sm">
              <span className="text-muted-foreground">Localização: </span>
              <span>
                {profile.cidade}
                {profile.bairro && ` - ${profile.bairro}`}
              </span>
            </div>
          )}

          {profile?.telefone && (
            <div className="text-sm">
              <span className="text-muted-foreground">Telefone: </span>
              <span>{profile.telefone}</span>
            </div>
          )}
        </Card>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate("/meus-anuncios")}
          >
            <Package className="h-5 w-5 mr-2" />
            Meus Anúncios
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Perfil;
