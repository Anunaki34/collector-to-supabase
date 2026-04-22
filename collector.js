const WebSocket = require('ws');
const https = require('https');

// ===== CONFIGURATION (from environment) =====
const SUPABASE_HOST = process.env.SUPABASE_HOST || 'lgqqvsbpoycdqzljhptu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SYMBOL = process.env.SYMBOL || 'btcusdt';
// ============================================

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

let tradeCount = 0;

function insertTrade(price, qty, isSell) {
  const data = JSON.stringify({ price, qty, is_sell: isSell });
  const options = {
    hostname: SUPABASE_HOST,
    port: 443,
    path: '/rest/v1/trades',
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'Prefer': 'return=minimal'
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        tradeCount++;
        if (tradeCount % 10 === 0) {
          console.log(`✅ Inserted ${tradeCount} trades`);
        }
      } else {
        console.error(`❌ Insert failed (${res.statusCode}):`, body);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
  });

  req.write(data);
  req.end();
}

function connect() {
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${SYMBOL}@aggTrade`);

  ws.on('open', () => console.log('🟢 WebSocket connected'));
  ws.on('error', (err) => console.error('🔴 WS error:', err.message));
  ws.on('close', () => setTimeout(connect, 3000));
  ws.on('message', (raw) => {
    try {
      const t = JSON.parse(raw);
      insertTrade(parseFloat(t.p), parseFloat(t.q), t.m);
    } catch {}
  });
}

console.log('🚀 Starting collector...');
connect();