import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import authPlugin from './plugins/auth.plugin';
import rateLimitPlugin from './plugins/rate-limit.plugin';
import authRoutes from './routes/auth.routes';
import connectionsRoutes from './routes/connections.routes';
import syncsRoutes from './routes/syncs.routes';
import webhooksRoutes from './routes/webhooks.routes';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
      transport: env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  });

  await fastify.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  await fastify.register(rateLimitPlugin);
  await fastify.register(authPlugin);

  await fastify.register(authRoutes);
  await fastify.register(connectionsRoutes);
  await fastify.register(syncsRoutes);
  await fastify.register(webhooksRoutes);

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return fastify;
}
