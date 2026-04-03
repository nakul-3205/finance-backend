import { config } from 'dotenv';
config();

import app from './app';
import { prisma } from './config/prisma';

const PORT = Number(process.env.PORT ?? 3000);

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('Database connected.');

    app.listen(PORT, () => {
      console.log(`\n  Server  →  http://localhost:${PORT}`);
      console.log(`  Health  →  http://localhost:${PORT}/health`);
      console.log(`  Mode    →  ${process.env.NODE_ENV ?? 'development'}\n`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);
