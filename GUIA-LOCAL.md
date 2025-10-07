# 🚀 Como Rodar o WaveLength Localmente

Guia passo a passo para executar o projeto em sua máquina.

---

## 📋 Pré-requisitos

- **Python 3.8+** (recomendado: 3.10 ou 3.11)
- **Node.js 18+** e npm
- **Git**
- **8GB+ RAM** (para modelos BLIP e MusicGen)
- **GPU CUDA** (opcional, mas recomendado para melhor performance)

---

## 🔧 Instalação

### 1️⃣ Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd WaveLength
```

---

## 🐍 Backend (Python + FastAPI)

### Passo 1: Criar Ambiente Virtual

**Windows:**
```bash
cd Back-End
python -m venv venv
.\venv\Scripts\activate
```

**Linux/Mac:**
```bash
cd Back-End
python3 -m venv venv
source venv/bin/activate
```

### Passo 2: Instalar Dependências

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

> ⏱️ **Tempo estimado:** 5-10 minutos (depende da conexão e se possui PyTorch instalado)

### Passo 3: Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite `.env` se necessário (configuração padrão funciona para testes locais).

### Passo 4: Iniciar o Servidor

```bash
uvicorn src.main:app --reload
```

✅ **Backend rodando em:** http://localhost:8000
✅ **Documentação da API:** http://localhost:8000/docs

### Verificar Saúde da API

```bash
curl http://localhost:8000/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "device": "cpu",
  "models_loaded": true
}
```

---

## ⚛️ Frontend (React + TypeScript)

**Abra um novo terminal** (mantenha o backend rodando no anterior).

### Passo 1: Instalar Dependências

```bash
cd Front-End
npm install
```

> ⏱️ **Tempo estimado:** 2-5 minutos

### Passo 2: Configurar Variáveis de Ambiente

Crie o arquivo `.env` (se necessário):

```bash
VITE_API_URL=http://localhost:8000
```

> **Nota:** O frontend usa `http://localhost:8000` por padrão, então este arquivo é opcional para desenvolvimento local.

### Passo 3: Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

✅ **Frontend rodando em:** http://localhost:5173

---

## 🎵 Usando a Aplicação

1. Abra http://localhost:5173 no navegador
2. Clique em **"Criar Música"** ou acesse `/create`
3. Faça upload de uma imagem (JPEG, PNG)
4. Clique em **"Gerar Música"**
5. Aguarde o processamento (30-60 segundos)
6. Ouça a música gerada no player!

---

## 🧪 Executar Testes

### Testes Backend (Pytest)

```bash
cd Back-End
pytest tests/ -v
```

**Com cobertura:**
```bash
pytest tests/ -v --cov=src --cov-report=term
```

✅ **Esperado:** 61 testes passando (89% de cobertura)

### Testes Frontend (Vitest)

```bash
cd Front-End
npm test
```

**Com interface visual:**
```bash
npm run test:ui
```

**Com cobertura:**
```bash
npm run test:coverage
```

✅ **Esperado:** 19 testes passando

### Testes E2E (Playwright)

**Primeira vez - instalar browsers:**
```bash
cd Front-End
npm install -D @playwright/test
npx playwright install chromium
```

**Rodar testes:**
```bash
# Headless (sem interface)
npm run e2e

# Com navegador visível
npm run e2e:headed

# Interface visual interativa
npm run e2e:ui

# Debug mode
npm run e2e:debug
```

✅ **Esperado:** Todos os testes E2E passando

---

## 🔧 Troubleshooting

### ❌ Erro: `ModuleNotFoundError: No module named 'torch'`

**Solução:**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### ❌ Erro: `CUDA out of memory`

**Solução:** Seu sistema não tem GPU ou tem pouca VRAM. O modelo automaticamente usa CPU.

Para forçar uso de CPU:
```python
# No arquivo Back-End/src/config.py, defina:
DEVICE = "cpu"
```

### ❌ Frontend não conecta no Backend

**Verifique:**
1. Backend está rodando em `http://localhost:8000`
2. Teste: `curl http://localhost:8000/health`
3. Verifique CORS no arquivo `Back-End/src/main.py`

### ❌ Porta 8000 ou 5173 já está em uso

**Backend (porta 8000):**
```bash
uvicorn src.main:app --reload --port 8001
```

**Frontend (porta 5173):**
```bash
npm run dev -- --port 5174
```

E atualize `VITE_API_URL` no frontend se mudar a porta do backend.

### ❌ Modelos BLIP/MusicGen não carregam

**Causa:** Primeira execução baixa ~2GB de modelos do HuggingFace.

**Solução:** Aguarde o download ou configure cache:
```bash
export HF_HOME=/caminho/para/cache
```

### ❌ Erro `npm ERR! network`

**Solução:** Problema de conexão. Tente:
```bash
npm cache clean --force
npm install --verbose
```

---

## 📦 Scripts Auxiliares

O projeto inclui scripts Python úteis:

### `scripts/dev.py` - Rodar Backend + Frontend Simultaneamente

```bash
python scripts/dev.py
```

### `scripts/test.py` - Rodar Todos os Testes

```bash
python scripts/test.py
```

---

## 🎯 Performance Tips

### 🚀 Para Desenvolvimento Mais Rápido:

1. **Use GPU** se disponível (10x mais rápido)
2. **Reduza duração** da música gerada (padrão: 8s)
3. **Use modo mock** descomentando no código

### 💾 Para Economizar Memória:

1. Use `musicgen-small` (padrão) ao invés de `medium/large`
2. Feche outros programas pesados
3. Configure `MAX_WORKERS=1` no `.env`

---

## 🌐 Próximos Passos

Agora que está rodando localmente, veja:
- **[GUIA-DEPLOY.md](./GUIA-DEPLOY.md)** - Como fazer deploy online
- **[README.md](./README.md)** - Documentação completa do projeto
- **[Instrucoes e Doc.mD](./Instrucoes%20e%20Doc.mD)** - Arquitetura técnica detalhada

---

## 📞 Suporte

**Problemas comuns?** Verifique:
1. Versões de Python/Node.js compatíveis
2. Todas as dependências instaladas
3. Backend rodando antes do frontend
4. Firewall/antivírus não bloqueando portas 8000 e 5173

**Ainda com problemas?** Abra uma issue no GitHub com:
- Sistema operacional
- Versões de Python e Node.js
- Log completo do erro
