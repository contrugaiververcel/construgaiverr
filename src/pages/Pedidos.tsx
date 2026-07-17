import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MessageCircle, CheckCircle, Truck, Home, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Pedidos = () => {
  const { user, loading: authLoading } = useAuth();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchPedidos();
      } else {
        toast.error("Por favor, faça login para ver seus pedidos");
        navigate("/auth");
      }
    }
  }, [user, authLoading, navigate]);

  const fetchPedidos = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pedidos")
        .select("*, endereco:enderecos(*), itens:itens_pedido(*, anuncio:anuncios(*, vendedor:usuarios(id, nome_empresa, nome)))")
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

  const renderTrackingProgressBar = (status: string, trackingCode: string | null) => {
    // Treat cancelado specially or just don't show progress properly?
    if (status === 'cancelado') return null;

    const steps = [
      { id: 'pendente', label: 'Pendente', icon: Package },
      { id: 'confirmado', label: 'Confirmado', icon: CheckCircle },
      { id: 'em_transito', label: 'Em Trânsito', icon: Truck },
      { id: 'entregue', label: 'Entregue', icon: Home }
    ];

    // Some legacy orders might use 'enviado' instead of 'em_transito'
    const normalizedStatus = status === 'enviado' ? 'em_transito' : status;
    const currentStepIndex = steps.findIndex(s => s.id === normalizedStatus) > -1
      ? steps.findIndex(s => s.id === normalizedStatus)
      : 0;

    return (
      <div className="py-2 mt-2">
        <h4 className="font-semibold mb-4 text-sm text-muted-foreground">Acompanhamento da Entrega</h4>
        <div className="relative flex justify-between px-2 sm:px-4">
          <div className="absolute top-4 left-6 right-6 h-1 bg-muted -translate-y-1/2 z-0"></div>
          <div
            className="absolute top-4 left-6 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 2rem)` }}
          ></div>

          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted text-muted-foreground'
                  } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] sm:text-xs font-medium ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {trackingCode && (
          <div className="mt-6 p-3 bg-muted/30 border rounded-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Código de Rastreio</p>
              <p className="font-mono font-bold text-sm sm:text-base">{trackingCode}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => {
              window.open(`https://linketrack.com/track?codigo=${trackingCode}`, '_blank');
            }}>
              Acompanhar
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (authLoading || (loading && pedidos.length === 0)) {
    return (
      <MainLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando seus pedidos...</p>
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
            {pedidos.flatMap(pedido =>
              (pedido.itens || []).map((item: any) => (
                <Card key={item.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start border-b pb-3">
                    <div>
                      <p className="font-semibold">
                        Pedido #{item.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Comprado em {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {getStatusBadge(item.status || "pendente")}
                  </div>

                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden shrink-0">
                      {item.anuncio?.imagens?.[0] && (
                        <img
                          src={item.anuncio.imagens[0]}
                          alt={item.anuncio.titulo}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{item.anuncio?.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        Vendido por: {item.anuncio?.vendedor?.nome_empresa || item.anuncio?.vendedor?.nome}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                        <p className="font-bold text-lg text-primary">
                          R$ {item.subtotal.toFixed(2)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/chat/${item.anuncio.vendedor.id}`)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Falar com Vendedor
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 flex flex-col sm:flex-row justify-between text-sm gap-2">
                    <div>
                      <span className="text-muted-foreground font-medium block mb-1">Logística</span>
                      <p>{pedido.opcao_entrega === "entrega" ? "Entrega no endereço" : "Retirada com o vendedor"}</p>
                    </div>
                    {pedido.opcao_entrega === "entrega" && pedido.endereco && (
                      <div className="sm:text-right">
                        <span className="text-muted-foreground font-medium block mb-1">Destino</span>
                        <p>{pedido.endereco.cidade}, {pedido.endereco.uf}</p>
                      </div>
                    )}
                  </div>

                  {pedido.opcao_entrega === "entrega" && renderTrackingProgressBar(item.status || "pendente", item.codigo_rastreio || null)}
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </MainLayout >
  );
};

export default Pedidos;