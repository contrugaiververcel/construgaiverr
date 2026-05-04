import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";


const anuncioSchema = z.object({
  titulo: z.string().min(5, "Título deve ter no mínimo 5 caracteres").max(100),
  descricao: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres").max(1000),
  preco: z.number().positive("Preço deve ser maior que zero"),
  preco_oferta: z.number().positive().optional(),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  imagens: z.array(z.string()).optional(),
  medidas: z.string().optional(),
  quantidade: z.number().int().positive().optional(),
  dias_locacao: z.number().int().positive().optional(),
  tipo: z.enum(["Venda", "Locação"]),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  condicao: z.enum(["Novo", "Usado"]).optional(),
  entrega: z.boolean(),
});

const EditarAnuncio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAnuncio, setLoadingAnuncio] = useState(true);
  
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [precoOferta, setPrecoOferta] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [medidas, setMedidas] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [diasLocacao, setDiasLocacao] = useState("");
  const [tipo, setTipo] = useState<"Venda" | "Locação">("Venda");
  const [categoria, setCategoria] = useState("");
  const [condicao, setCondicao] = useState<"Novo" | "Usado">("Novo");
  const [entrega, setEntrega] = useState(false);
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        // Verifica server-side se o usuário logado é administrador
        const { data: adminCheck } = await supabase.rpc("is_admin", {
          _user_id: user.id,
        });
        setIsAdmin(!!adminCheck);
      } else {
        navigate("/auth");
      }
    };
    checkAccess();
  }, [user, navigate]);

  useEffect(() => {
    if (id && (user || isAdmin)) {
      fetchAnuncio();
    }
  }, [id, user, isAdmin]);

  const fetchAnuncio = async () => {
    try {
      setLoadingAnuncio(true);
      let query = supabase
        .from("anuncios")
        .select("*")
        .eq("id", id)
        .single();

      if (!isAdmin && user) {
        query = query.eq("usuario_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setTitulo(data.titulo);
      setDescricao(data.descricao);
      setPreco(data.preco.toString());
      setPrecoOferta(data.preco_oferta?.toString() || "");
      setCidade(data.cidade);
      setBairro(data.bairro);
      setMedidas(data.medidas || "");
      setQuantidade(data.quantidade?.toString() || "");
      setDiasLocacao(data.dias_locacao?.toString() || "");
      setTipo(data.tipo as "Venda" | "Locação");
      setCategoria(data.categoria);
      setCondicao((data.condicao || "Novo") as "Novo" | "Usado");
      setEntrega(data.entrega || false);
      setExistingImages(data.imagens || []);
    } catch (error: any) {
      toast.error("Erro ao carregar anúncio");
      if (!isAdmin) {
        navigate("/meus-anuncios");
      }
    } finally {
      setLoadingAnuncio(false);
    }
  };

  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + imageFiles.length + files.length;

    // Validação de tipo MIME real (não apenas extensão)
    const invalidFiles = files.filter((f) => !ALLOWED_MIME_TYPES.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error("Apenas imagens JPG, PNG, WebP ou GIF são permitidas.");
      return;
    }

    if (totalImages > 10) {
      toast.error("Máximo de 10 imagens permitido");
      return;
    }

    setImageFiles((prev) => [...prev, ...files]);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      const uploadFolder = user?.id ? user.id : 'admin-uploads';

      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uploadFolder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

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
    setLoading(true);

    try {
      const uploadedImageUrls = await uploadImages();
      const allImageUrls = [...existingImages, ...uploadedImageUrls];

      const anuncioData = {
        titulo,
        descricao,
        preco: parseFloat(preco),
        preco_oferta: precoOferta ? parseFloat(precoOferta) : undefined,
        cidade,
        bairro,
        imagens: allImageUrls,
        medidas: medidas || undefined,
        quantidade: quantidade ? parseInt(quantidade) : undefined,
        dias_locacao: diasLocacao ? parseInt(diasLocacao) : undefined,
        tipo,
        categoria,
        condicao: condicao || undefined,
        entrega,
      };

      const validatedData = anuncioSchema.parse(anuncioData);

      const { error } = await supabase
        .from("anuncios")
        .update({
          ...validatedData,
          preco_oferta: validatedData.preco_oferta || null,
          medidas: validatedData.medidas || null,
          quantidade: validatedData.quantidade || null,
          dias_locacao: validatedData.dias_locacao || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Anúncio atualizado com sucesso!");
      
      if (isAdmin) {
        navigate("/gerenciar-painel-administrativo");
      } else {
        navigate("/meus-anuncios");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        toast.error(error.message || "Erro ao atualizar anúncio");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingAnuncio) {
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
      <div className="p-4 space-y-4 pb-24">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{isAdmin ? "Gerenciar Anúncio" : "Editar Anúncio"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Anúncio*</Label>
              <RadioGroup value={tipo} onValueChange={(value: any) => setTipo(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Venda" id="venda" />
                  <Label htmlFor="venda" className="font-normal">Venda</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Locação" id="locacao" />
                  <Label htmlFor="locacao" className="font-normal">Locação</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título*</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Betoneira 400L"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição*</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o produto..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preco">Preço (R$)*</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  A plataforma cobra uma taxa de 10% sobre o valor.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="precoOferta">Preço de Oferta</Label>
                <Input
                  id="precoOferta"
                  type="number"
                  step="0.01"
                  value={precoOferta}
                  onChange={(e) => setPrecoOferta(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
            
            {tipo === "Venda" ? (
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="1"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="diasLocacao">Dias de Locação</Label>
                <Input
                  id="diasLocacao"
                  type="number"
                  value={diasLocacao}
                  onChange={(e) => setDiasLocacao(e.target.value)}
                  placeholder="1"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria*</Label>
              <Select value={categoria} onValueChange={setCategoria} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                  <SelectItem value="Materiais">Materiais</SelectItem>
                  <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condicao">Condição</Label>
              <RadioGroup value={condicao} onValueChange={(value: any) => setCondicao(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Novo" id="novo" />
                  <Label htmlFor="novo" className="font-normal">Novo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Usado" id="usado" />
                  <Label htmlFor="usado" className="font-normal">Usado</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medidas">Medidas</Label>
              <Input
                id="medidas"
                value={medidas}
                onChange={(e) => setMedidas(e.target.value)}
                placeholder="Ex: 50cm x 30cm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade*</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: São Paulo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro*</Label>
                <Input
                  id="bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Ex: Centro"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="entrega"
                checked={entrega}
                onCheckedChange={(checked) => setEntrega(checked as boolean)}
              />
              <Label htmlFor="entrega" className="font-normal">Oferece entrega</Label>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Imagens (máx. 10)</Label>
              <div className="space-y-4">
                {(existingImages.length > 0 || imagePreviewUrls.length > 0) && (
                  <div className="grid grid-cols-3 gap-3">
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="relative aspect-square">
                        <img 
                          src={url} 
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeExistingImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {imagePreviewUrls.map((url, index) => (
                      <div key={`new-${index}`} className="relative aspect-square">
                        <img 
                          src={url} 
                          alt={`Nova imagem ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeNewImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div>
                  <input
                    type="file"
                    id="images"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={existingImages.length + imageFiles.length >= 10}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('images')?.click()}
                    disabled={existingImages.length + imageFiles.length >= 10}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar mais imagens
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={loading || uploadingImages}
          >
            {uploadingImages ? "Fazendo upload..." : loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditarAnuncio;