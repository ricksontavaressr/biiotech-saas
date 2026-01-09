from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import pandas as pd
import io
import json
from sklearn.linear_model import LinearRegression
import numpy as np
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# OpenAI Configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Decisiv AI API")
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    company_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_demo: bool = True

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    company_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user: User

class DataSource(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: str  # csv, sql, api
    status: str  # pending, processing, completed, error
    rows_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Metric(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    value: float
    change_percentage: float = 0.0
    period: str = "monthly"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PredictionScenario(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    metric_name: str
    optimistic: List[float]
    conservative: List[float]
    critical: List[float]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Report(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    summary: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChartData(BaseModel):
    labels: List[str]
    datasets: List[Dict[str, Any]]

# ============ UTILITIES ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    user_id = decode_jwt_token(token)
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user_id

async def generate_demo_data(user_id: str):
    """Gera dados demo brasileiros para novo usuário"""
    regions = ["Sul", "Sudeste", "Nordeste", "Norte", "Centro-Oeste"]
    months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    
    # Criar fonte de dados demo
    data_source = DataSource(
        user_id=user_id,
        name="Dados Demo - Vendas 2024",
        type="demo",
        status="completed",
        rows_count=60
    )
    doc = data_source.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.data_sources.insert_one(doc)
    
    # Criar métricas demo
    metrics_data = [
        {"name": "Receita Total", "value": 2450000, "change": 12.5},
        {"name": "Custos Operacionais", "value": 890000, "change": -8.3},
        {"name": "Produtividade", "value": 87.5, "change": 5.2},
        {"name": "Inadimplência", "value": 3.2, "change": -15.0}
    ]
    
    for m_data in metrics_data:
        metric = Metric(
            user_id=user_id,
            name=m_data["name"],
            value=m_data["value"],
            change_percentage=m_data["change"]
        )
        doc = metric.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.metrics.insert_one(doc)

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Verificar se usuário já existe
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Criar usuário
    user = User(
        email=user_data.email,
        company_name=user_data.company_name
    )
    
    # Hash da senha e salvar
    password_hash = hash_password(user_data.password)
    user_doc = user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    user_doc['password_hash'] = password_hash
    
    await db.users.insert_one(user_doc)
    
    # Gerar dados demo
    await generate_demo_data(user.id)
    
    # Gerar token
    token = create_jwt_token(user.id)
    
    return TokenResponse(token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Buscar usuário
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Verificar senha
    if not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Converter para User model
    user = User(**{k: v for k, v in user_doc.items() if k != 'password_hash'})
    
    # Gerar token
    token = create_jwt_token(user.id)
    
    return TokenResponse(token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return User(**user_doc)

# ============ AGENTE 1: DATA CONNECTOR ============

@api_router.post("/data/upload")
async def upload_data(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Criar registro de fonte de dados
        data_source = DataSource(
            user_id=user_id,
            name=file.filename,
            type="csv",
            status="completed",
            rows_count=len(df)
        )
        doc = data_source.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.data_sources.insert_one(doc)
        
        # Processar e criar métricas básicas
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if len(df[col].dropna()) > 0:
                metric = Metric(
                    user_id=user_id,
                    name=col,
                    value=float(df[col].mean()),
                    change_percentage=0.0
                )
                metric_doc = metric.model_dump()
                metric_doc['created_at'] = metric_doc['created_at'].isoformat()
                await db.metrics.insert_one(metric_doc)
        
        return {
            "message": "Dados processados com sucesso",
            "rows": len(df),
            "columns": list(df.columns),
            "data_source_id": data_source.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")

@api_router.get("/data/sources")
async def get_data_sources(user_id: str = Depends(get_current_user)):
    sources = await db.data_sources.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    for source in sources:
        if isinstance(source.get('created_at'), str):
            source['created_at'] = datetime.fromisoformat(source['created_at'])
    return sources

# ============ AGENTE 2: ANALYTICS & BI ============

@api_router.get("/analytics/overview")
async def get_analytics_overview(user_id: str = Depends(get_current_user)):
    metrics = await db.metrics.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    sources = await db.data_sources.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    return {
        "total_metrics": len(metrics),
        "total_sources": len(sources),
        "key_metrics": metrics[:4] if metrics else []
    }

@api_router.get("/analytics/metrics")
async def get_metrics(user_id: str = Depends(get_current_user)):
    metrics = await db.metrics.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    for metric in metrics:
        if isinstance(metric.get('created_at'), str):
            metric['created_at'] = datetime.fromisoformat(metric['created_at'])
    return metrics

@api_router.get("/analytics/charts")
async def get_chart_data(user_id: str = Depends(get_current_user)):
    # Dados demo para gráficos
    months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    revenue_data = [180000, 195000, 210000, 198000, 225000, 240000, 235000, 255000, 268000, 280000, 295000, 310000]
    cost_data = [85000, 88000, 92000, 87000, 95000, 98000, 96000, 102000, 105000, 108000, 112000, 115000]
    
    return {
        "revenue_chart": {
            "labels": months,
            "datasets": [
                {
                    "label": "Receita (R$)",
                    "data": revenue_data
                }
            ]
        },
        "cost_chart": {
            "labels": months,
            "datasets": [
                {
                    "label": "Custos (R$)",
                    "data": cost_data
                }
            ]
        }
    }

# ============ AGENTE 3: PREDICTIVE ============

@api_router.post("/predict/analyze")
async def analyze_predictions(user_id: str = Depends(get_current_user)):
    # Simular análise preditiva com dados demo
    months = list(range(1, 13))
    revenue = [180000, 195000, 210000, 198000, 225000, 240000, 235000, 255000, 268000, 280000, 295000, 310000]
    
    # Modelo simples de regressão linear
    X = np.array(months).reshape(-1, 1)
    y = np.array(revenue)
    model = LinearRegression()
    model.fit(X, y)
    
    # Prever próximos 6 meses
    future_months = np.array(range(13, 19)).reshape(-1, 1)
    predictions = model.predict(future_months)
    
    # Criar cenários
    optimistic = [p * 1.15 for p in predictions]  # +15%
    conservative = predictions.tolist()
    critical = [p * 0.85 for p in predictions]  # -15%
    
    scenario = PredictionScenario(
        user_id=user_id,
        metric_name="Receita Mensal",
        optimistic=optimistic,
        conservative=conservative,
        critical=critical
    )
    
    doc = scenario.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.predictions.insert_one(doc)
    
    return scenario

@api_router.get("/predict/scenarios")
async def get_scenarios(user_id: str = Depends(get_current_user)):
    scenarios = await db.predictions.find({"user_id": user_id}, {"_id": 0}).to_list(10)
    for scenario in scenarios:
        if isinstance(scenario.get('created_at'), str):
            scenario['created_at'] = datetime.fromisoformat(scenario['created_at'])
    return scenarios

# ============ AGENTE 4: DECISION REPORT ============

@api_router.post("/reports/generate")
async def generate_report(user_id: str = Depends(get_current_user)):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=400, detail="Chave OpenAI não configurada")
    
    # Buscar dados do usuário
    metrics = await db.metrics.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    # Preparar contexto para o LLM
    metrics_summary = "\n".join([f"- {m['name']}: R$ {m['value']:,.2f} (variação: {m['change_percentage']:+.1f}%)" 
                                   if m['value'] > 1000 else f"- {m['name']}: {m['value']:.1f}% (variação: {m['change_percentage']:+.1f}%)" 
                                   for m in metrics[:10]])
    
    prompt = f"""Você é um analista de negócios sênior. Analise os seguintes indicadores e gere um relatório executivo conciso em português brasileiro:

INDICADORES:
{metrics_summary}

Gere um relatório executivo com:
1. Resumo Executivo (2-3 linhas)
2. Principais Insights (3-4 pontos)
3. Recomendações Estratégicas (3-4 ações)

Seja objetivo e focado em decisões acionáveis."""
    
    try:
        # Usar emergentintegrations com OpenAI GPT-5.2
        chat = LlmChat(
            api_key=OPENAI_API_KEY,
            session_id=f"report_{user_id}_{datetime.now().timestamp()}",
            system_message="Você é um analista de negócios especializado em inteligência decisória."
        )
        chat.with_model("openai", "gpt-5.2")
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        # Extrair resumo (primeira linha)
        lines = response.strip().split('\n')
        summary = lines[0] if lines else "Relatório gerado"
        
        report = Report(
            user_id=user_id,
            title=f"Relatório Executivo - {datetime.now().strftime('%d/%m/%Y')}",
            content=response,
            summary=summary[:200]
        )
        
        doc = report.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.reports.insert_one(doc)
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar relatório: {str(e)}")

@api_router.get("/reports/list")
async def list_reports(user_id: str = Depends(get_current_user)):
    reports = await db.reports.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(20)
    for report in reports:
        if isinstance(report.get('created_at'), str):
            report['created_at'] = datetime.fromisoformat(report['created_at'])
    return reports

@api_router.get("/reports/{report_id}")
async def get_report(report_id: str, user_id: str = Depends(get_current_user)):
    report = await db.reports.find_one({"id": report_id, "user_id": user_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
    if isinstance(report.get('created_at'), str):
        report['created_at'] = datetime.fromisoformat(report['created_at'])
    return report

# ============ SETUP ============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()