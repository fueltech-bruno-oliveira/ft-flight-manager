/**
 * Vercel Serverless Function — FT Flight Manager
 * Proxy para N8N Webhook (resolve CORS/SSL do browser)
 * Rota: POST /api/n8n
 */

const https = require('https');
const http  = require('http');
const { URL } = require('url');

const N8N_URL = process.env.N8N_ALERT_URL || 'https://intranet.fueltech.com.br:5678/webhook-test/ft-price-alert';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const body = JSON.stringify(req.body);
  const target = new URL(N8N_URL);
  const lib = target.protocol === 'https:' ? https : http;

  const options = {
    hostname: target.hostname,
    port:     target.port || (target.protocol === 'https:' ? 443 : 80),
    path:     target.pathname,
    method:   'POST',
    headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    rejectUnauthorized: false, // aceita certificados auto-assinados (intranet)
  };

  return new Promise((resolve) => {
    const req2 = lib.request(options, (r) => {
      res.status(r.statusCode || 200).json({ ok: true });
      resolve();
    });
    req2.on('error', (err) => {
      res.status(502).json({ error: err.message });
      resolve();
    });
    req2.setTimeout(10000, () => { req2.destroy(); res.status(504).json({ error: 'timeout' }); resolve(); });
    req2.write(body);
    req2.end();
  });
};
