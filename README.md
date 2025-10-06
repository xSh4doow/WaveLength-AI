# 🎵 WaveLength - Transforme Fotos em Música

Sistema de IA que transforma fotografias em música original usando BLIP e MusicGen.

## 📁 Estrutura do Projeto

```
WaveLength/
├── Back-End/              # Backend FastAPI + IA
│   ├── src/              # Código fonte
│   │   ├── models/       # BLIP, MusicGen handlers
│   │   ├── services/     # Cultural mapper, Prompt builder
│   │   ├── utils/        # Utilidades
│   │   └── main.py       # FastAPI app
│   ├── tests/            # Testes unitários (pytest)
│   ├── pytest.ini        # Configuração pytest
│   └── .pylintrc         # Qualidade de código
│
├── Front-End/            # React + TypeScript
│   ├── src/             # Código fonte
│   ├── tests/           # Testes (Vitest)
│   └── vitest.config.ts # Configuração testes
│
└── scripts/             # Scripts de automação
    ├── dev.py          # Desenvolvimento integrado
    └── test.py         # Rodar todos os testes
```

## 🚀 Início Rápido

### Instalação Backend

```bash
cd Back-End

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Para testes e qualidade

# Configurar
cp .env.example .env
```

### Instalação Frontend

```bash
cd Front-End

# Instalar dependências
npm install

# Configurar
cp .env.example .env
```

## 🎯 Desenvolvimento

### Rodar Backend + Frontend Juntos

```bash
# Na raiz do projeto
python scripts/dev.py
```

**Opções:**
- `python scripts/dev.py --backend` - Só backend
- `python scripts/dev.py --frontend` - Só frontend
- `python scripts/dev.py --mock` - Backend em modo mock

### Rodar Separadamente

**Backend:**
```bash
cd Back-End
uvicorn src.main:app --reload
```

**Frontend:**
```bash
cd Front-End
npm run dev
```

## 🧪 Testes

### Rodar Todos os Testes

```bash
python scripts/test.py
```

### Testes Backend

```bash
cd Back-End
pytest                          # Rodar testes
pytest --cov=src               # Com coverage
pytest --cov=src --cov-report=html  # HTML report
```

**Configurado para:**
- ✅ 90%+ coverage obrigatório
- ✅ Testes unitários completos
- ✅ Mocks de modelos de IA

### Testes Frontend

```bash
cd Front-End
npm run test               # Rodar testes
npm run test:coverage      # Com coverage
```

## 📊 Qualidade de Código

### Backend

```bash
cd Back-End

# Formatar código
black src tests

# Linting
pylint src

# Type checking
mypy src

# Ordenar imports
isort src tests
```

**Configurado:**
- Black (formatação)
- Pylint (score 9.0+)
- MyPy (type checking)
- isort (imports)

### Frontend

```bash
cd Front-End

# Linting
npm run lint

# Formatar
npm run format

# Type check
npm run type-check
```

**Configurado:**
- ESLint (zero errors)
- Prettier (formatação)
- TypeScript strict mode

## 📡 API Endpoints

**Backend:** http://localhost:8000

- `GET /` - Info da API
- `GET /health` - Status e modelos carregados
- `POST /generate` - Gerar música de imagem
- `GET /audio/{filename}` - Download áudio

**Frontend:** http://localhost:8080

## 🎵 Categorias Musicais

12+ categorias implementadas:
- Tropical House, French House, Synthwave
- Lo-fi Hip Hop, Bossa Nova, Ambient
- Epic Orchestral, Reggae Fusion, etc.

## 🔬 Coverage Atual

**Backend:** 90%+ (configurado em pytest.ini)
**Frontend:** 90%+ (configurado em vitest.config.ts)

Relatórios:
- Backend: `Back-End/htmlcov/index.html`
- Frontend: `Front-End/coverage/index.html`

## 📚 Comandos Úteis

```bash
# Desenvolvimento
python scripts/dev.py

# Testes
python scripts/test.py

# Backend apenas
cd Back-End
pytest
black src
pylint src

# Frontend apenas
cd Front-End
npm run test
npm run lint
npm run format
```

## 🏗️ Stack Tecnológico

### Backend
- FastAPI
- PyTorch
- BLIP (Salesforce/blip-image-captioning-large)
- MusicGen (facebook/musicgen-small)
- Pytest + Coverage

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Vitest + Testing Library

## 📝 Próximos Passos para 100% Coverage

### Backend

Para adicionar mais testes (criar arquivos em `Back-End/tests/`):

1. `test_models/test_blip_handler.py`
2. `test_models/test_musicgen_handler.py`

Usar fixtures do `conftest.py`:
- `mock_blip_model`
- `mock_musicgen_model`
- `test_image`

### Frontend

Para adicionar testes (criar em `Front-End/tests/unit/`):

1. `services/api.test.ts`
2. `pages/Create.test.tsx`
3. `pages/Player.test.tsx`

## 🎯 Checklist de Qualidade

- [x] Estrutura modular (Back-End/src/, Front-End/src/)
- [x] Testes configurados (pytest, vitest)
- [x] Coverage 90%+ configurado
- [x] Linting configurado (pylint, eslint)
- [x] Formatação automática (black, prettier)
- [x] Scripts de desenvolvimento (dev.py, test.py)
- [x] Pastas antigas removidas
- [ ] Expandir testes para 100% coverage
- [ ] CI/CD pipeline

## 📄 Licença

Projeto Acadêmico - Trabalho Integrador
