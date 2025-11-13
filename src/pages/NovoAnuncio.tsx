import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

const anuncioSchema = z.object({
  titulo: z.string().trim().min(3, "Título deve ter no mínimo 3 caracteres").max(200, "Título deve ter no máximo 200 caracteres"),
  descricao: z.string().trim().min(10, "Descrição deve ter no mínimo 10 caracteres").max(2000, "Descrição deve ter no máximo 2000 caracteres"),
  preco: z.number().positive("Preço deve ser maior que zero").max(999999999, "Preço muito alto"),
  cidade: z.string().trim().min(2, "Cidade deve ter no mínimo 2 caracteres").max(100, "Cidade deve ter no máximo 100 caracteres"),
  bairro: z.string().trim().min(2, "Bairro deve ter no mínimo 2 caracteres").max(100, "Bairro deve ter no máximo 100 caracteres"),
  imagens: z.array(z.string().url("URL de imagem inválida")).max(10, "Máximo de 10 imagens permitidas").optional(),
  medidas: z.string().trim().max(200, "Medidas devem ter no máximo 200 caracteres").optional(),
  quantidade: z.number().int("Quantidade deve ser um número inteiro").positive("Quantidade deve ser maior que zero").max(999999, "Quantidade muito alta").optional(),
  dias_locacao: z.number().int("Dias de locação deve ser um número inteiro").positive("Dias de locação deve ser maior que zero").max(365, "Máximo de 365 dias de locação").optional(),
  tipo: z.enum(["Venda", "Locação", "Venda e Locação"]),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  condicao: z.enum(["novo", "seminovo", "usado"]),
  entrega: z.boolean(),
});

const NovoAnuncio = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    preco: "",
    tipo: "Venda",
    categoria: "Materiais",
    cidade: "",
    bairro: "",
    imagens: "",
    medidas: "",
    entrega: false,
    condicao: "novo",
    quantidade: "",
    dias_locacao: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Você precisa estar logado para criar um anúncio");
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      const imagensArray = formData.imagens
        ? formData.imagens.split(",").map((img) => img.trim())
        : [];

      // Validate input data
      const validatedData = anuncioSchema.parse({
        titulo: formData.titulo,
        descricao: formData.descricao,
        preco: parseFloat(formData.preco),
        cidade: formData.cidade,
        bairro: formData.bairro,
        imagens: imagensArray.length > 0 ? imagensArray : undefined,
        medidas: formData.medidas || undefined,
        quantidade: formData.quantidade ? parseInt(formData.quantidade) : undefined,
        dias_locacao: formData.dias_locacao ? parseInt(formData.dias_locacao) : undefined,
        tipo: formData.tipo as "Venda" | "Locação" | "Venda e Locação",
        categoria: formData.categoria,
        condicao: formData.condicao as "novo" | "seminovo" | "usado",
        entrega: formData.entrega,
      });

      const { error } = await supabase.from("anuncios").insert({
        titulo: validatedData.titulo,
        descricao: validatedData.descricao,
        preco: validatedData.preco,
        tipo: validatedData.tipo,
        categoria: validatedData.categoria,
        cidade: validatedData.cidade,
        bairro: validatedData.bairro,
        imagens: validatedData.imagens || [],
        usuario_id: user.id,
        medidas: validatedData.medidas || null,
        entrega: validatedData.entrega,
        condicao: validatedData.condicao,
        quantidade: validatedData.quantidade || null,
        dias_locacao: validatedData.dias_locacao || null,
      });

      if (error) throw error;

      toast.success("Anúncio criado com sucesso!");
      navigate("/home");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Erro ao criar anúncio. Por favor, tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Criar anúncio</h1>
        </div>

        {!user ? (
          <Card className="p-6 space-y-4">
            <p className="text-muted-foreground">
              Você precisa estar logado para criar um anúncio
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Fazer login ou cadastrar-se
            </Button>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                required
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                placeholder="Ex: Betoneira 400L"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                required
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva seu produto ou serviço"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$) *</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                required
                value={formData.preco}
                onChange={(e) =>
                  setFormData({ ...formData, preco: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Venda">Venda</SelectItem>
                  <SelectItem value="Locação">Locação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoria: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Materiais">Materiais</SelectItem>
                  <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                  <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                  <SelectItem value="Serviços">Serviços</SelectItem>
                  <SelectItem value="Transporte">Transporte</SelectItem>
                  <SelectItem value="Segurança">Segurança</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                required
                value={formData.cidade}
                onChange={(e) =>
                  setFormData({ ...formData, cidade: e.target.value })
                }
                placeholder="Ex: São Paulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                required
                value={formData.bairro}
                onChange={(e) =>
                  setFormData({ ...formData, bairro: e.target.value })
                }
                placeholder="Ex: Centro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagens">URLs das Imagens</Label>
              <Input
                id="imagens"
                value={formData.imagens}
                onChange={(e) =>
                  setFormData({ ...formData, imagens: e.target.value })
                }
                placeholder="Separe múltiplas URLs por vírgula"
              />
              <p className="text-xs text-muted-foreground">
                Cole as URLs das imagens separadas por vírgula
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medidas">Medidas (opcional)</Label>
              <Input
                id="medidas"
                placeholder="Ex: 10x20cm, 5kg, etc"
                value={formData.medidas}
                onChange={(e) =>
                  setFormData({ ...formData, medidas: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="entrega"
                checked={formData.entrega}
                onChange={(e) =>
                  setFormData({ ...formData, entrega: e.target.checked })
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="entrega" className="cursor-pointer">
                Oferece entrega
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condicao">Condição</Label>
              <Select
                value={formData.condicao}
                onValueChange={(value) =>
                  setFormData({ ...formData, condicao: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a condição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="seminovo">Seminovo</SelectItem>
                  <SelectItem value="usado">Usado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo !== "Locação" && (
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade disponível (opcional)</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  placeholder="Ex: 10"
                  value={formData.quantidade}
                  onChange={(e) =>
                    setFormData({ ...formData, quantidade: e.target.value })
                  }
                />
              </div>
            )}

            {formData.tipo === "Locação" && (
              <div className="space-y-2">
                <Label htmlFor="dias_locacao">Mínimo de dias para locação (opcional)</Label>
                <Input
                  id="dias_locacao"
                  type="number"
                  min="1"
                  placeholder="Ex: 7"
                  value={formData.dias_locacao}
                  onChange={(e) =>
                    setFormData({ ...formData, dias_locacao: e.target.value })
                  }
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar anúncio"}
            </Button>
          </form>
        )}
      </div>
    </MainLayout>
  );
};

export default NovoAnuncio;
