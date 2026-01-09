import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Upload, Database, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function DataConnector() {
  const [sources, setSources] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await axios.get(`${API}/data/sources`);
      setSources(response.data);
    } catch (error) {
      toast.error("Erro ao carregar fontes de dados");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Apenas arquivos CSV são aceitos");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/data/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Arquivo processado: ${response.data.rows} linhas`);
      fetchSources();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao processar arquivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="data-connector-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Data Connector & ETL</h1>
        <p className="text-lg text-slate-600">Conecte e processe suas fontes de dados</p>
      </div>

      {/* Upload Section */}
      <div className="card-dashboard" data-testid="upload-section">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
            <Upload className="text-blue-600" size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Carregar Dados</h3>
          <p className="text-slate-600 mb-6">Faça upload de arquivos CSV para análise automática</p>
          
          <label htmlFor="file-upload">
            <Button 
              className="btn-primary cursor-pointer"
              disabled={uploading}
              data-testid="upload-btn"
              onClick={() => document.getElementById('file-upload').click()}
            >
              {uploading ? "Processando..." : "Selecionar Arquivo CSV"}
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="file-input"
            />
          </label>
        </div>
      </div>

      {/* Sources List */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Fontes de Dados</h2>
        {loading ? (
          <div className="text-center py-8" data-testid="sources-loading">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : sources.length === 0 ? (
          <div className="card-dashboard text-center py-12" data-testid="no-sources">
            <Database className="mx-auto text-slate-400 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-slate-600">Nenhuma fonte de dados ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((source, index) => (
              <div key={source.id} className="card-dashboard flex items-center justify-between" data-testid={`source-card-${index}`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Database className="text-blue-600" size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{source.name}</p>
                    <p className="text-sm text-slate-600">
                      {source.rows_count} linhas • {source.type.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {source.status === 'completed' ? (
                    <>
                      <CheckCircle className="text-emerald-600" size={20} />
                      <span className="text-sm font-medium text-emerald-600">Processado</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="text-amber-600" size={20} />
                      <span className="text-sm font-medium text-amber-600">Processando</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}