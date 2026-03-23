import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsAndConditionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsAndConditionsDialog = ({ open, onOpenChange }: TermsAndConditionsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Termos e Condições de Uso</DialogTitle>
          <DialogDescription>
            Leia atentamente os termos antes de prosseguir com o cadastro.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-4 border rounded-md">
          <div className="space-y-4 text-sm text-muted-foreground">
            <h3 className="font-bold text-foreground">1. Aceitação dos Termos</h3>
            <p>Ao se cadastrar na Construgaiver, você concorda integralmente com estes Termos e Condições de Uso, bem como com nossa Política de Privacidade. Caso não concorde, não utilize nossos serviços.</p>

            <h3 className="font-bold text-foreground">2. O Marketplace</h3>
            <p>A Construgaiver é uma plataforma de marketplace que conecta vendedores/locatários (usuários com o papel 'vendedor') a clientes (usuários com o papel 'cliente') para a compra e locação de materiais, equipamentos e serviços de construção civil. Não somos responsáveis pela qualidade, entrega ou legalidade dos produtos/serviços anunciados, sendo esta responsabilidade exclusiva do vendedor.</p>

            <h3 className="font-bold text-foreground">3. Cadastro e Contas</h3>
            <p>Você deve fornecer informações precisas e completas durante o processo de registro. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta.</p>

            <h3 className="font-bold text-foreground">4. Anúncios e Transações</h3>
            <p>Vendedores são responsáveis por garantir que seus anúncios sejam precisos, legais e não infrinjam direitos de terceiros. Todas as transações (compra, locação, pagamento e entrega/retirada) são negociadas e finalizadas diretamente entre o vendedor e o cliente, com a plataforma atuando apenas como intermediária.</p>

            <h3 className="font-bold text-foreground">5. Disposições Gerais</h3>
            <p>Reservamo-nos o direito de modificar estes Termos a qualquer momento. O uso continuado da plataforma após tais modificações constitui sua aceitação dos novos Termos.</p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAndConditionsDialog;