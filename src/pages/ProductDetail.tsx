import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, ShoppingCart, Package, Ruler, Truck, Tag, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anuncio, setAnuncio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [diasLocacao, setDiasLocacao] = useState(1);

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

    const qty = anuncio.tipo === "Locação" ? diasLocacao : quantidade;
    const total = anuncio.preco * qty;

    try {
      const { error } = await supabase.from("carrinho").insert({
        usuario_id: user.id,
        anuncio_id: anuncio.id,
        quantidade: qty,
        total: total,
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

  const totalCompra = anuncio 
    ? anuncio.preco * (anuncio.tipo === "Locação" ? diasLocacao : quantidade)
    : 0;

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
      <div className="pb-24">
        <div className="sticky top-0 bg-background z-10 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {anuncio.imagens && anuncio.imagens.length > 0 && (
          <Carousel className="w-full">
            <CarouselContent>
              {anuncio.imagens.map((img: string, index: number) => (
                <CarouselItem key={index}>
                  <div className="aspect-video bg-muted">
                    <img
                      src={img}
                      alt={`${anuncio.titulo} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {anuncio.imagens.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
        )}

        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <Badge
              className={`${
                anuncio.tipo === "Venda" ? "bg-primary" : "bg-accent"
              }`}
            >
              {anuncio.tipo}
            </Badge>
            
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold flex-1">{anuncio.titulo}</h1>
              <p className="text-2xl font-bold text-primary whitespace-nowrap">
                R$ {anuncio.preco.toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Categoria</p>
                  <p className="font-medium text-sm">{anuncio.categoria}</p>
                </div>
              </Card>

              {anuncio.medidas && (
                <Card className="p-3 flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Medidas</p>
                    <p className="font-medium text-sm">{anuncio.medidas}</p>
                  </div>
                </Card>
              )}

              <Card className="p-3 flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Entrega</p>
                  <p className="font-medium text-sm">
                    {anuncio.entrega ? "Sim" : "Não"}
                  </p>
                </div>
              </Card>

              <Card className="p-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Localização</p>
                  <p className="font-medium text-sm">
                    {anuncio.cidade}, {anuncio.bairro}
                  </p>
                </div>
              </Card>

              {anuncio.condicao && (
                <Card className="p-3 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Condição</p>
                    <p className="font-medium text-sm capitalize">{anuncio.condicao}</p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {anuncio.tipo === "Locação" ? "Dias de Locação" : "Quantidade"}
            </h3>
            {anuncio.tipo === "Locação" ? (
              <Input
                type="number"
                min="1"
                value={diasLocacao}
                onChange={(e) => setDiasLocacao(parseInt(e.target.value) || 1)}
                className="w-full"
              />
            ) : (
              <Input
                type="number"
                min="1"
                max={anuncio.quantidade || 999}
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                className="w-full"
              />
            )}
            {anuncio.quantidade && anuncio.tipo !== "Locação" && (
              <p className="text-sm text-muted-foreground">
                Disponível: {anuncio.quantidade} unidades
              </p>
            )}
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="font-semibold">Descrição</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {anuncio.descricao}
            </p>
          </Card>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            Total: R$ {totalCompra.toFixed(2)}
          </p>
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
