# ✈️ FT Flight Manager — Deploy na Vercel

## O que é este projeto
Painel de gestão de passagens corporativas da FuelTech.
Busca passagens via Google Flights (SerpAPI), monitora preços automaticamente e gera alertas de compra.

---

## 🚀 Como publicar na Vercel (5 minutos)

### 1. Crie uma conta na Vercel
Acesse **[vercel.com](https://vercel.com)** e crie uma conta gratuita (pode entrar com GitHub, GitLab ou Google).

### 2. Suba o projeto para o GitHub
1. Acesse **[github.com](https://github.com)** e crie uma conta gratuita se não tiver
2. Clique em **New repository** → nome: `ft-flight-manager` → **Create repository**
3. Faça upload de todos os arquivos desta pasta:
   - Clique em **uploading an existing file**
   - Arraste a pasta inteira (ou os arquivos um a um)
   - Commit: **"FT Flight Manager inicial"**

### 3. Importe na Vercel
1. Em **[vercel.com/new](https://vercel.com/new)**, clique **"Import Git Repository"**
2. Selecione o repositório `ft-flight-manager`
3. **NÃO altere** nenhuma configuração de build — clique direto em **Deploy**

### 4. Configure a variável de ambiente (IMPORTANTE)
Depois do primeiro deploy:
1. No painel da Vercel, abra o projeto → **Settings → Environment Variables**
2. Adicione:
   - **Name:** `SERP_KEY`
   - **Value:** `f326309d4def0107ddc6d12a22e97474bb159346f198f55e17fde3c5cc5c2a10`
   - **Environment:** Production, Preview, Development (marque todos)
3. Clique **Save**
4. Vá em **Deployments → clique nos 3 pontinhos → Redeploy**

### 5. Pronto! 🎉
Sua URL será algo como: `https://ft-flight-manager.vercel.app`
Compartilhe com o time de compras!

---

## 📁 Estrutura do projeto

```
ft-flight-manager/
├── api/
│   └── flights.js       ← Proxy serverless (chama SerpAPI com segurança)
├── public/
│   └── index.html       ← Painel completo (HTML + CSS + JS)
├── vercel.json          ← Configuração de rotas da Vercel
├── package.json         ← Metadados do projeto Node.js
└── README.md            ← Este arquivo
```

---

## 🔒 Segurança
- A chave SerpAPI **nunca fica exposta** no frontend
- Ela fica armazenada como variável de ambiente na Vercel (criptografada)
- O frontend chama `/api/flights` → a função serverless injeta a chave → chama SerpAPI

---

## ❓ Dúvidas
- **Erro "API não respondeu":** verifique se a variável `SERP_KEY` está configurada e fez Redeploy
- **Voos não aparecem:** verifique se a data é futura e o aeroporto IATA está correto
- **Alertas não atualizam:** o auto-refresh funciona a cada 30min enquanto o painel estiver aberto no navegador
