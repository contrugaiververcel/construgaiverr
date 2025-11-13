import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/products/ProductCard";
import FilterBar from "@/components/products/FilterBar";
import CategoryButtons from "@/components/products/CategoryButtons";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const TodosAnuncios = () => {
  const [searchParams] = useSearchParams();
  const secao = searchParams.get("secao");
  
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cidade: "",
    bairro: "",
    tipo: "",
    categoria: "",
    condicao: [] as string[],
    entrega: false,
  });

  useEffect(() => {
    fetchAnuncios();
  }, [filters, secao]);

  const fetchAnuncios = async () => {
    try {
      let query: any = supabase.from("anuncios").select("*");

      // Apply simple equality filters
      if (filters.cidade) {
        query = query.eq("cidade", filters.cidade);
      }
      if (filters.bairro) {
        query = query.eq("bairro", filters.bairro);
      }
      if (filters.tipo) {
        query = query.eq("tipo", filters.tipo);
      }
      if (filters.categoria) {
        query = query.eq("categoria", filters.categoria);
      }
      if (filters.entrega) {
        query = query.eq("entrega", true);
      }

      // Apply condicao filter
      if (filters.condicao.length > 0) {
        query = query.in("condicao", filters.condicao);
      }
      
      // Apply ofertas filter
      if (secao === "ofertas") {
        query = query.lt("preco", 500);
      }

      // Execute query
      const { data, error } = await query.order("criado_em", { ascending: false });

      if (error) throw error;
      setAnuncios(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar anúncios:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCondicao = (condicao: string) => {
    setFilters(prev => ({
      ...prev,
      condicao: prev.condicao.includes(condicao)
        ? prev.condicao.filter(c => c !== condicao)
        : [...prev.condicao, condicao]
    }));
  };

  return (
    <MainLayout>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {secao === "ofertas" ? "Em Oferta" : "Todos os Anúncios"}
          </h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filtros Avançados</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <FilterBar filters={filters} onFiltersChange={setFilters} />
                
                <div className="space-y-3">
                  <Label className="font-semibold">Condição</Label>
                  <div className="space-y-2">
                    {["novo", "seminovo", "usado"].map((cond) => (
                      <div key={cond} className="flex items-center space-x-2">
                        <Checkbox
                          id={cond}
                          checked={filters.condicao.includes(cond)}
                          onCheckedChange={() => toggleCondicao(cond)}
                        />
                        <Label htmlFor={cond} className="capitalize cursor-pointer">
                          {cond}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="entrega"
                    checked={filters.entrega}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, entrega: checked as boolean })
                    }
                  />
                  <Label htmlFor="entrega" className="cursor-pointer">
                    Apenas com entrega
                  </Label>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <CategoryButtons
          selectedCategory={filters.categoria}
          onCategoryChange={(cat) => setFilters({ ...filters, categoria: cat })}
        />

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : anuncios.length === 0 ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <p className="text-muted-foreground">Nenhum anúncio encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anuncios.map((anuncio) => (
              <ProductCard key={anuncio.id} anuncio={anuncio} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default TodosAnuncios;
