import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anuncio, setAnuncio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchAnuncio();
    }
  }, [id]);

  const fetchAnuncio = async () => {
    try {
      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAnuncio(data);
    } catch (error: any) {
      toast.error("Erro ao carregar anúncio");
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!user) {
      toast.error("Faça login para adicionar ao carrinho");
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.from("carrinho").insert({
        usuario_id: user.id,
        anuncio_id: anuncio.id,
        quantidade: 1,
        total: anuncio.preco,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("Item já está no carrinho");
        } else {
          throw error;
        }
      } else {
        toast.success("Adicionado ao carrinho!");
      }
    } catch (error: any) {
      toast.error("Erro ao adicionar ao carrinho");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="sticky top-0 bg-background z-10 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {anuncio.imagens?.[0] && (
          <div className="aspect-video bg-muted">
            <img
              src={anuncio.imagens[0]}
              alt={anuncio.titulo}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                className={`${
                  anuncio.tipo === "Venda" ? "bg-primary" : "bg-accent"
                }`}
              >
                {anuncio.tipo}
              </Badge>
              <Badge variant="outline">{anuncio.categoria}</Badge>
            </div>
            <h1 className="text-2xl font-bold">{anuncio.titulo}</h1>
            <p className="text-3xl font-bold text-primary">
              R$ {anuncio.preco.toFixed(2)}
            </p>
          </div>

          <Card className="p-4 space-y-2">
            <h3 className="font-semibold">Localização</h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>
                {anuncio.cidade} - {anuncio.bairro}
              </span>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="font-semibold">Descrição</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {anuncio.descricao}
            </p>
          </Card>

          <Button className="w-full shadow-orange" onClick={addToCart}>
            <ShoppingCart className="h-5 w-5 mr-2" />
            Adicionar ao carrinho
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductDetail;
