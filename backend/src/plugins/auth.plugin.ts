import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { supabasePublic } from '../config/database';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
    };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('user', undefined);

  fastify.addHook('preHandler', async (request, reply) => {
    const publicRoutes = ['/auth/google', '/webhooks/google', '/health'];

    if (publicRoutes.some(route => request.url.startsWith(route))) {
      return;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error } = await supabasePublic.auth.getUser(token);

    if (error || !user) {
      return reply.code(401).send({ error: 'Invalid token' });
    }

    request.user = {
      id: user.id,
      email: user.email!,
    };
  });
};

export default fp(authPlugin);
