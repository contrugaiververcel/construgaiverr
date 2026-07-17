import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
import { useState } from "react";

const fetchAllAds = async () => {
  const { data, error } = await supabase
    .from("anuncios")
    .select("*, usuario:usuarios(nome, nome_empresa)")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data;
};

const AdminAdsTab = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);

  const { data: ads, isLoading, isError } = useQuery({
    queryKey: ["adminAds"],
    queryFn: fetchAllAds,
  });

  const deleteMutation = useMutation({
    mutationFn: async (adId: string) => {
      const { error } = await supabase.from("anuncios").delete().eq("id", adId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anúncio excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["adminAds"] });
    },
    onError: (error) => {
      toast.error(`Erro ao excluir anúncio: ${error.message}`);
    },
  });

  const handleDeleteClick = (adId: string) => {
    setAdToDelete(adId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (adToDelete) {
      deleteMutation.mutate(adToDelete);
      setDeleteDialogOpen(false);
      setAdToDelete(null);
    }
  };

  if (isLoading) {
    return <Card className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /> Carregando anúncios...</Card>;
  }

  if (isError) {
    return <Card className="p-6 text-center text-destructive">Erro ao carregar anúncios.</Card>;
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Gerenciar Anúncios</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads?.map((ad: any) => (
            <TableRow key={ad.id}>
              <TableCell className="font-medium">{ad.titulo}</TableCell>
              <TableCell>{ad.usuario?.nome_empresa || ad.usuario?.nome || 'N/A'}</TableCell>
              <TableCell>R$ {ad.preco.toFixed(2)}</TableCell>
              <TableCell>{ad.tipo}</TableCell>
              <TableCell className="text-right flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => navigate(`/editar-anuncio/${ad.id}`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => handleDeleteClick(ad.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este anúncio? Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default AdminAdsTab;