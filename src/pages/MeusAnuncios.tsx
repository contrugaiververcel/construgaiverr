import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";

const MeusAnuncios = () => {
  const [user, setUser] = useState<any>(null);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anuncioToDelete, setAnuncioToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (user) {
      fetchMeusAnuncios();
    }
  }, [user]);

  const fetchMeusAnuncios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .eq("usuario_id", user.id)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setAnuncios(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar anúncios");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!anuncioToDelete) return;

    try {
      const { error } = await supabase
        .from("anuncios")
        .delete()
        .eq("id", anuncioToDelete);

      if (error) throw error;
      toast.success("Anúncio excluído com sucesso");
      fetchMeusAnuncios();
    } catch (error: any) {
      toast.error("Erro ao excluir anúncio");
    } finally {
      setDeleteDialogOpen(false);
      setAnuncioToDelete(null);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold">Meus Anúncios</h1>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Plus className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Faça login para gerenciar seus anúncios</p>
            <Button onClick={() => navigate("/auth")}>Fazer Login</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Meus Anúncios</h1>
          <Button size="icon" onClick={() => navigate("/novo-anuncio")} className="shadow-orange">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : anuncios.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-2">
            <p>Você ainda não criou nenhum anúncio</p>
            <Button onClick={() => navigate("/novo-anuncio")} className="mt-4">
              <Plus className="h-5 w-5 mr-2" />
              Criar primeiro anúncio
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {anuncios.map((anuncio) => (
              <Card key={anuncio.id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden">
                    {anuncio.imagens?.[0] && (
                      <img 
                        src={anuncio.imagens[0]} 
                        alt={anuncio.titulo}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{anuncio.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{anuncio.categoria}</p>
                    <p className="text-lg font-bold text-primary mt-1">
                      R$ {anuncio.preco}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => navigate(`/editar-anuncio/${anuncio.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => {
                        setAnuncioToDelete(anuncio.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default MeusAnuncios;
