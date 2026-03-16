# FT Flight Manager ✈️

Ferramenta interna da FuelTech para monitoramento e compra de passagens aéreas para eventos do calendário da empresa.

## Funcionalidades

- **Calendário de Eventos** — lista todos os eventos do ano com cidade, aeroporto, datas e status. Suporta importação via planilha `.xlsx` ou `.csv`.
- **Busca de Passagens** — consulta voos em tempo real via Google Flights (SerpAPI), saindo de Porto Alegre (POA) para o aeroporto do evento. Exibe preço, horários, escalas e link direto para compra.
- **Alertas de Preço** — cria alertas por rota/data. O sistema verifica automaticamente os preços a cada 30 minutos e notifica quando o valor alvo é atingido.
- **Compras** — registra passagens compradas com quantidade, valor por pessoa e total investido. Painel com KPIs de resumo.

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + CSS + JavaScript (vanilla) |
| Backend | Vercel Serverless Function (Node.js 24) |
| API de Voos | [SerpAPI — Google Flights](https://serpapi.com/google-flights-api) |
| Exportação | [SheetJS (xlsx)](https://sheetjs.com/) |
| Deploy | [Vercel](https://vercel.com) via GitHub |

## Estrutura

```
ft-flight-manager/
├── index.html        # SPA — toda a interface e lógica do frontend
├── api/
│   └── flights.js    # Serverless function — proxy para SerpAPI (oculta a chave)
├── package.json
└── vercel.json       # Configuração da função serverless
```

## Configuração

### Variável de Ambiente (Vercel)

No dashboard do Vercel → **Settings → Environment Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `SERP_KEY` | Sua chave da [SerpAPI](https://serpapi.com/) |

### Deploy

O projeto faz deploy automático a cada push na branch `main` via integração GitHub → Vercel.

## Aeroportos Utilizados

| Aeroporto | Código |
|-----------|--------|
| Porto Alegre (origem fixa) | POA |
| Campinas / Viracopos | VCP |
| São Paulo / Congonhas | CGH |
| São Paulo / Guarulhos | GRU |
| Florianópolis | FLN |

## Observações

- Todos os dados de alertas e compras são salvos no `localStorage` do navegador.
- O backend existe apenas para ocultar a chave da SerpAPI — sem ele, o frontend não consegue buscar voos.
- O endpoint `/api/flights` sem parâmetros retorna `{ status: 'ok' }` (health check).
