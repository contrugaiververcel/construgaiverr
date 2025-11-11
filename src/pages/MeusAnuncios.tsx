import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const MeusAnuncios = () => {
  const [user, setUser] = useState<any>(null);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchMeusAnuncios();
    }
  }, [user]);

  const fetchMeusAnuncios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .eq("usuario_id", user.id)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setAnuncios(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar anúncios");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Meus Anúncios</h1>
          <Button size="icon" className="shadow-orange">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : anuncios.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-2">
            <p>Você ainda não criou nenhum anúncio</p>
            <Button className="mt-4">
              <Plus className="h-5 w-5 mr-2" />
              Criar primeiro anúncio
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {anuncios.map((anuncio) => (
              <ProductCard key={anuncio.id} anuncio={anuncio} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MeusAnuncios;
