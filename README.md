# collector-to-supabase

A lightweight Node.js collector that streams live BTCUSDT aggregated trades
from Binance WebSocket and inserts them into a Supabase (PostgreSQL) database.
Designed for 24/7 data collection with minimal CPU and memory footprint.

## Features

- Persistent WebSocket connection to Binance (`@aggTrade` stream)
- Direct HTTPS insert into Supabase – no ORM, no extra dependencies
- Automatic reconnection on connection loss
- Healthchecks.io ping for external uptime monitoring
- Clean shutdown logging (`shutdown.log`)
- Uses the battle‑tested `ws` library (loaded locally – no `npm install` needed)

## Why

Free‑tier PaaS platforms often kill long‑running processes due to idle timeouts or
arbitrary runtime limits. A real VPS with no artificial limits is the only way to
keep a trading data pipeline running 24/7. This collector uses less than 100 MB RAM
and negligible CPU, making it a perfect candidate for a small, always‑free VPS.

## Quick Start

1. Clone the repo and upload the files to your server (or keep them where they are).
2. Ensure the `node_modules/ws` folder is present (from a local `npm install ws`).
3. Set your Supabase host, service role key, and Healthchecks.io ping URL inside
   `collector.js`.
4. Run with `node collector.js` or use PM2 to keep it alive permanently.

## License

MIT – do whatever you want, just keep the attribution.
