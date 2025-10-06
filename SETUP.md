# 🚀 Guia de Setup Rápido - WaveLength

## Pré-requisitos

- Python 3.10+
- Node.js 18+
- GPU recomendada (8GB+ VRAM) ou CPU (mais lento)

## Setup Backend

```bash
# 1. Navegar para o backend
cd wavelength-backend

# 2. Criar ambiente virtual
python -m venv venv

# 3. Ativar ambiente
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Instalar dependências
pip install -r requirements.txt

# 5. Configurar variáveis de ambiente
cp .env.example .env

# 6. Executar backend
python main.py
```

Backend rodando em: **http://localhost:8000**

## Setup Frontend

```bash
# 1. Navegar para o frontend
cd "adicoes Breno e Front/front-end"

# 2. Instalar dependências
npm install

# 3. Configurar API URL
cp .env.example .env

# 4. Executar frontend
npm run dev
```

Frontend rodando em: **http://localhost:8080**

## Verificação

### 1. Testar Backend
```bash
# Em um terminal
curl http://localhost:8000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "ai_ready": true,
  "device": "cuda",
  "models_loaded": {
    "blip": true,
    "musicgen": true
  }
}
```

### 2. Testar Frontend
1. Abrir http://localhost:8080
2. Navegar para /create
3. Upload de uma imagem
4. Clicar "Gerar Música"
5. Aguardar geração (15-30s)
6. Player deve tocar o áudio

## Modo Mock (Desenvolvimento Sem GPU)

Se você não tem GPU disponível, use o modo mock:

### Backend modo mock automático
O backend automaticamente usa modo mock se a IA não estiver disponível.

### Forçar modo mock
```bash
curl -X POST http://localhost:8000/generate \
  -F "image=@foto.jpg" \
  -F "duration=15" \
  -F "engine=mock"
```

## Troubleshooting

### Backend não carrega modelos
**Erro:** `Failed to initialize AI handlers`

**Solução:**
1. Verificar se torch está instalado: `pip install torch`
2. Verificar memória disponível (mínimo 8GB RAM)
3. Usar modo mock para desenvolvimento

### Frontend não conecta ao backend
**Erro:** `Failed to fetch`

**Solução:**
1. Verificar se backend está rodando: `http://localhost:8000/health`
2. Verificar variável de ambiente no `.env`:
   ```
   VITE_API_URL=http://localhost:8000
   ```
3. Verificar CORS no backend (já configurado para aceitar todas origens)

### Erro de CORS
**Erro:** `CORS policy blocked`

**Solução:**
Backend já está configurado com:
```python
allow_origins=["*"]
```

Se o problema persistir, reinicie o backend.

### Modelos não baixam
**Erro:** `Connection timeout`

**Solução:**
1. Verificar conexão com internet
2. Aguardar download (BLIP ~1.8GB + MusicGen ~1.5GB)
3. Modelos são armazenados em cache: `~/.cache/huggingface/`

## Próximos Passos

1. ✅ Backend rodando
2. ✅ Frontend rodando
3. ✅ Teste de geração de música
4. 📝 Explorar categorias musicais
5. 🎨 Testar diferentes tipos de imagens

## Estrutura de Pastas Esperada

```
WaveLength/
├── wavelength-backend/          ✅ Backend modular
│   ├── models/
│   ├── services/
│   ├── utils/
│   ├── out/                     (criado automaticamente)
│   ├── main.py
│   └── requirements.txt
│
├── adicoes Breno e Front/
│   └── front-end/               ✅ Frontend React
│       ├── src/
│       ├── package.json
│       └── .env
│
└── README.md                    ✅ Documentação principal
```

## Comandos Úteis

### Backend
```bash
# Verificar saúde
curl http://localhost:8000/health

# Gerar música (via curl)
curl -X POST http://localhost:8000/generate \
  -F "image=@foto.jpg" \
  -F "duration=15"

# Ver logs
python main.py  # Logs aparecem no terminal
```

### Frontend
```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview de produção
npm run preview
```

## Suporte

- 📖 [README Principal](./README.md)
- 📚 [Documentação Backend](./wavelength-backend/README.md)
- 📋 [Documentação Completa](./Instrucoes%20e%20Doc.mD)
