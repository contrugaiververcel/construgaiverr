import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/products/ProductCard";
import FilterBar from "@/components/products/FilterBar";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Anuncio {
  id: string;
  titulo: string;
  preco: number;
  tipo: string;
  cidade: string;
  bairro: string;
  imagens: string[];
}

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cidade: "",
    bairro: "",
    tipo: "",
    categoria: "",
  });
  const navigate = useNavigate();

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
    fetchAnuncios();
  }, [filters]);

  const fetchAnuncios = async () => {
    try {
      setLoading(true);
      let query = supabase.from("anuncios").select("*");

      if (filters.cidade) query = query.eq("cidade", filters.cidade);
      if (filters.bairro) query = query.eq("bairro", filters.bairro);
      if (filters.tipo) query = query.eq("tipo", filters.tipo);
      if (filters.categoria) query = query.eq("categoria", filters.categoria);

      const { data, error } = await query.order("criado_em", { ascending: false });

      if (error) throw error;
      setAnuncios(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar anúncios");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-gradient-primary rounded-xl p-6 text-white shadow-orange">
          <h1 className="text-2xl font-bold mb-2">
            {user ? `Olá, ${user.email?.split("@")[0]}!` : "Olá!"}
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

        {/* Filters */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Products Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : anuncios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum anúncio encontrado
            </div>
          ) : (
            anuncios.map((anuncio) => <ProductCard key={anuncio.id} anuncio={anuncio} />)
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
