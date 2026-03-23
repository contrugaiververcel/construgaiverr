import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const CONFIG_ID = "00000000-0000-0000-0000-000000000000";
const UPLOAD_IMAGE_FUNCTION_URL = "https://ymhywdfcqqvgzsvqoesu.supabase.co/functions/v1/upload-site-image";
const UPDATE_CONFIG_FUNCTION_URL = "https://ymhywdfcqqvgzsvqoesu.supabase.co/functions/v1/update-config";

const fetchConfig = async () => {
  const { data, error } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("id", CONFIG_ID)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || {};
};

const AdminSettingsTab = () => {
  const queryClient = useQueryClient();
  const { data: config, isLoading, isError } = useQuery({
    queryKey: ["adminConfig"],
    queryFn: fetchConfig,
  });

  const [formData, setFormData] = useState({
    titulo_ofertas: "",
    titulo_encontre: "",
    banner_1_url: "",
    banner_2_url: "",
    favicon_url: "",
  });

  const [uploading, setUploading] = useState({
    favicon: false,
    banner1: false,
    banner2: false,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        titulo_ofertas: config.titulo_ofertas || "",
        titulo_encontre: config.titulo_encontre || "",
        banner_1_url: config.banner_1_url || "",
        banner_2_url: config.banner_2_url || "",
        favicon_url: config.favicon_url || "",
      });
    }
  }, [config]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: 'favicon_url' | 'banner_1_url' | 'banner_2_url',
    storagePath: string
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const uploadKey = fieldName === 'favicon_url' ? 'favicon' : fieldName === 'banner_1_url' ? 'banner1' : 'banner2';

    setUploading(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const fileExt = file.name.split('.').pop();
      const fullStoragePath = `site/${storagePath}.${fileExt}`;

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('path', fullStoragePath);

      const response = await fetch(UPLOAD_IMAGE_FUNCTION_URL, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha no upload da imagem.");
      }

      const { publicUrl } = await response.json();

      setFormData(prev => ({ ...prev, [fieldName]: publicUrl }));
      toast.success("Imagem carregada! Salve as configurações para aplicar.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar a imagem.");
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (updates: typeof formData) => {
      const response = await fetch(UPDATE_CONFIG_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar configurações.");
      }
    },
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["adminConfig"] });
      queryClient.invalidateQueries({ queryKey: ["homeConfig"] });
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <Card className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /> Carregando...</Card>;
  }
  if (isError) {
    return <Card className="p-6 text-center text-destructive">Erro ao carregar configurações.</Card>;
  }

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Configurações Gerais</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Favicon */}
        <div className="space-y-4 border-b pb-6">
          <h3 className="font-medium">Ícone do Site (Favicon)</h3>
          <div className="flex items-center gap-4">
            {formData.favicon_url && <img src={formData.favicon_url} alt="Favicon" className="w-10 h-10 rounded-md border" />}
            <Input id="favicon-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'favicon_url', 'favicon')} className="hidden" />
            <Button type="button" variant="outline" onClick={() => document.getElementById('favicon-upload')?.click()} disabled={uploading.favicon}>
              {uploading.favicon ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading.favicon ? "Carregando..." : "Carregar Ícone"}
            </Button>
          </div>
        </div>

        {/* Títulos */}
        <div className="space-y-4 border-b pb-6">
          <h3 className="font-medium">Títulos da Página Inicial</h3>
          <div className="space-y-2">
            <Label htmlFor="titulo_ofertas">Título da Seção 'Em Oferta'</Label>
            <Input id="titulo_ofertas" value={formData.titulo_ofertas} onChange={(e) => setFormData({ ...formData, titulo_ofertas: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="titulo_encontre">Título da Seção 'Encontre o que precisa'</Label>
            <Input id="titulo_encontre" value={formData.titulo_encontre} onChange={(e) => setFormData({ ...formData, titulo_encontre: e.target.value })} />
          </div>
        </div>

        {/* Banners */}
        <div className="space-y-4">
          <h3 className="font-medium">Banners Promocionais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Banner 1</Label>
              {formData.banner_1_url && <img src={formData.banner_1_url} alt="Banner 1" className="w-full h-24 object-cover rounded-lg border" />}
              <Input id="banner1-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner_1_url', 'banner1')} className="hidden" />
              <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('banner1-upload')?.click()} disabled={uploading.banner1}>
                {uploading.banner1 ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading.banner1 ? "Carregando..." : "Carregar Banner 1"}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Banner 2</Label>
              {formData.banner_2_url && <img src={formData.banner_2_url} alt="Banner 2" className="w-full h-24 object-cover rounded-lg border" />}
              <Input id="banner2-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner_2_url', 'banner2')} className="hidden" />
              <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('banner2-upload')?.click()} disabled={uploading.banner2}>
                {uploading.banner2 ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading.banner2 ? "Carregando..." : "Carregar Banner 2"}
              </Button>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </form>
    </Card>
  );
};

export default AdminSettingsTab;