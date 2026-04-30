/**
 * Vercel Serverless Function — FT Flight Manager
 * Proxy para Duffel API (resolve CORS e protege a chave)
 * Rota: /api/duffel
 * Body: { action, payload }
 *   action: 'search' | 'get_offers' | 'get_offer' | 'create_order'
 */

const https = require('https');

const DUFFEL_BASE = 'api.duffel.com';

function duffelRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: DUFFEL_BASE,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${process.env.DUFFEL_KEY}`,
        'Duffel-Version': 'v2',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });

    req.on('error', reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('Timeout')); });

    if (data) req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, payload } = req.body || {};

  try {
    let result;

    if (action === 'ping') {
      if (!process.env.DUFFEL_KEY) return res.status(500).json({ error: 'DUFFEL_KEY não configurada no servidor' });
      result = await duffelRequest('GET', '/air/airlines?limit=1', null);
      if (result.status === 200) return res.status(200).json({ status: 'ok' });
      const errBody = JSON.parse(result.body || '{}');
      const errMsg  = errBody?.errors?.[0]?.message || errBody?.error || `Duffel retornou ${result.status}`;
      return res.status(result.status).json({ error: errMsg });

    } else if (action === 'search') {
      // Cria offer request (busca de voos)
      // payload: { origin, destination, date, cabin_class, passengers }
      const body = {
        data: {
          slices: [{ origin: payload.origin, destination: payload.destination, departure_date: payload.date }],
          passengers: payload.passengers || [{ type: 'adult' }],
          cabin_class: payload.cabin_class || 'economy',
        },
      };
      result = await duffelRequest('POST', '/air/offer_requests?return_offers=true', body);

    } else if (action === 'get_offer') {
      // Busca detalhes e preço atualizado de uma oferta específica
      // payload: { offer_id }
      result = await duffelRequest('GET', `/air/offers/${payload.offer_id}`, null);

    } else if (action === 'create_order') {
      // Emite o bilhete
      // payload: { offer_id, passengers, payment }
      const body = {
        data: {
          selected_offers: [payload.offer_id],
          passengers: payload.passengers,
          payments: [payload.payment],
          type: 'instant',
        },
      };
      result = await duffelRequest('POST', '/air/orders', body);

    } else {
      return res.status(400).json({ error: `Ação desconhecida: ${action}` });
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(result.status).send(result.body);

  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro interno no proxy Duffel' });
  }
};
