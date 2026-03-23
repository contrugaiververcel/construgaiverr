import { useState, useEffect } from "react";
import { Bell, X, Package, Tag, AlertTriangle, CheckCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import useNotifications from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import NotificationDetailDialog from "./NotificationDetailDialog";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type Notification = Tables<'notificacoes'>;

interface NotificationsSheetProps {
  userId: string | undefined;
  unreadCount: number;
}

const getTagIcon = (tag: string) => {
  switch (tag.toLowerCase()) {
    case 'promoção':
      return <Tag className="h-4 w-4 text-green-600" />;
    case 'sistema':
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    case 'pedido':
      return <Package className="h-4 w-4 text-primary" />;
    case 'aviso':
    default:
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  }
};

const NotificationsSheet = ({ userId, unreadCount }: NotificationsSheetProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const navigate = useNavigate();
  
  const { notifications, isLoading, markAsRead, markAllAsRead, refetch } = useNotifications(userId);

  useEffect(() => {
    if (isSheetOpen && userId) {
      // Força a busca de notificações sempre que o painel é aberto
      refetch(); 
    }
  }, [isSheetOpen, userId, refetch]);

  const handleOpenNotification = (notif: Notification) => {
    if (!userId) return; // Não deve acontecer se o botão de login for clicado

    setSelectedNotification(notif);
    setIsDialogOpen(true);
    if (!notif.lida) {
      markAsRead(notif.id);
    }
  };
  
  const handleMarkAllAsRead = () => {
    if (!userId) return;
    markAllAsRead();
  };

  const handleLoginClick = () => {
    setIsSheetOpen(false);
    navigate("/auth");
  };

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="bg-white text-primary hover:bg-white/90 rounded-full h-12 w-12 relative"
          >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex justify-between items-center">
              Notificações
              {userId && notifications.length > 0 && (
                <Button variant="link" size="sm" onClick={handleMarkAllAsRead} disabled={isLoading}>
                  Marcar todas como lidas
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="flex-1 pr-4">
            {!userId ? (
              <div className="text-center py-16 text-muted-foreground space-y-4">
                <LogIn className="h-16 w-16 text-muted-foreground mx-auto" />
                <p>Faça login ou cadastre-se para ver suas notificações.</p>
                <Button onClick={handleLoginClick}>
                  Entrar / Cadastrar
                </Button>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                Nenhuma notificação nova.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <Card 
                    key={notif.id} 
                    className={cn(
                      "p-4 flex gap-3 items-start transition-colors cursor-pointer",
                      !notif.lida ? "bg-primary/5 border-primary/20" : "bg-card"
                    )}
                    onClick={() => handleOpenNotification(notif)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getTagIcon(notif.tag)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {notif.tag}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notif.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm">{notif.titulo}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notif.conteudo}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
      
      <NotificationDetailDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        notification={selectedNotification} 
      />
    </>
  );
};

export default NotificationsSheet;