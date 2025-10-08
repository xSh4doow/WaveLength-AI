# 🗄️ Configurar PostgreSQL no Render (Persistência de Dados)

## ⚠️ Problema

O tier gratuito do Render tem **disco efêmero** - os dados do SQLite resetam a cada deploy!

## ✅ Solução: PostgreSQL Gratuito

O Render oferece PostgreSQL gratuitamente com até **1GB de armazenamento**.

---

## 🚀 Passo a Passo

### 1. Criar PostgreSQL Database no Render

1. Acesse https://dashboard.render.com
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `wavelength-db`
   - **Database**: `wavelength`
   - **User**: `wavelength_user` (gerado automaticamente)
   - **Region**: **Oregon (US West)** (mesma do backend)
   - **Plan**: **Free**
4. Clique em **"Create Database"**

### 2. Copiar Database URL

Após criação, você verá várias URLs. Copie a **Internal Database URL**:

```
postgres://wavelength_user:password@dpg-xxx/wavelength
```

⚠️ **IMPORTANTE**: Use a **Internal URL**, não a External! É mais rápida e segura.

### 3. Adicionar Environment Variable no Backend

1. Vá até seu **Web Service** (wavelength-backend)
2. Vá em **"Environment"** (menu lateral)
3. Clique em **"Add Environment Variable"**
4. Adicione:
   - **Key**: `DATABASE_URL`
   - **Value**: Cole a Internal Database URL copiada
5. Clique em **"Save Changes"**

O backend irá **reiniciar automaticamente** e começar a usar PostgreSQL!

---

## ✅ Como Funciona

O `database.py` detecta automaticamente:

```python
# Verifica se DATABASE_URL existe
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Usa PostgreSQL
    print("[Database] Using PostgreSQL")
else:
    # Usa SQLite (desenvolvimento)
    print("[Database] Using SQLite")
```

**Localmente**: Sem `DATABASE_URL` → usa SQLite
**Produção**: Com `DATABASE_URL` → usa PostgreSQL

---

## 🧪 Testar Conexão

Após adicionar a env var e o backend reiniciar:

```bash
curl https://wavelength-ai.onrender.com/health
```

Nos **logs do Render**, você deve ver:

```
[Database] Using PostgreSQL: postgres://wavelength_user:...
[Database] Tables initialized successfully (PostgreSQL)
```

---

## 📊 Limites do Free Tier

- ✅ **1GB** de armazenamento
- ✅ **90 dias** de retenção de dados
- ✅ **Backups automáticos** (últimos 7 dias)
- ⚠️ **1 database** por conta gratuita
- ⚠️ Após 90 dias de inatividade, o DB é deletado

Para um MVP, **1GB é mais que suficiente**:
- Cada música: ~100KB de metadados
- 1GB = ~10.000 músicas

---

## 🔧 Comandos Úteis

### Ver todas as músicas no DB (via psql)

No dashboard do Render PostgreSQL, clique em **"Connect"** → **"External Connection"**

```bash
psql postgres://wavelength_user:password@dpg-xxx/wavelength

# Ver todas as músicas
SELECT song_name, user_name, created_at FROM songs ORDER BY created_at DESC LIMIT 10;

# Contar total de músicas
SELECT COUNT(*) FROM songs;

# Ver músicas de um usuário
SELECT * FROM songs WHERE user_name = 'Seu Nome';
```

### Limpar todas as músicas (cuidado!)

```sql
DELETE FROM songs;
```

---

## 🔄 Migração de Dados (SQLite → PostgreSQL)

Se você já tem músicas no SQLite local e quer migrar:

### Opção 1: Manual (Recriar)

Simplesmente gere as músicas novamente com o PostgreSQL ativo.

### Opção 2: Export/Import (Avançado)

```bash
# 1. Exportar do SQLite
sqlite3 wavelength.db ".dump songs" > songs.sql

# 2. Converter para PostgreSQL syntax (manual ou com ferramenta)

# 3. Importar no PostgreSQL
psql $DATABASE_URL < songs_converted.sql
```

---

## 🆙 Upgrade (Se precisar mais espaço)

Se 1GB não for suficiente:

| Plan | Armazenamento | Preço |
|------|---------------|-------|
| Free | 1 GB | $0 |
| Starter | 10 GB | $7/mês |
| Standard | 100 GB | $25/mês |

Você pode fazer upgrade a qualquer momento sem perder dados.

---

## ✅ Checklist

- [ ] PostgreSQL criado no Render
- [ ] Internal Database URL copiada
- [ ] `DATABASE_URL` adicionada às env vars do backend
- [ ] Backend reiniciado automaticamente
- [ ] Logs mostram "Using PostgreSQL"
- [ ] Endpoint `/health` funciona
- [ ] Criar música funciona e salva no PostgreSQL
- [ ] Dados persistem após deploy

---

## 🎉 Pronto!

Agora seu banco de dados é **persistente** e os dados **não resetam mais** a cada deploy!

**Próximos passos:**
1. Teste criar algumas músicas
2. Faça um novo deploy do backend
3. Verifique que as músicas continuam lá 🎵

---

## 🆘 Troubleshooting

### Erro: "psycopg2 not installed"

O `requirements.txt` já tem `psycopg2-binary`. Se der erro, force reinstalação:

```bash
# No Render, vai instalar automaticamente no próximo deploy
```

### Erro: "connection refused"

- Verifique se usou **Internal URL** (não External)
- Verifique se o PostgreSQL está na **mesma região** que o backend

### Dados não aparecem

- Verifique os logs: `[Database] Using PostgreSQL`
- Teste criar uma música no frontend
- Verifique no psql se a tabela foi criada: `\dt`

---

**Database persistente configurado! 🗄️✅**
