# 🌐 Como Fazer Deploy do WaveLength

Guia completo para colocar sua aplicação online e acessível de qualquer dispositivo.

---

## 📊 Visão Geral

O WaveLength é composto por:
- **Backend** (Python/FastAPI) - API que processa imagens e gera músicas
- **Frontend** (React/TypeScript) - Interface web

Você pode fazer deploy de ambos **juntos** ou **separados**, dependendo da plataforma.

---

## 🎯 Opções de Deploy

| Plataforma | Backend | Frontend | Dificuldade | Custo | Recomendado |
|------------|---------|----------|-------------|-------|-------------|
| **Render** | ✅ | ✅ | 🟢 Fácil | Free tier | ⭐⭐⭐ |
| **Vercel + Render** | ✅ | ✅ | 🟡 Médio | Free tier | ⭐⭐ |
| **Railway** | ✅ | ✅ | 🟢 Fácil | $5/mês | ⭐⭐⭐ |
| **Hugging Face Spaces** | ✅ | ✅ | 🟢 Fácil | Free tier | ⭐⭐ |
| **AWS/GCP/Azure** | ✅ | ✅ | 🔴 Difícil | Variável | ⭐ |

---

## 🚀 Opção 1: Render (Recomendado para Iniciantes)

**Vantagens:**
- ✅ Totalmente grátis (tier gratuito)
- ✅ Deploy automático via GitHub
- ✅ SSL/HTTPS incluído
- ✅ Fácil configuração

**Desvantagens:**
- ⚠️ Cold start (pode levar 30s para "acordar" após inatividade)
- ⚠️ 512MB RAM no free tier (pode ser limitado para modelos grandes)

### 1️⃣ Deploy do Backend

1. **Criar conta:** https://render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:

   - **Name:** `wavelength-api`
   - **Branch:** `main`
   - **Root Directory:** `Back-End`
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     uvicorn src.main:app --host 0.0.0.0 --port $PORT
     ```

5. **Environment Variables:** (deixar vazio por enquanto, config padrão funciona)

6. Clique em **"Create Web Service"**

⏱️ **Tempo de build:** 5-10 minutos

✅ **URL gerada:** `https://wavelength-api.onrender.com`

**Testar:**
```bash
curl https://wavelength-api.onrender.com/health
```

### 2️⃣ Deploy do Frontend

1. No Render, clique em **"New +"** → **"Static Site"**
2. Conecte o mesmo repositório GitHub
3. Configure:

   - **Name:** `wavelength-app`
   - **Branch:** `main`
   - **Root Directory:** `Front-End`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory:** `Front-End/dist`

4. **Environment Variables:**
   - Adicione: `VITE_API_URL` = `https://wavelength-api.onrender.com`

5. Clique em **"Create Static Site"**

✅ **URL gerada:** `https://wavelength-app.onrender.com`

### 3️⃣ Configurar CORS

Atualize `Back-End/src/main.py` para permitir requisições do frontend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://wavelength-app.onrender.com",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit e push - Render fará redeploy automático.

---

## ⚡ Opção 2: Vercel (Frontend) + Render (Backend)

**Vantagens:**
- ✅ Frontend na edge (super rápido globalmente)
- ✅ Zero cold start no frontend
- ✅ Deploy automático via GitHub

### 1️⃣ Backend no Render

Siga os mesmos passos da **Opção 1** para o backend.

### 2️⃣ Frontend no Vercel

1. **Criar conta:** https://vercel.com
2. Clique em **"Add New..."** → **"Project"**
3. Importe o repositório do GitHub
4. Configure:

   - **Framework Preset:** Vite
   - **Root Directory:** `Front-End`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. **Environment Variables:**
   - `VITE_API_URL` = `https://wavelength-api.onrender.com`

6. Clique em **"Deploy"**

✅ **URL gerada:** `https://wavelength-app.vercel.app`

---

## 🚂 Opção 3: Railway (Tudo em Um)

**Vantagens:**
- ✅ Deploy de backend + frontend juntos
- ✅ Banco de dados PostgreSQL incluído (para uso futuro)
- ✅ Melhor performance que Render free tier

**Desvantagens:**
- ❌ Não tem tier totalmente grátis ($5/mês com $5 de crédito inicial)

### Deploy Único

1. **Criar conta:** https://railway.app
2. Clique em **"New Project"** → **"Deploy from GitHub repo"**
3. Selecione o repositório WaveLength
4. Railway detecta automaticamente Python e Node.js
5. Configure variáveis de ambiente se necessário

Railway cria automaticamente:
- Um serviço para o backend
- Um serviço para o frontend
- URLs públicas para ambos

✅ **URLs geradas automaticamente**

---

## 🤗 Opção 4: Hugging Face Spaces (Ideal para Projetos de IA)

**Vantagens:**
- ✅ Plataforma focada em Machine Learning
- ✅ GPU disponível (tier pago)
- ✅ Comunidade de IA forte

### Deploy com Gradio

Crie um arquivo `app.py` na raiz:

```python
import gradio as gr
from Back_End.src.models.blip_handler import BLIPHandler
from Back_End.src.models.musicgen_handler import MusicGenHandler

# Inicializar modelos
blip = BLIPHandler()
musicgen = MusicGenHandler()

def generate_music(image):
    # Análise da imagem
    description = blip.analyze_image(image)

    # Gerar música
    prompt = f"ambient music inspired by {description}"
    audio = musicgen.generate(prompt, duration=8)

    return audio, description

# Interface Gradio
iface = gr.Interface(
    fn=generate_music,
    inputs=gr.Image(type="pil"),
    outputs=[gr.Audio(), gr.Textbox(label="Descrição")],
    title="🎵 WaveLength - Imagem para Música",
    description="Faça upload de uma imagem e gere música original!"
)

iface.launch()
```

