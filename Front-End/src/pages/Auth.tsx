import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      // Navigate to dashboard on success
      navigate("/dashboard");
    } catch (error) {
      // Error handling is done in AuthContext (toast)
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-hero" />
      
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <div className="glass-effect rounded-2xl p-8 space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center">
              <Music2 className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Wavelength
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isLogin ? "Entrando..." : "Criando conta..."}
                </>
              ) : (
                <>{isLogin ? "Entrar" : "Criar Conta"}</>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Não tem conta? Registre-se" : "Já tem conta? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
