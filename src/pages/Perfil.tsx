import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Package, Heart, Store, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Perfil = () => {
  const { user, profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
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
            {profile?.logo_empresa ? (
              <img
                src={profile.logo_empresa}
                alt="Foto de perfil"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{profile?.nome || "Usuário"}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/editar-perfil")}
            >
              Editar
            </Button>
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
            onClick={() => navigate("/favoritos")}
          >
            <Heart className="h-5 w-5 mr-2" />
            Meus Favoritos
          </Button>

          {userRole === 'vendedor' ? (
            <>
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
                className="w-full justify-start"
                onClick={() => navigate("/pedidos")}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Minhas Compras
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/pedidos")}
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Meus Pedidos
            </Button>
          )}

          {userRole === "vendedor" && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/painel-vendedor")}
            >
              <Store className="h-5 w-5 mr-2" />
              Painel do Vendedor
            </Button>
          )}

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