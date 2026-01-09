import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function AuthPage({ setIsAuthenticated }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    company_name: ""
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`${API}${endpoint}`, payload);
      
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      toast.success(isLogin ? "Login realizado com sucesso!" : "Conta criada com sucesso!");
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-8"
            data-testid="back-to-home-btn"
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
              {isLogin ? "Bem-vindo de volta" : "Criar conta"}
            </h1>
            <p className="text-slate-600">
              {isLogin ? "Acesse sua plataforma de inteligência decisória" : "Comece a tomar decisões baseadas em dados"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="auth-form">
            {!isLogin && (
              <div>
                <Label htmlFor="company_name" data-testid="company-label">Nome da Empresa</Label>
                <Input
                  id="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required={!isLogin}
                  className="mt-2"
                  data-testid="company-input"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" data-testid="email-label">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-2"
                data-testid="email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" data-testid="password-label">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="mt-2"
                data-testid="password-input"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full btn-primary"
              disabled={loading}
              data-testid="auth-submit-btn"
            >
              {loading ? "Processando..." : (isLogin ? "Entrar" : "Criar Conta")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-700 font-medium"
              data-testid="toggle-auth-mode-btn"
            >
              {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Fazer login"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-slate-900 items-center justify-center p-12">
        <div className="text-center text-white max-w-lg">
          <h2 className="text-4xl font-extrabold mb-6 tracking-tight">
            Decisões críticas exigem clareza
          </h2>
          <p className="text-xl text-slate-300 leading-relaxed">
            Transforme dados em inteligência decisória com 4 agentes autônomos de IA.
          </p>
        </div>
      </div>
    </div>
  );
}