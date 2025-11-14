import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface CarrinhoItem {
  id: string;
  quantidade: number;
  total: number;
  anuncio: {
    id: string;
    titulo: string;
    preco: number;
    imagens: string[];
  };
}

const Carrinho = () => {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<CarrinhoItem[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (user) {
      fetchCarrinho();
    }
  }, [user]);

  const fetchCarrinho = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("carrinho")
        .select("*, anuncio:anuncios(*)")
        .eq("usuario_id", user.id);

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar carrinho");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantidade = async (itemId: string, novaQuantidade: number) => {
    if (novaQuantidade < 1) return;

    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const novoTotal = item.anuncio.preco * novaQuantidade;

      const { error } = await supabase
        .from("carrinho")
        .update({ quantidade: novaQuantidade, total: novoTotal })
        .eq("id", itemId);

      if (error) throw error;
      fetchCarrinho();
    } catch (error: any) {
      toast.error("Erro ao atualizar quantidade");
    }
  };

  const removerItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("carrinho").delete().eq("id", itemId);
      if (error) throw error;
      toast.success("Item removido do carrinho");
      fetchCarrinho();
    } catch (error: any) {
      toast.error("Erro ao remover item");
    }
  };

  const total = items.reduce((acc, item) => acc + item.total, 0);

  if (!user) {
    return (
      <MainLayout>
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold">Carrinho</h1>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Faça login para ver seu carrinho</p>
            <Button onClick={() => navigate("/auth")}>Fazer Login</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

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
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Carrinho</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Seu carrinho está vazio</p>
            <Button className="mt-4" onClick={() => navigate("/home")}>
              Continuar comprando
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.anuncio.imagens?.[0] ? (
                        <img
                          src={item.anuncio.imagens[0]}
                          alt={item.anuncio.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          Sem imagem
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold line-clamp-2">{item.anuncio.titulo}</h3>
                      <p className="text-primary font-bold">
                        R$ {item.anuncio.preco.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantidade(item.id, item.quantidade - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold w-8 text-center">
                          {item.quantidade}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantidade(item.id, item.quantidade + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8 ml-auto"
                          onClick={() => removerItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 bg-gradient-primary text-white">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg">Total:</span>
                <span className="text-2xl font-bold">R$ {total.toFixed(2)}</span>
              </div>
              <Button 
                className="w-full bg-white text-primary hover:bg-white/90"
                onClick={() => navigate("/checkout")}
              >
                Finalizar Compra
              </Button>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Carrinho;
