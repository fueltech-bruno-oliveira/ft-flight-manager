/**
 * Vercel Serverless Function — FT Flight Manager
 * Proxy para SerpAPI Google Flights (resolve CORS)
 * Rota: /api/flights?...parâmetros...
 */

const https = require('https');

module.exports = async (req, res) => {
  // CORS — permite qualquer origem (nosso próprio frontend Vercel)
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Monta query string repassando todos os parâmetros recebidos
  const params = new URLSearchParams(req.query);

  // Injeta a chave da SerpAPI a partir de variável de ambiente
  params.set('api_key', process.env.SERP_KEY);

  const url = `https://serpapi.com/search.json?${params.toString()}`;

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

    request.setTimeout(20000, () => {
      request.destroy();
      res.status(504).json({ error: 'Timeout na requisição à SerpAPI' });
      resolve();
    });
  });
};
