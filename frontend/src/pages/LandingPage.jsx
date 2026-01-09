import { useNavigate } from "react-router-dom";
import { Database, TrendingUp, Brain, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="nav-glass sticky top-0 z-50" data-testid="landing-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Decisiv AI</h1>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                data-testid="nav-login-btn"
              >
                Entrar
              </Button>
              <Button 
                className="btn-primary"
                onClick={() => navigate('/auth')}
                data-testid="nav-register-btn"
              >
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7">
              <div className="uppercase text-xs tracking-widest text-blue-600 font-semibold mb-4">ARQUITETURA DE DECISÃO</div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-none tracking-tight mb-6">
                Decisões críticas não podem depender apenas de intuição.
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">
                A Decisiv AI transforma dados brutos em recomendações estratégicas acionáveis, 
                apoiando gestores a decidir com clareza em ambientes complexos.
              </p>
              <div className="flex gap-4">
                <Button 
                  className="btn-primary text-lg px-8 py-6"
                  onClick={() => navigate('/auth')}
                  data-testid="hero-cta-btn"
                >
                  Iniciar Teste Gratuito
                  <ArrowRight className="ml-2" size={20} />
                </Button>
                <Button 
                  variant="outline"
                  className="btn-secondary text-lg px-8 py-6"
                  data-testid="hero-demo-btn"
                >
                  Ver Demonstração
                </Button>
              </div>
            </div>
            <div className="md:col-span-5">
              <img 
                src="https://images.pexels.com/photos/8062280/pexels-photo-8062280.jpeg" 
                alt="Executive analyzing data" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Agentes - Tetris Grid */}
      <section className="py-24 px-4 bg-white" data-testid="agents-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="uppercase text-xs tracking-widest text-blue-600 font-semibold mb-4">4 AGENTES AUTÔNOMOS DE IA</div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">Ecossistema Data-to-Decision</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-marketing" data-testid="agent-card-connector">
              <Database className="text-blue-600 mb-4" size={40} strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Data Connector & ETL</h3>
              <p className="text-slate-600 leading-relaxed">
                Conecta-se automaticamente a bancos SQL, arquivos CSV e APIs. 
                Executa limpeza, padronização e criação de tabelas fato e dimensão com rastreabilidade total.
              </p>
            </div>

            <div className="card-marketing" data-testid="agent-card-analytics">
              <TrendingUp className="text-blue-600 mb-4" size={40} strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Analytics & BI Agent</h3>
              <p className="text-slate-600 leading-relaxed">
                Interpreta dados e cria automaticamente KPIs, indicadores comparativos, 
                cards, gráficos e dashboards interativos adaptados ao seu perfil.
              </p>
            </div>

            <div className="card-marketing" data-testid="agent-card-predictive">
              <Brain className="text-blue-600 mb-4" size={40} strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Predictive & Forecast</h3>
              <p className="text-slate-600 leading-relaxed">
                Executa modelos preditivos, identifica tendências e anomalias. 
                Gera cenários futuros (otimista, conservador, crítico) automaticamente.
              </p>
            </div>

            <div className="card-marketing" data-testid="agent-card-report">
              <FileText className="text-blue-600 mb-4" size={40} strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Decision Report Agent</h3>
              <p className="text-slate-600 leading-relaxed">
                Converte análises em relatórios executivos em linguagem natural. 
                Sugere decisões, emite alertas de risco e identifica oportunidades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-4 bg-slate-900 text-white" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">
            Pronto para decidir com clareza?
          </h2>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Não é uma apresentação de BI. É uma arquitetura de decisões.
          </p>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 shadow-lg hover:-translate-y-1 transition-all duration-300"
            onClick={() => navigate('/auth')}
            data-testid="final-cta-btn"
          >
            Começar Agora
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4" data-testid="footer">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">© 2025 Decisiv AI. Arquitetura de Decisão Orientada a Dados.</p>
        </div>
      </footer>
    </div>
  );
}