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
  const [diaNasc, setDiaNasc] = useState("");
  const [mesNasc, setMesNasc] = useState("");
  const [anoNasc, setAnoNasc] = useState("");
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
        
        const dataNascimento = anoNasc && mesNasc && diaNasc
          ? `${anoNasc}-${mesNasc}-${diaNasc}`
          : "";
        // Cadastro com confirmação de e-mail
        const { data, error } = await supabase.auth.signUp({
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

        // Com a confirmação de e-mail ativada, o Supabase não retorna erro para
        // e-mails existentes: ele devolve um usuário sem identidades para evitar
        // enumeração de contas. Não devemos tratar isso como um novo cadastro.
        if (!data.user || data.user.identities?.length === 0) {
          toast.error("Este e-mail já está cadastrado. Faça login ou recupere sua senha.");
          return;
        }
        
        localStorage.setItem("pendingConfirmationEmail", email);
        toast.success("Enviamos um código de confirmação para o seu e-mail.");
        navigate("/confirmar-email", { state: { email } });
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
                <Label>Data de nascimento*</Label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Dia */}
                  <select
                    value={diaNasc}
                    onChange={(e) => setDiaNasc(e.target.value)}
                    required={!isLogin}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Dia</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                        {i + 1}
                      </option>
                    ))}
                  </select>

                  {/* Mês */}
                  <select
                    value={mesNasc}
                    onChange={(e) => setMesNasc(e.target.value)}
                    required={!isLogin}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Mês</option>
                    {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                        {m}
                      </option>
                    ))}
                  </select>

                  {/* Ano */}
                  <select
                    value={anoNasc}
                    onChange={(e) => setAnoNasc(e.target.value)}
                    required={!isLogin}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Ano</option>
                    {Array.from({ length: 91 }, (_, i) => {
                      const year = 2010 - i;
                      return (
                        <option key={year} value={String(year)}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
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
