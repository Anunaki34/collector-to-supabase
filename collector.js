'use strict';

const https      = require('https');
const fs         = require('fs');
const WebSocket  = require('./node_modules/ws');

// ── Configuration (read from environment) ─────────────────────────────────────
const SUPABASE_HOST     = process.env.SUPABASE_HOST;
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SYMBOL            = process.env.SYMBOL || 'btcusdt';
const HEALTHCHECK_URL   = process.env.HEALTHCHECK_PING_URL || '';
const BINANCE_WS_URL    = `wss://stream.binance.com:9443/ws/${SYMBOL}@aggTrade`;

// Validate required config
if (!SUPABASE_HOST || !SUPABASE_KEY) {
  console.error('❌ ERROR: SUPABASE_HOST and SUPABASE_SERVICE_ROLE_KEY must be set.');
  console.error('Please create a .env file or export environment variables.');
  process.exit(1);
}

// ── Optional shutdown logger (writes to shutdown.log) ─────────────────────────
function logShutdown(reason) {
  const line = `${new Date().toISOString()} | ${reason}\n`;
  try { fs.appendFileSync('shutdown.log', line); } catch (e) { /* ignore */ }
}
process.on('exit', (code) => logShutdown(`Exited with code ${code}`));
process.on('uncaughtException', (err) => { logShutdown(`Uncaught: ${err.message}`); console.error(err); process.exit(1); });
process.on('SIGTERM', () => { logShutdown('SIGTERM'); process.exit(0); });
process.on('SIGINT',  () => { logShutdown('SIGINT');  process.exit(0); });

// ── State ────────────────────────────────────────────────────────────────────
let insertCount = 0;

// ── Supabase insert ──────────────────────────────────────────────────────────
function insertTrade(trade) {
  const payload = JSON.stringify({
    price:   parseFloat(trade.p),
    qty:     parseFloat(trade.q),
    is_sell: trade.m
  });

  const options = {
    hostname: SUPABASE_HOST,
    path:     '/rest/v1/trades',
    method:   'POST',
    headers: {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'apikey':          SUPABASE_KEY,
      'Authorization':   `Bearer ${SUPABASE_KEY}`,
      'Prefer':          'return=minimal'
    }
  };

  const req = https.request(options, (res) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      res.resume(); // drain to free socket
      insertCount++;
      if (insertCount % 10 === 0) {
        console.log(`✅ Inserted ${insertCount} trades`);
      }
    } else {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        console.error(`❌ Insert failed [${res.statusCode}]: ${body.trim()}`);
      });
    }
  });

  req.on('error', (err) => {
    console.error(`❌ Request error: ${err.message}`);
  });

  req.write(payload);
  req.end();
}

// ── Healthcheck ping ─────────────────────────────────────────────────────────
function pingHealth() {
  if (!HEALTHCHECK_URL) return;
  https.get(HEALTHCHECK_URL, (res) => {
    res.resume();
  }).on('error', (err) => {
    console.error(`⚠️  Healthcheck ping failed: ${err.message}`);
  });
}

// ── WebSocket connection ─────────────────────────────────────────────────────
function connect() {
  const ws = new WebSocket(BINANCE_WS_URL);

  ws.on('open', () => {
    console.log(`🔌 Connected to Binance stream: ${SYMBOL}@aggTrade`);
  });

  ws.on('message', (data) => {
    let trade;
    try {
      trade = JSON.parse(data);
    } catch (e) {
      console.error(`❌ JSON parse error: ${e.message}`);
      return;
    }

    // Per‑trade log – keeps the process visibly alive
    console.log(`📥 Trade: ${trade.p} ${trade.q}`);
    insertTrade(trade);
  });

  ws.on('close', (code) => {
    console.log(`⚠️  WebSocket closed (${code}). Reconnecting in 3s...`);
    setTimeout(connect, 3000);
  });

  ws.on('error', (err) => {
    console.error(`❌ WebSocket error: ${err.message}`);
    // 'close' will fire next, triggering reconnect
  });
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
console.log('🚀 Collector starting...');
pingHealth();
setInterval(pingHealth, 5 * 60 * 1000); // every 5 minutes
connect();
