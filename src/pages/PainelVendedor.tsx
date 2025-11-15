import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Package, TrendingUp, Bell, Save } from "lucide-react";

const PainelVendedor = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [metricas, setMetricas] = useState({
    totalPedidos: 0,
    totalVendas: 0,
    pedidosPendentes: 0,
  });
  const navigate = useNavigate();

  const [empresaForm, setEmpresaForm] = useState({
    nome_empresa: "",
    cnpj: "",
    descricao_empresa: "",
    logo_empresa: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchUserRole(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (data) {
      setProfile(data);
      setEmpresaForm({
        nome_empresa: data.nome_empresa || "",
        cnpj: data.cnpj || "",
        descricao_empresa: data.descricao_empresa || "",
        logo_empresa: data.logo_empresa || "",
      });
    }
  };

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    setUserRole(data?.role || null);
    
    if (data?.role === "vendedor") {
      fetchPedidosVendedor(userId);
      fetchMetricas(userId);
    } else {
      toast.error("Você precisa ser um vendedor para acessar este painel");
      navigate("/perfil");
    }
  };

  const fetchPedidosVendedor = async (userId: string) => {
    const { data } = await supabase
      .from("pedidos")
      .select(`
        *,
        itens_pedido(
          *,
          anuncio:anuncios(*)
        ),
        endereco:enderecos(*)
      `)
      .order("criado_em", { ascending: false });

    if (data) {
      const pedidosDoVendedor = data.filter((pedido) =>
        pedido.itens_pedido.some(
          (item: any) => item.anuncio.usuario_id === userId
        )
      );
      setPedidos(pedidosDoVendedor);
    }
  };

  const fetchMetricas = async (userId: string) => {
    const { data: anuncios } = await supabase
      .from("anuncios")
      .select("id")
      .eq("usuario_id", userId);

    if (anuncios) {
      const anuncioIds = anuncios.map((a) => a.id);

      const { data: itensPedido } = await supabase
        .from("itens_pedido")
        .select("*, pedido:pedidos(*)")
        .in("anuncio_id", anuncioIds);

      if (itensPedido) {
        const totalVendas = itensPedido.reduce(
          (sum, item) => sum + Number(item.subtotal),
          0
        );
        const pedidosUnicos = new Set(itensPedido.map((i) => i.pedido_id));
        const pedidosPendentes = itensPedido.filter(
          (i) => i.pedido?.status === "pendente"
        );

        setMetricas({
          totalPedidos: pedidosUnicos.size,
          totalVendas,
          pedidosPendentes: new Set(
            pedidosPendentes.map((p) => p.pedido_id)
          ).size,
        });
      }
    }
  };

  const handleSaveEmpresa = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("usuarios")
      .update(empresaForm)
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao salvar informações da empresa");
    } else {
      toast.success("Informações da empresa atualizadas!");
      fetchProfile(user.id);
    }
  };

  if (!user || userRole !== "vendedor") {
    return (
      <MainLayout>
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold">Painel do Vendedor</h1>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Painel do Vendedor</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Total de Pedidos</h3>
            </div>
            <p className="text-3xl font-bold">{metricas.totalPedidos}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Total de Vendas</h3>
            </div>
            <p className="text-3xl font-bold">
              R$ {metricas.totalVendas.toFixed(2)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold">Pedidos Pendentes</h3>
            </div>
            <p className="text-3xl font-bold">{metricas.pedidosPendentes}</p>
          </Card>
        </div>

        <Tabs defaultValue="empresa" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="empresa" className="flex-1">
              <Building2 className="h-4 w-4 mr-2" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="flex-1">
              <Package className="h-4 w-4 mr-2" />
              Pedidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Informações da Empresa
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome_empresa">Nome da Empresa</Label>
                  <Input
                    id="nome_empresa"
                    value={empresaForm.nome_empresa}
                    onChange={(e) =>
                      setEmpresaForm({
                        ...empresaForm,
                        nome_empresa: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={empresaForm.cnpj}
                    onChange={(e) =>
                      setEmpresaForm({ ...empresaForm, cnpj: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="descricao_empresa">
                    Descrição da Empresa
                  </Label>
                  <Textarea
                    id="descricao_empresa"
                    value={empresaForm.descricao_empresa}
                    onChange={(e) =>
                      setEmpresaForm({
                        ...empresaForm,
                        descricao_empresa: e.target.value,
                      })
                    }
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="logo_empresa">URL do Logo</Label>
                  <Input
                    id="logo_empresa"
                    value={empresaForm.logo_empresa}
                    onChange={(e) =>
                      setEmpresaForm({
                        ...empresaForm,
                        logo_empresa: e.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                </div>

                <Button onClick={handleSaveEmpresa} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Informações
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="pedidos" className="space-y-4">
            {pedidos.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum pedido recebido ainda
                </p>
              </Card>
            ) : (
              pedidos.map((pedido) => (
                <Card key={pedido.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          Pedido #{pedido.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pedido.criado_em).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          pedido.status === "pendente"
                            ? "bg-orange-100 text-orange-700"
                            : pedido.status === "confirmado"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {pedido.status}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <p className="font-semibold mb-2">Itens do Pedido:</p>
                      {pedido.itens_pedido
                        .filter(
                          (item: any) => item.anuncio.usuario_id === user.id
                        )
                        .map((item: any) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm mb-1"
                          >
                            <span>
                              {item.anuncio.titulo} x{item.quantidade}
                            </span>
                            <span className="font-semibold">
                              R$ {Number(item.subtotal).toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {pedido.endereco && (
                      <div className="border-t pt-3 text-sm">
                        <p className="font-semibold mb-1">Endereço de Entrega:</p>
                        <p>{pedido.endereco.nome_destinatario}</p>
                        <p>
                          {pedido.endereco.rua}, {pedido.endereco.numero}
                        </p>
                        <p>
                          {pedido.endereco.bairro} - {pedido.endereco.cidade}/
                          {pedido.endereco.uf}
                        </p>
                        <p>CEP: {pedido.endereco.cep}</p>
                        <p>Tel: {pedido.endereco.telefone_contato}</p>
                      </div>
                    )}

                    <div className="border-t pt-3 text-sm">
                      <p className="font-semibold">
                        Opção de Entrega: {pedido.opcao_entrega}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default PainelVendedor;
