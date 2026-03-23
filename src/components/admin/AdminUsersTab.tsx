import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Loader2 } from "lucide-react";
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
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DELETE_USER_FUNCTION_URL = "https://ymhywdfcqqvgzsvqoesu.supabase.co/functions/v1/delete-admin-user";

const fetchAllUsers = async () => {
  const { data, error } = await supabase.rpc('get_admin_users');
  if (error) throw error;
  return data || [];
};

const AdminUsersTab = () => {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchAllUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(DELETE_USER_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir usuário.");
      }
    },
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (error) => {
      toast.error(`Erro ao excluir usuário: ${error.message}`);
    },
  });

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  if (isLoading) {
    return <Card className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /> Carregando usuários...</Card>;
  }

  if (isError) {
    return <Card className="p-6 text-center text-destructive">Erro ao carregar usuários. Verifique o console para detalhes.</Card>;
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Gerenciar Usuários</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user: any) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.nome}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="capitalize">{user.role}</TableCell>
              <TableCell>{user.nome_empresa || '-'}</TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => handleDeleteClick(user.id)}
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
            <AlertDialogTitle>Confirmar Exclusão de Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o perfil deste usuário? Isso removerá todos os dados associados (perfil, anúncios, etc.). Esta ação é irreversível.
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

export default AdminUsersTab;