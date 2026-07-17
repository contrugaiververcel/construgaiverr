import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { User, Camera, Mail, Phone, MapPin, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const EditarPerfil = () => {
  const { user, profile, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    telefone_movel: "",
    cidade: "",
    bairro: "",
    logo_empresa: "",
    nome_empresa: "",
    cnpj: "",
    descricao_empresa: "",
    horario_funcionamento: "",
    endereco_completo: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }

    if (profile) {
      setFormData({
        nome: profile.nome || "",
        email: profile.email || "",
        telefone: profile.telefone || "",
        telefone_movel: profile.telefone_movel || "",
        cidade: profile.cidade || "",
        bairro: profile.bairro || "",
        logo_empresa: profile.logo_empresa || "",
        nome_empresa: profile.nome_empresa || "",
        cnpj: profile.cnpj || "",
        descricao_empresa: profile.descricao_empresa || "",
        horario_funcionamento: (profile as any).horario_funcionamento || "",
        endereco_completo: (profile as any).endereco_completo || "",
      });
    }
  }, [user, profile, authLoading, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, logo_empresa: publicUrl });
      toast.success("Foto carregada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          nome: formData.nome,
          telefone: formData.telefone,
          telefone_movel: formData.telefone_movel,
          cidade: formData.cidade,
          bairro: formData.bairro,
          logo_empresa: formData.logo_empresa,
          nome_empresa: formData.nome_empresa,
          cnpj: formData.cnpj,
          descricao_empresa: formData.descricao_empresa,
          horario_funcionamento: formData.horario_funcionamento,
          endereco_completo: formData.endereco_completo,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      navigate("/perfil");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Editar Perfil</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {formData.logo_empresa ? (
                  <img
                    src={formData.logo_empresa}
                    alt="Foto de perfil"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
                    {formData.nome ? getInitials(formData.nome) : "?"}
                  </div>
                )}
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90"
                >
                  {uploading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O e-mail não pode ser alterado
                </p>
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div>
                <Label htmlFor="telefone_movel">Telefone Móvel</Label>
                <Input
                  id="telefone_movel"
                  value={formData.telefone_movel}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone_movel: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) =>
                    setFormData({ ...formData, cidade: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) =>
                    setFormData({ ...formData, bairro: e.target.value })
                  }
                />
              </div>
            </div>

            {userRole === "vendedor" && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Dados da Empresa</h3>

                <div>
                  <Label htmlFor="nome_empresa">Nome da Empresa</Label>
                  <Input
                    id="nome_empresa"
                    value={formData.nome_empresa}
                    onChange={(e) =>
                      setFormData({ ...formData, nome_empresa: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj: e.target.value })
                    }
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <Label htmlFor="endereco_completo">Endereço Completo (para retirada)</Label>
                  <Textarea
                    id="endereco_completo"
                    value={formData.endereco_completo}
                    onChange={(e) =>
                      setFormData({ ...formData, endereco_completo: e.target.value })
                    }
                    placeholder="Ex: Rua Exemplo, 123, Centro, São Paulo - SP"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="horario_funcionamento">Horário de Funcionamento</Label>
                  <Textarea
                    id="horario_funcionamento"
                    value={formData.horario_funcionamento}
                    onChange={(e) =>
                      setFormData({ ...formData, horario_funcionamento: e.target.value })
                    }
                    rows={3}
                    placeholder="Ex: Seg-Sex: 9h às 18h, Sáb: 9h às 12h"
                  />
                </div>

                <div>
                  <Label htmlFor="descricao_empresa">Descrição da Empresa</Label>
                  <Textarea
                    id="descricao_empresa"
                    value={formData.descricao_empresa}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        descricao_empresa: e.target.value,
                      })
                    }
                    rows={4}
                  />
                </div>
              </div>
            )}
          </Card>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/perfil")}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditarPerfil;