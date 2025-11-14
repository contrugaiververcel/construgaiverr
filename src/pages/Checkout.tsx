import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [carrinho, setCarrinho] = useState<any[]>([]);
  
  // Dados de endereço
  const [tipoEndereco, setTipoEndereco] = useState("");
  const [nomeDestinatario, setNomeDestinatario] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [semNumero, setSemNumero] = useState(false);
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [telefoneContato, setTelefoneContato] = useState("");
  const [informacoesAdicionais, setInformacoesAdicionais] = useState("");
  
  // Opção de entrega
  const [opcaoEntrega, setOpcaoEntrega] = useState<"entrega" | "retirada">("entrega");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchCarrinho();
    }
  }, [user]);

  const fetchCarrinho = async () => {
    try {
      const { data, error } = await supabase
        .from("carrinho")
        .select("*, anuncio:anuncios(*)")
        .eq("usuario_id", user.id);

      if (error) throw error;
      setCarrinho(data || []);
      
      if (data?.length === 0) {
        toast.error("Seu carrinho está vazio");
        navigate("/carrinho");
      }
    } catch (error) {
      toast.error("Erro ao carregar carrinho");
    }
  };

  const handleSubmitEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const finalizarPedido = async () => {
    setLoading(true);
    try {
      // Criar endereço
      const { data: enderecoData, error: enderecoError } = await supabase
        .from("enderecos")
        .insert({
          usuario_id: user.id,
          tipo_endereco: tipoEndereco,
          nome_destinatario: nomeDestinatario,
          cep,
          rua,
          numero: semNumero ? null : numero,
          sem_numero: semNumero,
          bairro,
          cidade,
          uf,
          telefone_contato: telefoneContato,
          informacoes_adicionais: informacoesAdicionais,
        })
        .select()
        .single();

      if (enderecoError) throw enderecoError;

      // Calcular total
      const total = carrinho.reduce((acc, item) => acc + item.total, 0);

      // Criar pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          usuario_id: user.id,
          endereco_id: enderecoData.id,
          opcao_entrega: opcaoEntrega,
          total,
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Criar itens do pedido
      const itens = carrinho.map((item) => ({
        pedido_id: pedidoData.id,
        anuncio_id: item.anuncio_id,
        quantidade: item.quantidade,
        preco_unitario: item.anuncio.preco,
        subtotal: item.total,
      }));

      const { error: itensError } = await supabase
        .from("itens_pedido")
        .insert(itens);

      if (itensError) throw itensError;

      // Limpar carrinho
      const { error: deleteError } = await supabase
        .from("carrinho")
        .delete()
        .eq("usuario_id", user.id);

      if (deleteError) throw deleteError;

      toast.success("Pedido realizado com sucesso!");
      navigate("/pedidos");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao finalizar pedido");
    } finally {
      setLoading(false);
    }
  };

  const total = carrinho.reduce((acc, item) => acc + item.total, 0);

  return (
    <MainLayout>
      <div className="p-4 space-y-4 pb-24">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Finalizar Compra</h1>
        </div>

        {step === 1 ? (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dados de Entrega</h2>
            <form onSubmit={handleSubmitEndereco} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipoEndereco">Tipo de endereço*</Label>
                <Input
                  id="tipoEndereco"
                  value={tipoEndereco}
                  onChange={(e) => setTipoEndereco(e.target.value)}
                  placeholder="Ex: Casa, Trabalho"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeDestinatario">Nome do destinatário*</Label>
                <Input
                  id="nomeDestinatario"
                  value={nomeDestinatario}
                  onChange={(e) => setNomeDestinatario(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP*</Label>
                <Input
                  id="cep"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rua">Rua/Avenida*</Label>
                <Input
                  id="rua"
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número*</Label>
                  <Input
                    id="numero"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    disabled={semNumero}
                    required={!semNumero}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="semNumero"
                      checked={semNumero}
                      onCheckedChange={(checked) => setSemNumero(checked as boolean)}
                    />
                    <Label htmlFor="semNumero" className="text-sm">Sem número</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro*</Label>
                <Input
                  id="bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="cidade">Cidade*</Label>
                  <Input
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF*</Label>
                  <Input
                    id="uf"
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefoneContato">Telefone de contato*</Label>
                <Input
                  id="telefoneContato"
                  type="tel"
                  value={telefoneContato}
                  onChange={(e) => setTelefoneContato(e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="informacoesAdicionais">Informações adicionais</Label>
                <Input
                  id="informacoesAdicionais"
                  value={informacoesAdicionais}
                  onChange={(e) => setInformacoesAdicionais(e.target.value)}
                  placeholder="Ex: Ponto de referência"
                />
              </div>

              <Button type="submit" className="w-full">
                Continuar
              </Button>
            </form>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Opção de Entrega</h2>
              <RadioGroup value={opcaoEntrega} onValueChange={(value: any) => setOpcaoEntrega(value)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="entrega" id="entrega" />
                  <Label htmlFor="entrega" className="flex-1 cursor-pointer">
                    Entrega no endereço informado
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="retirada" id="retirada" />
                  <Label htmlFor="retirada" className="flex-1 cursor-pointer">
                    Retirar na loja
                  </Label>
                </div>
              </RadioGroup>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
              <div className="space-y-2">
                {carrinho.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.anuncio.titulo} x{item.quantidade}</span>
                    <span>R$ {item.total.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={finalizarPedido} disabled={loading} className="flex-1">
                {loading ? "Finalizando..." : "Finalizar Pedido"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Checkout;