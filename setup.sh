#!/bin/sh

# Environment variables
export SUPABASE_HOST='lgqqvsbpoycdqzljhptu.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxncXF2c2Jwb3ljZHF6bGpocHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY2ODc0MywiZXhwIjoyMDkyMjQ0NzQzfQ.5bJ00rpGIA_Uo3ks4zAafThW72FhQTzvbZ1erimt0vE'
export SYMBOL='btcusdt'

# Download the collector files
curl -sO https://raw.githubusercontent.com/Anunaki34/clawcloud-to-supabase/main/collector.js
curl -sO https://raw.githubusercontent.com/Anunaki34/clawcloud-to-supabase/main/package.json

# Install and start
npm install
npm start