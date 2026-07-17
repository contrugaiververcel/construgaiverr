import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, Tag, AlertTriangle, CheckCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Notification = Tables<'notificacoes'>;

interface NotificationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: Notification | null;
}

const getTagIcon = (tag: string) => {
  switch (tag.toLowerCase()) {
    case 'promoção':
      return <Tag className="h-5 w-5 text-green-600" />;
    case 'sistema':
      return <CheckCircle className="h-5 w-5 text-blue-600" />;
    case 'pedido':
      return <Package className="h-5 w-5 text-primary" />;
    case 'aviso':
    default:
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  }
};

const NotificationDetailDialog = ({ open, onOpenChange, notification }: NotificationDetailDialogProps) => {
  if (!notification) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getTagIcon(notification.tag)}
            <DialogTitle>{notification.titulo}</DialogTitle>
          </div>
          <DialogDescription>
            Detalhes da notificação enviada em {new Date(notification.criado_em).toLocaleDateString('pt-BR')}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <Badge variant="secondary" className="capitalize">
            {notification.tag}
          </Badge>
          <p className="text-base whitespace-pre-wrap">{notification.conteudo}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDetailDialog;