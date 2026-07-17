import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import ProductCard from "@/components/products/ProductCard";

const PerfilVendedor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendedor, setVendedor] = useState<any>(null);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVendedor();
      fetchAnuncios();
    }
  }, [id]);

  const fetchVendedor = async () => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setVendedor(data);
    } catch (error: any) {
      toast.error("Erro ao carregar perfil do vendedor");
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnuncios = async () => {
    try {
      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .eq("usuario_id", id)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setAnuncios(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar anúncios:", error);
    }
  };

  const handleChat = () => {
    navigate(`/chat/${id}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center gap-4 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Perfil do Vendedor</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Perfil Card */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24">
                {vendedor?.logo_empresa ? (
                  <AvatarImage src={vendedor.logo_empresa} alt={vendedor.nome_empresa || vendedor.nome} />
                ) : (
                  <AvatarFallback className="text-2xl">
                    {getInitials(vendedor?.nome_empresa || vendedor?.nome || "?")}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div>
                <h2 className="text-xl font-bold">
                  {vendedor?.nome_empresa || vendedor?.nome}
                </h2>
                {vendedor?.cidade && (
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{vendedor.cidade}</span>
                  </div>
                )}
              </div>

              {vendedor?.descricao_empresa && (
                <p className="text-sm text-muted-foreground">
                  {vendedor.descricao_empresa}
                </p>
              )}

              <Button onClick={handleChat} className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Conversar com o vendedor
              </Button>
            </div>
          </Card>

          {/* Anúncios */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">
              Anúncios ({anuncios.length})
            </h3>
            
            {anuncios.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhum anúncio disponível
              </Card>
            ) : (
              <div className="space-y-3">
                {anuncios.map((anuncio) => (
                  <ProductCard key={anuncio.id} anuncio={anuncio} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PerfilVendedor;