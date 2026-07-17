import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Favoritos = () => {
  const { user, loading: authLoading } = useAuth();
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      fetchFavoritos();
    } else {
      setLoading(false);
      setFavoritos([]);
    }
  }, [user, authLoading]);

  const fetchFavoritos = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("favoritos")
        .select("*, anuncio:anuncios(*)")
        .eq("usuario_id", user.id);

      if (error) throw error;
      setFavoritos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar favoritos");
    } finally {
      setLoading(false);
    }
  };

  const removerFavorito = async (favoritoId: string) => {
    try {
      const { error } = await supabase
        .from("favoritos")
        .delete()
        .eq("id", favoritoId);

      if (error) throw error;
      toast.success("Removido dos favoritos");
      fetchFavoritos();
    } catch (error: any) {
      toast.error("Erro ao remover favorito");
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold">Favoritos</h1>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Faça login para ver seus favoritos</p>
            <Button onClick={() => navigate("/auth")}>Fazer Login</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Meus Favoritos</h1>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : favoritos.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-2">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p>Você ainda não tem favoritos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favoritos.map((favorito) => (
              <Card key={favorito.id} className="p-4">
                <div className="flex gap-4">
                  <div
                    className="w-24 h-24 bg-muted rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/anuncio/${favorito.anuncio.id}`)}
                  >
                    {favorito.anuncio.imagens?.[0] && (
                      <img
                        src={favorito.anuncio.imagens[0]}
                        alt={favorito.anuncio.titulo}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className="font-semibold cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/anuncio/${favorito.anuncio.id}`)}
                    >
                      {favorito.anuncio.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground">{favorito.anuncio.categoria}</p>
                    <p className="text-lg font-bold text-primary mt-1">
                      R$ {favorito.anuncio.preco}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => removerFavorito(favorito.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Favoritos;