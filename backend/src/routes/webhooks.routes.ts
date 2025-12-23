import { FastifyPluginAsync } from 'fastify';

const webhooksRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/webhooks/google', async (request, reply) => {
    const channelId = request.headers['x-goog-channel-id'];
    const resourceId = request.headers['x-goog-resource-id'];
    const resourceState = request.headers['x-goog-resource-state'];

    fastify.log.info({
      channelId,
      resourceId,
      resourceState,
    }, 'Google webhook received');

    return reply.code(200).send({ success: true });
  });
};

export default webhooksRoutes;
