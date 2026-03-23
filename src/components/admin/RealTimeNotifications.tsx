import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell } from "lucide-react";

const RealTimeNotifications = () => {
  useEffect(() => {
    const channel = supabase
      .channel('public:notificacoes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        (payload) => {
          console.log('Nova notificação recebida:', payload.new);
          const newNotification = payload.new as { titulo: string; conteudo: string, usuario_id: string | null };
          
          const message = newNotification.usuario_id
            ? `Notificação enviada para um usuário específico.`
            : `Notificação global enviada para todos os usuários.`;

          toast.success(newNotification.titulo, {
            description: message,
            icon: <Bell className="h-4 w-4" />,
          });
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // This component does not render anything
};

export default RealTimeNotifications;