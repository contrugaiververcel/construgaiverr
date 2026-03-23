import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Package, MessageCircle, CheckCircle, Truck, Home, RefreshCw, TrendingUp, Bell, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const fetchPedidosVendedor = async (userId: string) => {
  // First get the ad IDs for this seller
  const { data: ads } = await supabase.from('anuncios').select('id').eq('usuario_id', userId);
  if (!ads || ads.length === 0) return [];
  const adIds = ads.map(a => a.id);

  // Then fetch the items directly. Join the order and try to get buyer info.
  // We start from 'itens_pedido' because that's what we're filtering on.
  const { data, error } = await supabase
    .from('itens_pedido')
    .select(`
      *,
      anuncio:anuncios(*),
      pedido:pedidos(
        *,
        endereco:enderecos(*)
      )
    `)
    .in('anuncio_id', adIds);

  if (error) {
    console.error("Erro ao buscar itens de venda:", error);
    throw error;
  }

  // To get buyer names, we might need a separate query if the join above didn't include it
  // or if the relationship is missing in types.ts. Let's try to fetch unique buyer IDs.
  const buyerIds = Array.from(new Set(data.map(item => item.pedido?.usuario_id).filter(Boolean)));

  if (buyerIds.length > 0) {
    const { data: buyers } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .in('id', buyerIds);

    // Merge buyer info back into the items
    const buyersMap = Object.fromEntries(buyers?.map(b => [b.id, b]) || []);
    data.forEach(item => {
      if (item.pedido) {
        item.pedido.comprador = buyersMap[item.pedido.usuario_id];
      }
    });
  }

  console.log("Itens de venda carregados:", data);
  return data || [];
};

const fetchMetricas = async (userId: string) => {
  const { data: anuncios } = await supabase.from("anuncios").select("id").eq("usuario_id", userId);
  if (!anuncios) return { totalPedidos: 0, totalVendas: 0, pedidosPendentes: 0 };

  const anuncioIds = anuncios.map((a) => a.id);
  if (anuncioIds.length === 0) return { totalPedidos: 0, totalVendas: 0, pedidosPendentes: 0 };

  const { data: itensPedido } = await supabase.from("itens_pedido").select("*, pedido:pedidos(*)").in("anuncio_id", anuncioIds);
  if (!itensPedido) return { totalPedidos: 0, totalVendas: 0, pedidosPendentes: 0 };

  const totalVendas = itensPedido.reduce((sum, item) => sum + (Number(item.subtotal) * 0.9), 0);
  const pedidosUnicos = new Set(itensPedido.map((i) => i.pedido_id));
  const itensPendentes = itensPedido.filter((i) => !i.status || i.status === "pendente");
  const pedidosPendentesUnicos = new Set(itensPendentes.map((p) => p.pedido_id));

  return {
    totalPedidos: pedidosUnicos.size,
    totalVendas,
    pedidosPendentes: pedidosPendentesUnicos.size,
  };
};

const PainelVendedor = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("todos");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Por favor, faça login para acessar o painel");
        navigate("/auth");
      } else if (userRole && userRole !== "vendedor") {
        toast.error("Você precisa ser um vendedor para acessar este painel");
        navigate("/perfil");
      }
    }
  }, [user, userRole, loading, navigate]);

  const { data: pedidos, isLoading: isLoadingPedidos } = useQuery({
    queryKey: ['vendedorPedidos', user?.id],
    queryFn: () => fetchPedidosVendedor(user!.id),
    enabled: !!user,
  });

  const { data: metricas, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['vendedorMetrics', user?.id],
    queryFn: () => fetchMetricas(user!.id),
    enabled: !!user,
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      console.log("Iniciando atualização de status para item:", itemId, "novo status:", status);
      const { data, error } = await supabase.from("itens_pedido").update({ status }).eq("id", itemId).select();
      if (error) {
        console.error("Erro Supabase:", error);
        throw error;
      }
      console.log("Resposta do Supabase após UPDATE:", data);
      if (!data || data.length === 0) throw new Error("Item não encontrado ou sem permissão de atualização");
      return data[0];
    },
    onSuccess: (data, variables) => {
      console.log("Status atualizado com sucesso:", data);
      toast.success("Status do item atualizado!");
      queryClient.invalidateQueries({ queryKey: ['vendedorPedidos', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['vendedorMetrics', user?.id] });

      // Enviar e-mail de atualização de status para o cliente
      if (['confirmado', 'em_transito', 'entregue', 'cancelado'].includes(variables.status)) {
        console.log("Disparando e-mail de atualização de status...");
        supabase.functions.invoke('send-order-email', {
          body: { itemId: variables.itemId, type: 'STATUS_UPDATE', newStatus: variables.status }
        });
      }
    },
    onError: (error: any) => {
      console.error("Erro na mutação de status:", error);
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const updateItemRastreioMutation = useMutation({
    mutationFn: async ({ itemId, codigo }: { itemId: string; codigo: string }) => {
      const { data, error } = await supabase.from("itens_pedido").update({ codigo_rastreio: codigo }).eq("id", itemId).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Item não encontrado ou sem permissão de atualização");
    },
    onSuccess: () => {
      toast.success("Código de rastreio salvo!");
      queryClient.invalidateQueries({ queryKey: ['vendedorPedidos', user?.id] });
    },
    onError: (error: any) => {
      console.error("Erro ao salvar rastreio:", error);
      toast.error("Erro ao salvar rastreio: " + error.message);
    },
  });

  const filteredItens = pedidos?.filter(item =>
    statusFilter === 'todos' ||
    item.status === statusFilter ||
    (statusFilter === 'pendente' && !item.status)
  ) || [];

  if (loading || !user || userRole !== "vendedor") {
    return (
      <MainLayout>
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold">Painel do Vendedor</h1>
          <Card className="p-8 text-center flex flex-col justify-center items-center h-48">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando painel...</p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Painel do Vendedor</h1>

        {isLoadingMetrics ? (
          <div className="text-center"><RefreshCw className="h-6 w-6 animate-spin mx-auto" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Total de Pedidos</h3>
              </div>
              <p className="text-3xl font-bold">{metricas?.totalPedidos}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Total de Vendas</h3>
              </div>
              <p className="text-3xl font-bold">R$ {metricas?.totalVendas.toFixed(2)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Pedidos Pendentes</h3>
              </div>
              <p className="text-3xl font-bold">{metricas?.pedidosPendentes}</p>
            </Card>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Minhas Vendas</h2>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="status-filter" className="font-semibold">Filtrar por status</Label>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="mt-2">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="em_transito">Em Trânsito</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          {isLoadingPedidos ? (
            <div className="text-center"><RefreshCw className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : filteredItens.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pedido encontrado com o filtro selecionado.</p>
            </Card>
          ) : (
            filteredItens.map((item: any) => {
              const pedido = item.pedido || {};
              return (
                <Card key={item.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start border-b pb-3">
                      <div>
                        <p className="font-semibold text-lg">Venda #{(item.id || item.item_id).slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">Comprador: {pedido.comprador?.nome || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">
                          Data: {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-base mb-1">{item.anuncio?.titulo}</p>
                        <p className="text-sm text-muted-foreground mb-1">Quantidade: {item.quantidade}</p>
                        <p className="font-bold text-lg text-primary">
                          R$ {(Number(item.subtotal) * 0.9).toFixed(2)}
                          <span className="text-xs text-muted-foreground font-normal ml-2">(já com taxa de 10%)</span>
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:w-[250px]">
                        <div>
                          <Select
                            value={item.status || "pendente"}
                            onValueChange={(status) => updateItemStatusMutation.mutate({ itemId: item.id || item.item_id, status })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Status da Entrega" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="confirmado">Confirmado</SelectItem>
                              <SelectItem value="em_transito">Em Trânsito</SelectItem>
                              <SelectItem value="entregue">Entregue</SelectItem>
                              <SelectItem value="cancelado">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {pedido.opcao_entrega === "entrega" && (
                          <div className="flex gap-2">
                            <Input
                              id={`rastreio-${item.id || item.item_id}`}
                              placeholder="Cód. Rastreio"
                              defaultValue={item.codigo_rastreio || ""}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const inputId = `rastreio-${item.id || item.item_id}`;
                                const input = document.getElementById(inputId) as HTMLInputElement;
                                if (input) updateItemRastreioMutation.mutate({ itemId: item.id || item.item_id, codigo: input.value });
                              }}
                            >
                              Salvar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-3 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/chat/${pedido.comprador.id}`)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Falar com Cliente
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PainelVendedor;