import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import TermsAndConditionsDialog from "@/components/TermsAndConditionsDialog";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState(""); // Renomeado de telefoneMovel
  const [dataNascimento, setDataNascimento] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<"cliente" | "vendedor">("cliente");
  const [aceitoTermos, setAceitoTermos] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate("/home");
      } else {
        if (!aceitoTermos) {
          toast.error("Você precisa aceitar os termos e condições");
          setLoading(false);
          return;
        }
        
        // Cadastro com confirmação de e-mail
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              nome,
              // Usando 'telefone_movel' no backend, mas 'telefone' no frontend
              telefone_movel: telefone, 
              data_nascimento: dataNascimento,
              aceito_termos: aceitoTermos,
              role: tipoUsuario
            },
            // Removendo emailRedirectTo para que o usuário precise confirmar o e-mail
          },
        });
        
        if (error) throw error;
        
        // Mensagem para o usuário verificar o e-mail
        toast.success("Cadastro realizado! Verifique seu e-mail para confirmar sua conta e fazer login.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-background">
        <div className="text-center space-y-2">
          <div className="inline-block p-2 rounded-lg bg-primary shadow-lg">
            <img src={logo} alt="Construgaiver" className="h-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold">
            {isLogin ? "Entrar" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin
              ? "Entre com suas credenciais"
              : "Preencha os dados para criar sua conta"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome*</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required={!isLogin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone*</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required={!isLogin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de nascimento*</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  required={!isLogin}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de conta*</Label>
                <RadioGroup value={tipoUsuario} onValueChange={(value: any) => setTipoUsuario(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cliente" id="cliente" />
                    <Label htmlFor="cliente" className="font-normal cursor-pointer">
                      Cliente - Apenas compras
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vendedor" id="vendedor" />
                    <Label htmlFor="vendedor" className="font-normal cursor-pointer">
                      Vendedor/Locatário - Anunciar produtos
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-mail*</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha*</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="termos"
                checked={aceitoTermos}
                onCheckedChange={(checked) => setAceitoTermos(checked as boolean)}
                required={!isLogin}
              />
              <Label htmlFor="termos" className="text-sm font-normal">
                Aceito os{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTerms(true);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  termos e condições
                </button>{" "}
                e políticas*
              </Label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin
              ? "Não tem conta? Cadastre-se"
              : "Já tem conta? Faça login"}
          </button>
        </div>
      </Card>
      
      <TermsAndConditionsDialog open={showTerms} onOpenChange={setShowTerms} />
    </div>
  );
};

export default Auth;