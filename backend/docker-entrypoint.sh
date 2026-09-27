#!/bin/sh
set -e

echo "=== Memulai Deployment Examora Backend ==="

echo "1. Menjalankan migrasi database..."
npx prisma migrate deploy

echo "2. Memeriksa seed Super Admin..."
npm run prisma:seed || echo "Seed melewati atau telah ada."

echo "3. Menjalankan server Fastify..."
exec node dist/server.js
