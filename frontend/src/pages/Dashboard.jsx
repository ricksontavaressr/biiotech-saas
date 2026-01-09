import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../App";
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await axios.get(`${API}/analytics/overview`);
      setOverview(response.data);
    } catch (error) {
      toast.error("Erro ao carregar visão geral");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="dashboard-loading">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const metrics = overview?.key_metrics || [];

  const getMetricIcon = (name) => {
    if (name.includes('Receita')) return DollarSign;
    if (name.includes('Produtividade')) return TrendingUp;
    if (name.includes('Inadimpl')) return AlertCircle;
    return CheckCircle;
  };

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Visão Geral</h1>
        <p className="text-lg text-slate-600">Painel executivo de inteligência decisória</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-dashboard" data-testid="total-metrics-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total de Métricas</p>
              <p className="text-3xl font-bold text-slate-900">{overview?.total_metrics || 0}</p>
            </div>
            <TrendingUp className="text-blue-600" size={32} strokeWidth={1.5} />
          </div>
        </div>

        <div className="card-dashboard" data-testid="total-sources-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Fontes de Dados</p>
              <p className="text-3xl font-bold text-slate-900">{overview?.total_sources || 0}</p>
            </div>
            <CheckCircle className="text-emerald-600" size={32} strokeWidth={1.5} />
          </div>
        </div>

        <div className="card-dashboard" data-testid="agents-active-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Agentes Ativos</p>
              <p className="text-3xl font-bold text-slate-900">4</p>
            </div>
            <Users className="text-blue-600" size={32} strokeWidth={1.5} />
          </div>
        </div>

        <div className="card-dashboard" data-testid="status-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Status</p>
              <p className="text-lg font-semibold text-emerald-600">Operacional</p>
            </div>
            <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Indicadores Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.map((metric, index) => {
              const Icon = getMetricIcon(metric.name);
              const isPositive = metric.change_percentage > 0;
              const isNegativeMetric = metric.name.includes('Custo') || metric.name.includes('Inadimpl');
              const trendColor = isNegativeMetric 
                ? (isPositive ? 'text-rose-600' : 'text-emerald-600')
                : (isPositive ? 'text-emerald-600' : 'text-rose-600');

              return (
                <div key={index} className="card-dashboard" data-testid={`metric-card-${index}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Icon className="text-blue-600" size={24} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">{metric.name}</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {metric.value > 1000 ? `R$ ${(metric.value / 1000).toFixed(0)}k` : `${metric.value.toFixed(1)}%`}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 ${trendColor} text-sm font-semibold`}>
                      {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {Math.abs(metric.change_percentage).toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Variação mensal</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card-dashboard" data-testid="quick-actions">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left" data-testid="quick-action-upload">
            <p className="font-semibold text-slate-900">Carregar Dados</p>
            <p className="text-sm text-slate-600 mt-1">Importar CSV ou conectar API</p>
          </button>
          <button className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left" data-testid="quick-action-analytics">
            <p className="font-semibold text-slate-900">Ver Analytics</p>
            <p className="text-sm text-slate-600 mt-1">Dashboards e KPIs</p>
          </button>
          <button className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left" data-testid="quick-action-predict">
            <p className="font-semibold text-slate-900">Gerar Previsões</p>
            <p className="text-sm text-slate-600 mt-1">Modelos preditivos</p>
          </button>
          <button className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left" data-testid="quick-action-report">
            <p className="font-semibold text-slate-900">Novo Relatório</p>
            <p className="text-sm text-slate-600 mt-1">Insights executivos</p>
          </button>
        </div>
      </div>
    </div>
  );
}