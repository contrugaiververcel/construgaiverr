import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { ArrowLeft, Upload, X } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const anuncioSchema = z.object({
  titulo: z.string().trim().min(3, "Título deve ter no mínimo 3 caracteres").max(200, "Título deve ter no máximo 200 caracteres"),
  descricao: z.string().trim().min(10, "Descrição deve ter no mínimo 10 caracteres").max(2000, "Descrição deve ter no máximo 2000 caracteres"),
  preco: z.number().positive("Preço deve ser maior que zero").max(999999999, "Preço muito alto"),
  preco_oferta: z.number().positive("Preço de oferta deve ser maior que zero").optional(),
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    preco: "",
    preco_oferta: "",
    tipo: "Venda",
    categoria: "Materiais",
    cidade: "",
    bairro: "",
    medidas: "",
    entrega: false,
    condicao: "novo",
    quantidade: "",
    dias_locacao: "",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (imageFiles.length + files.length > 10) {
      toast.error("Você pode enviar no máximo 10 imagens");
      return;
    }

    setImageFiles([...imageFiles, ...files]);
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setImageFiles(newFiles);
    setImagePreviewUrls(newPreviews);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error: any) {
      toast.error("Erro ao fazer upload das imagens");
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Você precisa estar logado para criar um anúncio");
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // Upload images first
      const uploadedImageUrls = await uploadImages();

      // Validate input data
      const validatedData = anuncioSchema.parse({
        titulo: formData.titulo,
        descricao: formData.descricao,
        preco: parseFloat(formData.preco),
        preco_oferta: formData.preco_oferta ? parseFloat(formData.preco_oferta) : undefined,
        cidade: formData.cidade,
        bairro: formData.bairro,
        imagens: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
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
        preco_oferta: validatedData.preco_oferta || null,
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

            <div className="grid grid-cols-2 gap-4">
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
                <p className="text-xs text-muted-foreground">
                  A plataforma cobra uma taxa de 10% sobre o valor.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_oferta">Preço de Oferta (Opcional)</Label>
                <Input
                  id="preco_oferta"
                  type="number"
                  step="0.01"
                  value={formData.preco_oferta}
                  onChange={(e) =>
                    setFormData({ ...formData, preco_oferta: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
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
              <Label htmlFor="imagens">Imagens do produto</Label>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    id="imagens"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('imagens')?.click()}
                    disabled={imageFiles.length >= 10}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar imagens ({imageFiles.length}/10)
                  </Button>
                </div>
                
                {imagePreviewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Você pode selecionar até 10 imagens
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

            <Button type="submit" className="w-full" disabled={loading || uploadingImages}>
              {uploadingImages ? "Enviando imagens..." : loading ? "Criando..." : "Criar anúncio"}
            </Button>
          </form>
        )}
      </div>
    </MainLayout>
  );
};

export default NovoAnuncio;