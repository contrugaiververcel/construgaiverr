import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/products/ProductCard";
import ProductCardVertical from "@/components/products/ProductCardVertical";
import FilterBar from "@/components/products/FilterBar";
import CategoryButtons from "@/components/products/CategoryButtons";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Plus, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import NotificationsSheet from "@/components/NotificationsSheet";
import useNotifications from "@/hooks/use-notifications";
import { useAuth } from "@/contexts/AuthContext";

interface Anuncio {
  id: string;
  titulo: string;
  preco: number;
  preco_oferta: number | null;
  tipo: string;
  cidade: string;
  bairro: string;
  imagens: string[];
}

const CONFIG_ID = "00000000-0000-0000-0000-000000000000";

const fetchHomeConfig = async () => {
  const { data, error } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("id", CONFIG_ID)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (error) return null;
  return data;
};

const Home = () => {
  const { user, profile, userRole, loading: authLoading } = useAuth();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cidade: "",
    bairro: "",
    tipo: "",
    categoria: "",
  });
  const navigate = useNavigate();

  const { unreadCount } = useNotifications(user?.id);

  const { data: homeConfig } = useQuery({
    queryKey: ["homeConfig"],
    queryFn: fetchHomeConfig,
    staleTime: 0, // Garante que os dados sejam sempre considerados "velhos" e busca novamente.
    enabled: !authLoading, // Só busca quando auth terminar
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCreateButtonClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate(userRole === "vendedor" ? "/novo-anuncio" : "/todos-anuncios");
  };

  useEffect(() => {
    if (authLoading) return; // Aguarda o Supabase Auth inicializar para não travar a fila de queries

    let isMounted = true;

    const fetchAnuncios = async () => {
      try {
        if (isMounted) setLoading(true);
        let query = supabase.from("anuncios").select("*");

        if (filters.cidade) query = query.eq("cidade", filters.cidade);
        if (filters.bairro) query = query.eq("bairro", filters.bairro);
        if (filters.tipo) query = query.eq("tipo", filters.tipo);
        if (filters.categoria) query = query.eq("categoria", filters.categoria);

        // Timeout de 8s para não travar em loading infinito (ex: 2ª aba aguardando token)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout ao carregar anúncios")), 8000)
        );

        const { data, error } = await Promise.race([
          query.order("criado_em", { ascending: false }),
          timeoutPromise,
        ]);

        if (!isMounted) return;

        if (error) throw error;
        setAnuncios(data || []);
      } catch (error: any) {
        if (!isMounted) return;

        if (error?.message?.includes("Timeout")) {
          // toast.error("Conexão lenta. Tentando novamente...");
          // Tenta novamente após timeout (apenas se montado)
          setTimeout(() => {
            if (isMounted) fetchAnuncios();
          }, 2000);
          return;
        }
        toast.error("Erro ao carregar anúncios");
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnuncios();

    return () => {
      isMounted = false;
    };
  }, [filters, authLoading]);

  const anunciosEmOferta = anuncios.filter((a) => a.preco_oferta && a.preco_oferta > 0);
  const anunciosRestantes = anuncios.filter((a) => !a.preco_oferta || a.preco_oferta <= 0);

  const defaultBanner1 = 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1200';
  const defaultBanner2 = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200';

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-gradient-primary rounded-xl p-6 text-white shadow-orange flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user && profile && (
              profile.logo_empresa ? (
                <img
                  src={profile.logo_empresa}
                  alt="Foto de perfil"
                  className="h-12 w-12 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-semibold border-2 border-white">
                  {profile.nome ? getInitials(profile.nome) : "?"}
                </div>
              )
            )}
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {user && profile?.nome ? `Olá, ${profile.nome.split(" ")[0]}!` : user ? `Olá, ${user.email?.split("@")[0]}!` : "Olá!"}
              </h1>
              {!user && (
                <p
                  className="text-sm opacity-90 cursor-pointer underline"
                  onClick={() => navigate("/auth")}
                >
                  Faça login ou cadastre-se aqui
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <NotificationsSheet userId={user?.id} unreadCount={unreadCount} />
            <Button
              size="icon"
              className="bg-white text-primary hover:bg-white/90 rounded-full h-12 w-12"
              onClick={handleCreateButtonClick}
            >
              {userRole === "vendedor" ? <Plus className="h-6 w-6" /> : <Grid className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Banner 1 */}
        <div
          className="relative rounded-xl overflow-hidden shadow-lg h-32"
          style={{
            backgroundImage: `url(${homeConfig?.banner_1_url || defaultBanner1})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70 flex items-center justify-center">
            <div className="text-white text-center px-4">
              <h2 className="text-xl font-bold mb-1">Ofertas Especiais</h2>
              <p className="text-sm opacity-90">Confira as melhores ofertas!</p>
            </div>
          </div>
        </div>

        {/* Products Sections */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : anuncios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum anúncio encontrado
          </div>
        ) : (
          <div className="space-y-6">
            {anunciosEmOferta.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{homeConfig?.titulo_ofertas || "Em oferta"}</h2>
                  <Button
                    variant="link"
                    className="text-primary p-0 h-auto"
                    onClick={() => navigate("/todos-anuncios?secao=ofertas")}
                  >
                    Ver tudo
                  </Button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {anunciosEmOferta.map((anuncio) => (
                    <ProductCardVertical
                      key={anuncio.id}
                      anuncio={anuncio}
                      showOfferBadge
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Banner 2 */}
            <div
              className="relative rounded-xl overflow-hidden shadow-lg h-32"
              style={{
                backgroundImage: `url(${homeConfig?.banner_2_url || defaultBanner2})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-orange-500/70 flex items-center justify-center">
                <div className="text-white text-center px-4">
                  <h2 className="text-xl font-bold mb-1">Materiais de Qualidade</h2>
                  <p className="text-sm opacity-90">Encontre tudo para sua obra!</p>
                </div>
              </div>
            </div>

            {anunciosRestantes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{homeConfig?.titulo_encontre || "Encontre o que precisa"}</h2>
                  <Button
                    variant="link"
                    className="text-primary p-0 h-auto"
                    onClick={() => navigate("/todos-anuncios")}
                  >
                    Ver tudo
                  </Button>
                </div>
                <CategoryButtons
                  selectedCategory={filters.categoria}
                  onCategoryChange={(categoria) => setFilters({ ...filters, categoria })}
                />
                <div className="space-y-3">
                  {anunciosRestantes.map((anuncio) => (
                    <ProductCard key={anuncio.id} anuncio={anuncio} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Home;