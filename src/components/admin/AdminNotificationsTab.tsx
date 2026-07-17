import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Send, Loader2, Search, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";

interface UserOption {
  id: string;
  nome: string;
  email: string;
}

const NOTIFICATION_FUNCTION_URL = "https://ymhywdfcqqvgzsvqoesu.supabase.co/functions/v1/send-notification";
const DELETE_NOTIFICATION_FUNCTION_URL = "https://ymhywdfcqqvgzsvqoesu.supabase.co/functions/v1/delete-notification";

const fetchAllNotifications = async () => {
  const { data, error } = await supabase.rpc('get_admin_notifications');
  if (error) throw error;
  return data || [];
};

const AdminNotificationsTab = () => {
  const queryClient = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [tag, setTag] = useState("aviso");
  const [destinatarioId, setDestinatarioId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  const notificationTags = ["aviso", "promoção", "sistema", "pedido"];

  const { data: notifications, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: fetchAllNotifications,
  });

  const searchUsers = useCallback(async () => {
    if (searchTerm.length < 3) {
      setUserOptions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, email")
        .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);
      if (error) throw error;
      setUserOptions(data || []);
    } catch (error) {
      toast.error("Erro ao buscar usuários.");
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => searchUsers(), 300);
    return () => clearTimeout(handler);
  }, [searchTerm, searchUsers]);

  const handleSelectUser = (user: UserOption) => {
    setSelectedUser(user);
    setDestinatarioId(user.id);
    setSearchTerm("");
    setUserOptions([]);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setDestinatarioId(null);
    setSearchTerm("");
    setUserOptions([]);
  };

  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationData: { titulo: string, conteudo: string, tag: string, usuario_id: string | null }) => {
      const response = await fetch(NOTIFICATION_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar notificação.");
      }
    },
    onSuccess: () => {
      toast.success(`Notificação enviada com sucesso!`);
      setTitulo("");
      setConteudo("");
      handleClearUser();
      queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
    },
    onError: (error) => toast.error(`Erro ao enviar notificação: ${error.message}`),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(DELETE_NOTIFICATION_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir notificação.");
      }
    },
    onSuccess: () => {
      toast.success("Notificação excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
    },
    onError: (error) => toast.error(`Erro ao excluir notificação: ${error.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !conteudo) {
      toast.error("Título e conteúdo são obrigatórios.");
      return;
    }
    sendNotificationMutation.mutate({ titulo, conteudo, tag, usuario_id: destinatarioId });
  };

  const handleDeleteClick = (notificationId: string) => {
    setNotificationToDelete(notificationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (notificationToDelete) {
      deleteNotificationMutation.mutate(notificationToDelete);
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };

  const destinatarioMessage = destinatarioId ? `Enviar para: ${selectedUser?.nome}` : "Enviar para TODOS os usuários.";

  return (
    <div className="space-y-8">
      <Card className="p-6 space-y-6">
        <h2 className="text-xl font-semibold">Enviar Nova Notificação</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destinatario">Destinatário</Label>
            {selectedUser ? (
              <Card className="p-3 flex items-center justify-between bg-secondary">
                <p className="font-medium text-sm">{selectedUser.nome} ({selectedUser.email})</p>
                <Button variant="ghost" size="icon" onClick={handleClearUser}><X className="h-4 w-4" /></Button>
              </Card>
            ) : (
              <>
                <div className="relative">
                  <Input id="search-user" placeholder="Buscar usuário (ou deixe vazio para Todos)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {searchLoading && <p className="text-sm text-muted-foreground mt-2">Buscando...</p>}
                {userOptions.length > 0 && (
                  <Card className="p-2 max-h-40 overflow-y-auto absolute z-10 w-full shadow-lg bg-background">
                    {userOptions.map(user => (
                      <Button key={user.id} variant="ghost" className="w-full justify-start h-auto py-2" onClick={() => handleSelectUser(user)}>
                        <div className="text-left"><p className="font-medium text-sm">{user.nome}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                      </Button>
                    ))}
                  </Card>
                )}
              </>
            )}
            <p className="text-sm text-muted-foreground">{destinatarioMessage}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag">Tag/Tipo</Label>
            <Select value={tag} onValueChange={setTag}><SelectTrigger id="tag"><SelectValue placeholder="Selecione a tag" /></SelectTrigger><SelectContent>{notificationTags.map(t => (<SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>))}</SelectContent></Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="titulo">Título*</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo*</Label>
            <Textarea id="conteudo" value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={4} required />
          </div>
          <Button type="submit" className="w-full" disabled={sendNotificationMutation.isPending}><Send className="h-4 w-4 mr-2" />{sendNotificationMutation.isPending ? "Enviando..." : "Enviar Notificação"}</Button>
        </form>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Histórico de Envios</h2>
        {isLoadingHistory ? (
          <div className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /> Carregando...</div>
        ) : !notifications || notifications.length === 0 ? (
          <p className="text-muted-foreground text-center">Nenhuma notificação enviada.</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Destinatário</TableHead><TableHead>Tag</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {notifications.map((notif: any) => (
                <TableRow key={notif.id}>
                  <TableCell className="font-medium">{notif.titulo}</TableCell>
                  <TableCell>{notif.nome_usuario || 'Todos'}</TableCell>
                  <TableCell className="capitalize">{notif.tag}</TableCell>
                  <TableCell>{new Date(notif.criado_em).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(notif.id)} disabled={deleteNotificationMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir esta notificação? Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={deleteNotificationMutation.isPending}>{deleteNotificationMutation.isPending ? "Excluindo..." : "Excluir"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNotificationsTab;