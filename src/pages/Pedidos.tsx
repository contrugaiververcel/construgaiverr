import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Pedidos = () => {
  const [user, setUser] = useState<any>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
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
      fetchPedidos();
    }
  }, [user]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pedidos")
        .select("*, endereco:enderecos(*), itens:itens_pedido(*, anuncio:anuncios(*))")
        .eq("usuario_id", user.id)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pendente: "secondary",
      confirmado: "default",
      enviado: "default",
      entregue: "default",
      cancelado: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold">Meus Pedidos</h1>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Faça login para ver seus pedidos</p>
            <Button onClick={() => navigate("/auth")}>Fazer Login</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Meus Pedidos</h1>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-2">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p>Você ainda não fez nenhum pedido</p>
            <Button onClick={() => navigate("/home")}>Começar a comprar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <Card key={pedido.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pedido #{pedido.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {getStatusBadge(pedido.status)}
                </div>

                <div className="space-y-2">
                  {pedido.itens?.map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                        {item.anuncio?.imagens?.[0] && (
                          <img 
                            src={item.anuncio.imagens[0]} 
                            alt={item.anuncio.titulo}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.anuncio?.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {item.quantidade}
                        </p>
                        <p className="text-sm font-semibold">
                          R$ {item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">R$ {pedido.total.toFixed(2)}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      {pedido.opcao_entrega === "entrega" ? "Entrega" : "Retirada"}
                    </p>
                    <p className="text-muted-foreground">
                      {pedido.endereco?.cidade}, {pedido.endereco?.uf}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Pedidos;