/**
 * Vercel Serverless Function — FT Flight Manager
 * Proxy para busca de funcionários via N8N → SQL Server (SRA)
 * Rota: GET /api/employees?q=nome
 */

const https = require('https');
const http  = require('http');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) {
    return res.status(200).json([]);
  }

  const webhookUrl = process.env.N8N_EMPLOYEES_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'N8N_EMPLOYEES_URL não configurada' });
  }

  try {
    const url      = new URL(`${webhookUrl}?query=${encodeURIComponent(q)}`);
    const lib      = url.protocol === 'https:' ? https : http;
    const options  = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method:   'GET',
      rejectUnauthorized: false, // suporte a certificado self-signed da intranet
    };

    const raw = await new Promise((resolve, reject) => {
      const request = lib.request(options, (proxyRes) => {
        let body = '';
        proxyRes.on('data', chunk => body += chunk);
        proxyRes.on('end', () => resolve(body));
      });
      request.on('error', reject);
      request.setTimeout(10000, () => { request.destroy(); reject(new Error('Timeout')); });
      request.end();
    });

    // Body vazio = 0 resultados (N8N não envia [] quando SQL retorna 0 linhas)
    if (!raw || raw.trim() === '') {
      return res.status(200).json([]);
    }

    // N8N pode retornar formato interno [{ json: {...} }] — normaliza para array plano
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: `N8N retornou resposta inválida: ${raw.slice(0, 100)}` });
    }

    let result = parsed;
    if (Array.isArray(parsed) && parsed[0]?.json !== undefined) {
      result = parsed.map(item => item.json);
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
