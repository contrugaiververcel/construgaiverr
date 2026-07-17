import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Package, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const fetchMetrics = async () => {
  const { data, error } = await supabase.rpc('get_admin_metrics');
  if (error) throw error;
  return data;
};

const MetricCard = ({ title, value, icon: Icon, formatAsCurrency = false }) => (
  <Card className="p-4 flex items-center justify-between">
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">
        {formatAsCurrency ? `R$ ${Number(value).toFixed(2)}` : value}
      </p>
    </div>
    <Icon className="h-8 w-8 text-muted-foreground" />
  </Card>
);

const MetricCardSkeleton = () => (
  <Card className="p-4 flex items-center justify-between">
    <div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-32" />
    </div>
    <Skeleton className="h-8 w-8 rounded-full" />
  </Card>
);

const AdminMetricsTab = () => {
  const { data: metrics, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminMetrics"],
    queryFn: fetchMetrics,
    onError: (error) => {
      toast.error(`Erro ao carregar métricas: ${error.message}`);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Métricas Gerais</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : isError ? (
          <Card className="p-6 text-center text-destructive col-span-3">
            Erro ao carregar métricas. Tente atualizar.
          </Card>
        ) : (
          <>
            <MetricCard title="Vendas Totais" value={metrics.totalSales} icon={DollarSign} formatAsCurrency />
            <MetricCard title="Pedidos Realizados" value={metrics.totalOrders} icon={TrendingUp} />
            <MetricCard title="Anúncios Ativos" value={metrics.totalAds} icon={Package} />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMetricsTab;