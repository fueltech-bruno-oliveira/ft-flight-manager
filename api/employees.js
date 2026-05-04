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

    const data = await new Promise((resolve, reject) => {
      const request = lib.request(options, (proxyRes) => {
        let raw = '';
        proxyRes.on('data', chunk => raw += chunk);
        proxyRes.on('end', () => resolve(raw));
      });
      request.on('error', reject);
      request.setTimeout(10000, () => { request.destroy(); reject(new Error('Timeout')); });
      request.end();
    });

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
