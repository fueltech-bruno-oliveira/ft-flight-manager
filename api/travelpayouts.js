/**
 * Vercel Serverless Function — FT Flight Manager
 * Proxy para Travelpayouts Data API (resolve CORS e protege o token)
 * Rota: GET /api/travelpayouts?origin=POA&destination=VCP&depart_date=2025-06-10
 */

const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.TRAVELPAYOUTS_TOKEN) {
    return res.status(500).json({ error: 'TRAVELPAYOUTS_TOKEN não configurado' });
  }

  const params = new URLSearchParams(req.query);
  params.set('token',    process.env.TRAVELPAYOUTS_TOKEN);
  params.set('currency', 'brl');

  const url = `https://api.travelpayouts.com/v1/prices/cheap?${params}`;

  return new Promise((resolve) => {
    const request = https.get(url, (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        res.status(proxyRes.statusCode).send(data);
        resolve();
      });
    });
    request.on('error', (err) => {
      res.status(500).json({ error: err.message });
      resolve();
    });
    request.setTimeout(15000, () => {
      request.destroy();
      res.status(504).json({ error: 'Timeout Travelpayouts' });
      resolve();
    });
  });
};
