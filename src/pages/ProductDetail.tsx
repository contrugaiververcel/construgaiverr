import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, ShoppingCart, Package, Ruler, Truck, Tag, Heart, Star, Share2, Boxes, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole, loading: authLoading } = useAuth();
  const [anuncio, setAnuncio] = useState<any>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantidade, setQuantidade] = useState("1");
  const [diasLocacao, setDiasLocacao] = useState("1");
  const [isFavorite, setIsFavorite] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [mediaAvaliacoes, setMediaAvaliacoes] = useState(0);
  const [novaAvaliacao, setNovaAvaliacao] = useState({ nota: 5, comentario: "" });
  const [showAvaliacaoForm, setShowAvaliacaoForm] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Tenta usar Share API Nativa somente em dispositivos móveis
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: anuncio?.titulo || "Confira este produto",
          url
        });
        toast.success("Link compartilhado!");
        return;
      } catch (err) {
        // Se o usuário fechar a janela de share, ignora e tenta copiar abaixo
      }
    }

    // Copiar para a área de transferência (Desktop ou fallback)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback legado para navegadores em HTTP (ex: testando por Wi-Fi Local)
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast.success("URL copiado!");
    } catch (err) {
      console.error("Erro ao copiar URL:", err);
      toast.error("Erro ao copiar URL");
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (id) {
      fetchAnuncio();
      if (user) {
        checkFavorite();
      } else {
        setIsFavorite(false);
      }
    }
  }, [id, user, authLoading]);

  const fetchAnuncio = async () => {
    try {
      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAnuncio(data);

      if (data.usuario_id) {
        fetchVendedor(data.usuario_id);
        fetchAvaliacoes(data.usuario_id);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar anúncio");
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendedor = async (vendedorId: string) => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", vendedorId)
        .single();

      if (error) throw error;
      setVendedor(data);
    } catch (error: any) {
      console.error("Erro ao carregar vendedor:", error);
    }
  };

  const fetchAvaliacoes = async (vendedorId: string) => {
    try {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("*, usuarios(nome, logo_empresa)")
        .eq("vendedor_id", vendedorId)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setAvaliacoes(data || []);

      if (data && data.length > 0) {
        const soma = data.reduce((acc, av) => acc + av.nota, 0);
        setMediaAvaliacoes(soma / data.length);
      }
    } catch (error: any) {
      console.error("Erro ao carregar avaliações:", error);
    }
  };

  const checkFavorite = async () => {
    if (!user || !id) return;

    try {
      const { data } = await supabase
        .from("favoritos")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("anuncio_id", id)
        .maybeSingle();

      setIsFavorite(!!data);
    } catch (error) {
      // Não é favorito
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Faça login para adicionar aos favoritos");
      navigate("/auth");
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .eq("usuario_id", user.id)
          .eq("anuncio_id", id);

        if (error) throw error;
        setIsFavorite(false);
        toast.success("Removido dos favoritos");
      } else {
        const { error } = await supabase
          .from("favoritos")
          .insert({
            usuario_id: user.id,
            anuncio_id: id,
          });

        if (error) throw error;
        setIsFavorite(true);
        toast.success("Adicionado aos favoritos!");
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar favoritos");
    }
  };

  const addToCart = async () => {
    if (!user) {
      toast.error("Faça login para adicionar ao carrinho");
      navigate("/auth");
      return;
    }

    const qtd = Math.max(1, parseInt(quantidade) || 1);
    const dias = Math.max(1, parseInt(diasLocacao) || 1);

    try {
      // O Supabase vai calcular o 'total' via Trigger antes de inserir, garantindo a segurança
      const { error } = await supabase.from("carrinho").insert({
        usuario_id: user.id,
        anuncio_id: anuncio.id,
        quantidade: qtd,
        dias_locacao: anuncio.tipo === "Locação" ? dias : null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Este item já está no carrinho");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Adicionado ao carrinho!");
      navigate("/carrinho");
    } catch (error: any) {
      toast.error("Erro ao adicionar ao carrinho");
    }
  };

  const submitAvaliacao = async () => {
    if (!user) {
      toast.error("Faça login para avaliar");
      navigate("/auth");
      return;
    }

    if (userRole !== "cliente") {
      toast.error("Apenas clientes podem avaliar");
      return;
    }

    if (!novaAvaliacao.comentario.trim()) {
      toast.error("Por favor, escreva um comentário");
      return;
    }

    try {
      const { error } = await supabase
        .from("avaliacoes")
        .insert({
          usuario_id: user.id,
          vendedor_id: anuncio.usuario_id,
          anuncio_id: id,
          nota: novaAvaliacao.nota,
          comentario: novaAvaliacao.comentario,
        });

      if (error) throw error;

      toast.success("Avaliação enviada!");
      setNovaAvaliacao({ nota: 5, comentario: "" });
      setShowAvaliacaoForm(false);
      fetchAvaliacoes(anuncio.usuario_id);
    } catch (error: any) {
      toast.error("Erro ao enviar avaliação");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-primary text-primary" : "text-muted"
          }`}
      />
    ));
  };

  const qtdVal = Math.max(1, parseInt(quantidade) || 1);
  const diasVal = Math.max(1, parseInt(diasLocacao) || 1);
  const total =
    anuncio?.tipo === "Locação"
      ? (anuncio?.preco ?? 0) * diasVal * qtdVal
      : (anuncio?.preco ?? 0) * qtdVal;

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
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                className={isFavorite ? "text-primary" : ""}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>
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
              className={`${anuncio.tipo === "Venda" ? "bg-primary" : "bg-accent"
                }`}
            >
              {anuncio.tipo}
            </Badge>

            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold flex-1">{anuncio.titulo}</h1>
              <p className="text-2xl font-bold text-primary whitespace-nowrap">
                R$ {anuncio.preco.toFixed(2)} 
                {anuncio.tipo === "Locação" && <span className="text-sm font-normal text-muted-foreground ml-1">/dia</span>}
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
                <Card className="p-3 flex items-center gap-2 col-span-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Condição</p>
                    <p className="font-medium text-sm">{anuncio.condicao}</p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Avaliações ({avaliacoes.length})
              </h2>
              {user && userRole === "cliente" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAvaliacaoForm(!showAvaliacaoForm)}
                >
                  Avaliar
                </Button>
              )}
            </div>

            {showAvaliacaoForm && (
              <Card className="p-4 space-y-3">
                <div>
                  <label className="text-sm font-medium">Nota</label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((nota) => (
                      <button
                        key={nota}
                        onClick={() => setNovaAvaliacao({ ...novaAvaliacao, nota })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${nota <= novaAvaliacao.nota
                            ? "fill-primary text-primary"
                            : "text-muted"
                            }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Comentário</label>
                  <Textarea
                    placeholder="Conte sua experiência..."
                    value={novaAvaliacao.comentario}
                    onChange={(e) =>
                      setNovaAvaliacao({ ...novaAvaliacao, comentario: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={submitAvaliacao} className="flex-1">
                    Enviar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAvaliacaoForm(false);
                      setNovaAvaliacao({ nota: 5, comentario: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </Card>
            )}

            {avaliacoes.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhuma avaliação ainda
              </Card>
            ) : (
              <div className="space-y-3">
                {avaliacoes.map((avaliacao) => (
                  <Card key={avaliacao.id} className="p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        {avaliacao.usuarios?.logo_empresa ? (
                          <AvatarImage src={avaliacao.usuarios.logo_empresa} />
                        ) : (
                          <AvatarFallback>
                            {getInitials(avaliacao.usuarios?.nome || "?")}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">
                            {avaliacao.usuarios?.nome || "Usuário"}
                          </p>
                          <div className="flex gap-0.5">
                            {renderStars(avaliacao.nota)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {avaliacao.comentario}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(avaliacao.criado_em).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Mini Perfil do Vendedor (Movido para baixo das avaliações) */}
          {vendedor && (
            <Card className="p-4 space-y-3">
              <h2 className="text-lg font-semibold">Sobre o Vendedor</h2>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {vendedor.logo_empresa ? (
                    <AvatarImage src={vendedor.logo_empresa} alt={vendedor.nome_empresa || vendedor.nome} />
                  ) : (
                    <AvatarFallback>
                      {getInitials(vendedor.nome_empresa || vendedor.nome)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {vendedor.nome_empresa || vendedor.nome}
                  </h3>
                  {avaliacoes.length > 0 && (
                    <div className="flex items-center gap-1">
                      {renderStars(Math.round(mediaAvaliacoes))}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({avaliacoes.length} avaliações)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/perfil-vendedor/${anuncio.usuario_id}`)}
              >
                Ver perfil completo
              </Button>
            </Card>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-2">Descrição</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {anuncio.descricao}
            </p>
          </div>
        </div>

        <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4 shadow-lg">
          <div className="flex items-center gap-2">
            {/* Quantidade de itens — exibida para todos os tipos */}
            <div className="flex-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Boxes className="h-3 w-3" />
                Itens
              </label>
              <Input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                onBlur={() => {
                  const val = parseInt(quantidade);
                  setQuantidade(String(isNaN(val) || val < 1 ? 1 : val));
                }}
                className="w-full"
              />
            </div>

            {/* Dias de locação — exibida somente para Locação */}
            {anuncio.tipo === "Locação" && (
              <div className="flex-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3" />
                  Dias
                </label>
                <Input
                  type="number"
                  min="1"
                  value={diasLocacao}
                  onChange={(e) => setDiasLocacao(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(diasLocacao);
                    setDiasLocacao(String(isNaN(val) || val < 1 ? 1 : val));
                  }}
                  className="w-full"
                />
              </div>
            )}

            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-lg font-bold text-primary">
                R$ {total.toFixed(2)}
              </p>
            </div>
            <Button onClick={addToCart} size="lg" className="flex-1">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductDetail;