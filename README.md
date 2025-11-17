# 🎵 WaveLength

<div align="center">

**Transforme fotografias em música original usando Inteligência Artificial**

[**Começar**](#-quick-start) • [**Documentação**](#-documentação) • [**Roadmap**](#-roadmap) • [**Demo**](https://wave-length-ai.vercel.app)

---

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116+-009688?logo=fastapi&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-80%20passed-success?logo=pytest)
![Coverage](https://img.shields.io/badge/Coverage-89%25-success?logo=codecov)
![Status](https://img.shields.io/badge/Status-Live-success)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## ✨ Sobre o Projeto

**WaveLength** é um sistema inteligente que analisa fotografias e cria composições musicais originais inspiradas nas imagens. Usando modelos de IA avançados, o projeto transforma elementos visuais (praias, cidades, florestas, montanhas) em música personalizada com letras ou instrumental.

### 🎯 Como Funciona

```
📸 Imagem → 🤖 Análise BLIP → 🎨 Mapeamento Cultural → 🎼 Análise de Sentimento → 🎵 Geração Suno API V4
```

1. **Você faz upload** de uma foto (praia, cidade, floresta, etc.)
2. **BLIP analisa** a imagem e gera uma descrição textual (em desenvolvimento local)
3. **Sistema mapeia** para uma de 12 categorias culturais
4. **IA gera letras** baseadas na imagem e analisa o sentimento
5. **Suno API V4 cria** uma composição musical original (15-240 segundos)
6. **Você escuta** a música gerada no player integrado

---

## 🚀 Quick Start

### Pré-requisitos

- **Python 3.11+**
- **Node.js 18+** e npm
- **8GB+ RAM** (para rodar os modelos de IA localmente)
- **Suno API Key** (para geração de música em produção)

### Instalação Rápida (3 comandos)

#### 1️⃣ Backend

```bash
cd Back-End
python -m venv venv && .\venv\Scripts\activate
pip install -r requirements.txt && uvicorn src.main:app --reload
```

✅ Backend rodando em: **http://localhost:8000**

#### 2️⃣ Frontend (novo terminal)

```bash
cd Front-End
npm install && npm run dev
```

✅ Frontend rodando em: **http://localhost:5173**

#### 3️⃣ Usar

Acesse **http://localhost:5173** → Crie sua música! 🎵

---

## 🌍 Deploy em Produção

### ✅ Backend (Render.com)

**Status**: Live em produção
- URL: `https://wavelength-ai.onrender.com`
- Database: PostgreSQL automático
- Region: Oregon (US West)

**Setup:**
```bash
# O projeto usa render.yaml para configuração automática
1. Push para GitHub
2. Render.com → New Blueprint
3. Selecionar repositório
4. Adicionar SUNO_API_KEY nas variáveis de ambiente
```

### ✅ Frontend (Vercel)

**Status**: Live em produção
- URL: [https://wave-length-ai.vercel.app](https://wave-length-ai.vercel.app)

**Setup:**
```bash
# O projeto usa vercel.json para configuração
1. Vercel → Import Project
2. Framework: Vite
3. Root Directory: Front-End
4. Adicionar variável: VITE_API_URL
```

---

## 🔐 Variáveis de Ambiente

### Backend (.env)

```env
# Servidor
PORT=8000
DEVICE=cpu

# BLIP (Análise de Imagem)
USE_BLIP=false                                    # Desabilitado em produção para economizar memória
BLIP_MODEL=Salesforce/blip-image-captioning-large

# Suno API (Geração de Música)
USE_SUNO=true
SUNO_API_KEY=your_api_key_here                    # Obtenha em https://sunoapi.org
SUNO_API_URL=https://api.sunoapi.org
SUNO_MODEL=V4

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db  # Auto-configurado no Render

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000  # ou https://wavelength-ai.onrender.com em produção
```

---

## 📸 Como Usar

### Passo 1: Acessar a Interface

Abra o navegador e acesse `http://localhost:8080` ou [wave-length-ai.vercel.app](https://wave-length-ai.vercel.app)

### Passo 2: Criar Conta (ou Login)

- Clique em **"Entrar"** no topo
- Registre-se com email e senha
- Faça login

### Passo 3: Criar Música

- Clique em **"Criar Música"** ou acesse `/create`
- Faça upload de uma imagem (JPEG, PNG)
- Escolha:
  - Nome da música
  - Gênero musical (opcional)
  - Duração (15-240 segundos)
  - Instrumental ou com vocal
  - Gerar letras automaticamente (opcional)

### Passo 4: Gerar e Escutar

- Clique em **"Gerar Música"**
- Aguarde 30-90 segundos (IA processando!)
- Player abre automaticamente com sua música

### Passo 5: Organizar em Playlists

- Crie playlists personalizadas
- Adicione músicas às playlists
- Compartilhe playlists (públicas/privadas)
- Ouça todas as músicas de uma playlist

---

## 🎨 Categorias Musicais

O sistema reconhece **12 categorias** e cria músicas específicas para cada uma:

| Categoria | Descrição | Estilo Musical |
|-----------|-----------|----------------|
| 🏖️ **Beach/Coast** | Praias, oceano, costa | Tropical, breezy, calmo |
| 🏙️ **City/Urban** | Cidades, ruas, urbano | Eletrônico, moderno, energético |
| 🌲 **Forest/Woods** | Florestas, natureza | Orgânico, acústico, sereno |
| ⛰️ **Mountain** | Montanhas, paisagens | Épico, expansivo, majestoso |
| 🏜️ **Desert** | Desertos, árido | Étnico, minimalista, místico |
| 🌧️ **Rain/Storm** | Chuva, tempestade | Melancólico, introspectivo |
| 🌃 **Night/Evening** | Noite, entardecer | Jazz, lounge, suave |
| ☕ **Café/Indoor** | Cafés, interiores | Bossa nova, acústico, relaxante |
| 🏛️ **Skyline** | Arranha-céus, arquitetura | Sinfônico, grandioso |
| 🌴 **Tropical** | Trópico, exótico | Reggae, latino, vibrante |
| ❄️ **Snow/Winter** | Neve, inverno | Cristalino, frio, etéreo |
| 🎵 **Default** | Qualquer outra | Ambiente, neutro, genérico |

---

## 🎵 Features Principais

### ✅ Geração de Música com IA
- **Suno API V4**: Composições profissionais de 15-240 segundos
- **Custom Mode**: Controle total sobre estilo, título e letras
- **Análise de Sentimento**: Ajusta mood da música baseado nas letras
- **2-Step Generation**: Gera letras primeiro, depois a música
- **Limite de 200 caracteres** para letras (otimizado para qualidade)

### ✅ Sistema de Playlists
- Crie playlists personalizadas
- Adicione/remova músicas facilmente
- Playlists públicas (visíveis para amigos) ou privadas
- Toque toda a playlist de uma vez
- Edite nome, descrição e privacidade

### ✅ Player Global
- **Minimizado**: Barra inferior em todas as páginas
- **Maximizado**: Tela cheia com letras e fila
- **Controles**: Play/pause, skip, seek, volume, shuffle, repeat
- **Fila de reprodução**: Gerenciamento completo de músicas
- **Download**: Baixe suas músicas em formato WAV
- **Compartilhamento**: Link público para qualquer música

### ✅ Autenticação e Perfil
- Sistema completo de login/registro
- Perfil de usuário com estatísticas
- Dashboard personalizado
- Minhas músicas organizadas

### ✅ Library e Dashboard
- Veja todas as músicas (All/Mine/Friends)
- Filtros por gênero e busca
- Ordenação (recentes/antigas)
- Estatísticas de uso
- Músicas mais curtidas

---

## 🏗️ Arquitetura

### Backend (Python + FastAPI)

```
Back-End/
├── src/
│   ├── models/              # 🤖 Handlers BLIP e Suno API
│   │   ├── blip_handler.py
│   │   └── suno_handler.py
│   ├── services/            # 🎨 Cultural mapper + Prompt builder
│   │   ├── cultural_mapper.py
│   │   ├── prompt_builder.py
│   │   ├── narrative_builder.py
│   │   └── playlist_service.py
│   ├── utils/               # 🔧 Audio utilities
│   ├── database.py          # 💾 PostgreSQL/SQLite ORM
│   ├── config.py            # ⚙️ Configurações
│   └── main.py              # ⚡ API FastAPI (800+ linhas)
├── tests/                   # ✅ 61 testes (89% cobertura)
├── requirements.txt
└── render.yaml              # 🚀 Deploy config
```

**Stack:**
- FastAPI 0.116+ + Uvicorn (servidor ASGI)
- PyTorch 2.4.0 (framework ML)
- BLIP (Salesforce/blip-image-captioning-large) - Opcional
- Suno API V4 (music generation)
- PostgreSQL (produção) / SQLite (desenvolvimento)
- Bcrypt (autenticação)
- Pydantic (validação)
- Pytest (testes unitários)

**Principais Endpoints:**
```
# Saúde
GET  /           # Info da API
GET  /health     # Status do sistema

# Autenticação
POST /auth/register    # Registro de usuário
POST /auth/login       # Login

# Geração de Música
POST /generate         # Gera música a partir de imagem
GET  /audio/{id}       # Retorna arquivo de áudio
GET  /task/{task_id}   # Status da geração

# Músicas
GET  /songs                    # Lista todas as músicas
GET  /songs/user/{userName}    # Músicas por usuário
GET  /songs/{id}               # Busca música específica
PUT  /songs/{id}/like          # Toggle like
DELETE /songs/{id}             # Delete música
GET  /songs/search/query       # Busca por texto

# Playlists
POST /playlists                     # Criar playlist
GET  /playlists/user/{user_id}      # Playlists do usuário
GET  /playlists/public              # Playlists públicas
GET  /playlists/{playlist_id}       # Detalhes da playlist
GET  /playlists/{playlist_id}/songs # Músicas da playlist
POST /playlists/{playlist_id}/songs # Adicionar música
DELETE /playlists/{playlist_id}/songs/{song_id} # Remover música
PUT  /playlists/{playlist_id}       # Atualizar playlist
DELETE /playlists/{playlist_id}     # Deletar playlist

# Usuários
GET  /users/{user_id}          # Info do usuário
POST /users/{user_id}/follow   # Seguir usuário
DELETE /users/{user_id}/unfollow # Deixar de seguir
```

### Frontend (React + TypeScript)

```
Front-End/
├── src/
│   ├── pages/               # 📄 8 páginas React
│   │   ├── Home.tsx
│   │   ├── Create.tsx
│   │   ├── Play.tsx         # Player público (compartilhamento)
│   │   ├── Library.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Auth.tsx
│   │   ├── Playlists.tsx
│   │   └── PlaylistDetail.tsx
│   ├── components/          # 🎨 60+ componentes UI (shadcn)
│   │   ├── Player/          # Player global + controles
│   │   └── ui/              # shadcn/ui components
│   ├── contexts/            # 🔄 React Context
│   │   ├── AuthContext.tsx
│   │   ├── QueueContext.tsx
│   │   └── PlayerContext.tsx
│   ├── services/            # 🔌 API integration
│   │   └── api.ts
│   └── hooks/               # 🪝 Custom hooks
├── tests/                   # ✅ 19 testes unitários
├── e2e/                     # 🧪 48 testes E2E (Playwright)
├── package.json
└── vercel.json              # 🚀 Deploy config
```

**Stack:**
- React 18.3.1 + TypeScript 5.8.3
- Vite 5.4.19 (build tool)
- Tailwind CSS + shadcn/ui (60+ componentes)
- React Router 6.30.1 (navegação)
- TanStack Query (data fetching)
- Vitest + Playwright (testes)

**Páginas:**
```
/               # 🏠 Home
/create         # ✨ Criar música
/play/:id       # 🎵 Player público (compartilhamento)
/library        # 📚 Biblioteca
/dashboard      # 📊 Dashboard
/playlists      # 📋 Minhas Playlists
/playlist/:id   # 🎼 Detalhes da Playlist
/auth           # 🔐 Login/Registro
```

---

## 🧪 Testes

### Backend (Pytest)

```bash
cd Back-End
pytest tests/ -v --cov=src
```

✅ **61 testes** (100% passando)
✅ **89% cobertura** (target: 88%)
⏱️ **7.35s** de execução

### Frontend (Vitest)

```bash
cd Front-End
npm test
```

✅ **19 testes** (core passando)
⏱️ **3.21s** de execução

### E2E (Playwright)

```bash
cd Front-End
npm run e2e      # Headless
npm run e2e:ui   # Interface visual
```

✅ **48 testes E2E** configurados
- Autenticação (8 testes)
- Geração de música (10 testes)
- Navegação (12 testes)
- Playlists (8 testes)
- Tratamento de erros (10 testes)

---

## 📊 Métricas

| Métrica | Valor |
|---------|-------|
| **Linhas de código (Backend)** | ~3500 |
| **Linhas de código (Frontend)** | ~8000 |
| **Total de testes** | 128 |
| **Cobertura de testes** | 89% |
| **Tempo de geração (Suno API)** | 30-90s |
| **Duração da música** | 15-240s (customizável) |
| **Modelos de IA** | BLIP (opcional) + Suno API V4 |

---

## 📚 Documentação

### README Específicos

- **[Back-End/README.md](./Back-End/README.md)** - Documentação do backend
- **[Front-End/README.md](./Front-End/README.md)** - Documentação do frontend

### Documentação Adicional

- **[docs/suno-api-reference.md](./docs/suno-api-reference.md)** - Referência Suno API
- **[docs/original-planning.md](./docs/original-planning.md)** - Planejamento original

### API Documentation

Com o backend rodando, acesse:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🎯 Roadmap

### ✅ Fase 1 - MVP (CONCLUÍDO)

- [x] Backend completo com BLIP + Suno API
- [x] Frontend completo React + TypeScript
- [x] 128 testes unitários + E2E
- [x] Documentação técnica
- [x] Guias de uso e deploy
- [x] Scripts auxiliares

### ✅ Fase 2 - Produção (CONCLUÍDO)

- [x] Deploy em produção (Render + Vercel)
- [x] Sistema de autenticação completo
- [x] Database PostgreSQL
- [x] Sistema de playlists
- [x] Player global com fila
- [x] Download de músicas
- [x] Compartilhamento de músicas
- [x] Biblioteca de músicas por usuário
---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Padrão de Commits

```
feat: adiciona nova feature
fix: corrige bug
docs: atualiza documentação
test: adiciona testes
chore: tarefas gerais
refactor: refatora código
```

---

## 🐛 Troubleshooting

### Backend não inicia

**Erro:** `ModuleNotFoundError: No module named 'torch'`

**Solução:**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### Frontend não conecta no Backend

**Causa:** CORS ou URL errada

**Solução:**
1. Verifique que backend está em `http://localhost:8000`
2. Teste: `curl http://localhost:8000/health`
3. Verifique CORS no `Back-End/src/main.py`

### Suno API não funciona

**Causa:** API Key inválida ou não configurada

**Solução:**
1. Obtenha API key em https://sunoapi.org
2. Configure em `.env`: `SUNO_API_KEY=your_key_here`
3. Reinicie o backend

### Modelos BLIP não carregam

**Causa:** Primeira execução baixa ~2GB do HuggingFace

**Solução:**
- Aguarde o download completo (pode levar 5-10 minutos)
- Em produção: use `USE_BLIP=false` para desabilitar

### Erro CUDA out of memory

**Causa:** GPU sem memória suficiente

**Solução:** Sistema usa CPU automaticamente. Para forçar:
```python
# Back-End/src/config.py
DEVICE = "cpu"
```

---

## 📜 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- [Salesforce BLIP](https://github.com/salesforce/BLIP) - Modelo de análise de imagem
- [Suno API](https://sunoapi.org) - Modelo de geração de música profissional
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [FastAPI](https://fastapi.tiangolo.com/) - Framework backend
- [Vite](https://vitejs.dev/) - Build tool frontend
- [Render](https://render.com/) - Hospedagem backend
- [Vercel](https://vercel.com/) - Hospedagem frontend

---

<div align="center">

**Feito com ❤️ e 🤖 por WaveLength Team**

🎵 [**Experimente agora**](https://wave-length-ai.vercel.app) 🎵

[⬆ Voltar ao topo](#-wavelength)

</div>
