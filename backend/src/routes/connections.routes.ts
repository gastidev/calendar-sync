import { FastifyPluginAsync } from 'fastify';
import { calendarConnectionsRepository } from '../repositories/calendar-connections.repository';
import { z } from 'zod';

const connectionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/connections', async (request, reply) => {
    const userId = request.user!.id;

    const connections = await calendarConnectionsRepository.findByUserId(userId);

    const connectionsWithCalendars = await Promise.all(
      connections.map(async (conn) => {
        const calendars = await calendarConnectionsRepository.findCalendarsByConnectionId(conn.id);
        return {
          ...conn,
          access_token: undefined,
          refresh_token: undefined,
          calendars,
        };
      })
    );

    return { connections: connectionsWithCalendars };
  });

  fastify.get('/api/v1/connections/:id/calendars', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);
    const userId = request.user!.id;

    const connection = await calendarConnectionsRepository.findById(id);

    if (!connection || connection.user_id !== userId) {
      return reply.code(404).send({ error: 'Connection not found' });
    }

    const calendars = await calendarConnectionsRepository.findCalendarsByConnectionId(id);

    return { calendars };
  });

  fastify.patch('/api/v1/connections/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      colorTag: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format').optional(),
    });

    const { id } = paramsSchema.parse(request.params);
    const body = bodySchema.parse(request.body);
    const userId = request.user!.id;

    const connection = await calendarConnectionsRepository.findById(id);

    if (!connection || connection.user_id !== userId) {
      return reply.code(404).send({ error: 'Connection not found' });
    }

    if (body.colorTag) {
      await calendarConnectionsRepository.updateColor(id, body.colorTag);
    }

    return { success: true };
  });

  fastify.delete('/api/v1/connections/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);
    const userId = request.user!.id;

    const connection = await calendarConnectionsRepository.findById(id);

    if (!connection || connection.user_id !== userId) {
      return reply.code(404).send({ error: 'Connection not found' });
    }

    await calendarConnectionsRepository.delete(id);

    return { success: true };
  });
};

export default connectionsRoutes;