1. Acesse https://huggingface.co/spaces
2. Clique em **"Create new Space"**
3. Escolha **"Gradio"** como SDK
4. Conecte o repositório GitHub ou faça upload
5. Adicione `requirements.txt` na raiz

---

## 🔧 Configurações Importantes

### Variáveis de Ambiente

**Backend (.env ou config da plataforma):**
```env
# Obrigatórias
PORT=8000

# Opcionais
DEVICE=cuda  # ou cpu
MAX_WORKERS=2
DEBUG=false
```

**Frontend (.env ou config da plataforma):**
```env
VITE_API_URL=https://seu-backend.onrender.com
```

### Performance e Custos

| Tier | RAM | Cold Start | Custo/mês |
|------|-----|-----------|-----------|
| Render Free | 512MB | Sim (~30s) | $0 |
| Render Starter | 1GB | Não | $7 |
| Railway | Variável | Não | $5+ |
| Hugging Face (GPU) | 16GB | Não | $15+ |

### Otimizações para Free Tier

1. **Reduza tamanho dos modelos:**
   ```python
   # Use musicgen-small ao invés de medium/large
   model = MusicGenHandler(model_name="small")
   ```

2. **Cache de modelos:**
   Modelos são baixados na primeira execução (~2GB). Configure cache:
   ```python
   os.environ['HF_HOME'] = '/cache'
   ```

3. **Limite duração da música:**
   ```python
   # Máximo de 8 segundos no free tier
   musicgen.generate(prompt, duration=8)
   ```

---

## 🌐 Domínio Personalizado

### Comprar Domínio

1. **Registradores:** Namecheap, GoDaddy, Google Domains
2. Custo: ~$10-15/ano

### Configurar DNS

**Render/Vercel:**
1. Vá em **Settings** → **Custom Domains**
2. Adicione seu domínio (ex: `wavelength.com`)
3. Configure DNS:
   - **A Record:** aponte para IP fornecido
   - **CNAME:** aponte para URL fornecida

**Exemplo:**
```
Type    Name    Value
CNAME   www     wavelength-app.onrender.com
CNAME   api     wavelength-api.onrender.com
```

---

## 📱 Testar de Múltiplos Dispositivos

### Mobile (iOS/Android)

1. Acesse a URL do frontend no navegador do celular
2. Adicione à tela inicial (funciona como PWA)

### Diferentes Navegadores

Teste em:
- Chrome/Edge
- Firefox
- Safari (desktop e mobile)

### Compartilhar com Outros

Envie a URL pública:
- Frontend: `https://seu-app.onrender.com`
- Qualquer pessoa pode acessar!

---

## 🐛 Troubleshooting de Deploy

### ❌ Backend com erro 500

**Verifique logs:**
- Render: Dashboard → Logs
- Railway: Service → Logs

**Causas comuns:**
- Falta de memória (modelos muito grandes)
- Timeout (primeira requisição baixa modelos)

**Solução:** Use tier pago com mais RAM ou modelos menores.

### ❌ Frontend não conecta no backend

**Verifique:**
1. `VITE_API_URL` configurado corretamente
2. CORS habilitado no backend
3. Backend está online (teste `/health`)

### ❌ Cold start muito lento

**Causas:**
- Free tier "dorme" após 15min de inatividade
- Primeira requisição demora ~30-60s

**Soluções:**
1. **Ping automático:** Configure cron job para fazer requisição a cada 10min
2. **Upgrade para tier pago:** Elimina cold start

**Exemplo de ping com cron-job.org:**
```
URL: https://wavelength-api.onrender.com/health
Intervalo: A cada 10 minutos
```

### ❌ Build falha no Render/Vercel

**Backend:**
```bash
# Verifique requirements.txt está correto
pip freeze > requirements.txt
```

**Frontend:**
```bash
# Limpe cache e rebuild
npm clean-install
npm run build
```

---

## 📊 Monitoramento

### Render

- **Logs:** Dashboard → Service → Logs
- **Métricas:** Dashboard → Service → Metrics (CPU, RAM, Requisições)

### Uptime Monitoring

Use serviços gratuitos:
- **UptimeRobot:** https://uptimerobot.com
- **Better Uptime:** https://betteruptime.com

Configure alertas por email se o site sair do ar.

---

## 🎯 Checklist Final

Antes de compartilhar publicamente:

- [ ] Backend respondendo em `/health`
- [ ] Frontend carregando corretamente
- [ ] Upload de imagem funciona
- [ ] Geração de música funciona
- [ ] Player de áudio funciona
- [ ] Testado em mobile (iOS e Android)
- [ ] Testado em diferentes navegadores
- [ ] HTTPS ativado (SSL)
- [ ] Domínio personalizado configurado (opcional)
- [ ] Monitoramento de uptime ativo

---

## 🔗 Recursos Adicionais

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Hugging Face Spaces:** https://huggingface.co/docs/hub/spaces

---

## 💡 Próximos Passos

Agora que está online:

1. **Compartilhe** a URL com amigos
2. **Monitore** uso e performance
3. **Otimize** baseado em feedback
4. **Escale** para tier pago se necessário

**Desenvolvido com WaveLength 🎵**
