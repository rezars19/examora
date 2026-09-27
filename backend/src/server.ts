import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';

import { setupAuth } from './plugins/auth.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { superadminRoutes } from './modules/superadmin/superadmin.routes.js';
import { schoolRoutes } from './modules/school/school.routes.js';
import { questionsRoutes } from './modules/questions/questions.routes.js';
import { examsRoutes } from './modules/exams/exams.routes.js';

dotenv.config();

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');

if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // 1. CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // 2. Multipart file upload (max 10MB)
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  // 3. Static uploads server
  await fastify.register(fastifyStatic, {
    root: uploadDir,
    prefix: '/uploads/',
  });

  // 4. Auth & JWT Plugin
  await setupAuth(fastify);

  // 5. Health Check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'examora-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // 6. Register Modular Routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(superadminRoutes, { prefix: '/api/superadmin' });
  await fastify.register(schoolRoutes, { prefix: '/api/school' });
  await fastify.register(questionsRoutes, { prefix: '/api/questions' });
  await fastify.register(examsRoutes, { prefix: '/api/exams' });

  return fastify;
}

async function start() {
  try {
    const app = await buildApp();
    await app.listen({ port, host });
    console.log(`Examora Backend running at http://${host}:${port}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Jalankan server jika dipanggil langsung
if (process.argv[1] && process.argv[1].endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  start();
}
