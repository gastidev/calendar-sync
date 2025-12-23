import { FastifyPluginAsync } from 'fastify';
import { syncsRepository } from '../repositories/syncs.repository';
import { syncEngineService } from '../services/sync-engine.service';
import { z } from 'zod';

const syncsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/syncs', async (request, reply) => {
    const userId = request.user!.id;

    const syncs = await syncsRepository.findByUserId(userId);

    return { syncs };
  });

  fastify.post('/api/v1/syncs', async (request, reply) => {
    const bodySchema = z.object({
      sourceCalendarId: z.string().uuid(),
      targetCalendarId: z.string().uuid(),
    });

    const { sourceCalendarId, targetCalendarId } = bodySchema.parse(request.body);
    const userId = request.user!.id;

    if (sourceCalendarId === targetCalendarId) {
      return reply.code(400).send({ error: 'Source and target calendars must be different' });
    }

    const sync = await syncsRepository.create({
      user_id: userId,
      source_calendar_id: sourceCalendarId,
      target_calendar_id: targetCalendarId,
    });

    return { sync };
  });

  fastify.get('/api/v1/syncs/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);
    const userId = request.user!.id;

    const sync = await syncsRepository.findById(id);

    if (!sync || sync.user_id !== userId) {
      return reply.code(404).send({ error: 'Sync not found' });
    }

    return { sync };
  });

  fastify.patch('/api/v1/syncs/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      isActive: z.boolean().optional(),
      syncDirection: z.enum(['bidirectional', 'source_to_target', 'target_to_source']).optional(),
    });

    const { id } = paramsSchema.parse(request.params);
    const body = bodySchema.parse(request.body);
    const userId = request.user!.id;

    const sync = await syncsRepository.findById(id);

    if (!sync || sync.user_id !== userId) {
      return reply.code(404).send({ error: 'Sync not found' });
    }

    if (body.isActive !== undefined) {
      await syncsRepository.updateActiveStatus(id, body.isActive);
    }

    if (body.syncDirection !== undefined) {
      await syncsRepository.updateSyncDirection(id, body.syncDirection);
    }

    return { success: true };
  });

  fastify.delete('/api/v1/syncs/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);
    const userId = request.user!.id;

    const sync = await syncsRepository.findById(id);

    if (!sync || sync.user_id !== userId) {
      return reply.code(404).send({ error: 'Sync not found' });
    }

    await syncsRepository.delete(id);

    return { success: true };
  });

  fastify.get('/api/v1/syncs/:id/settings', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);
    const userId = request.user!.id;

    const sync = await syncsRepository.findById(id);

    if (!sync || sync.user_id !== userId) {
      return reply.code(404).send({ error: 'Sync not found' });
    }

    const settings = await syncsRepository.getSettings(id);

    return { settings };
  });

  fastify.patch('/api/v1/syncs/:id/settings', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      privacyMode: z.boolean().optional(),
      placeholderText: z.string().optional(),
      eventFilterType: z.enum(['all', 'accepted_only']).optional(),
      sourceToTargetPrivacyMode: z.boolean().optional(),
      targetToSourcePrivacyMode: z.boolean().optional(),
      sourceToTargetPlaceholderText: z.string().optional(),
      targetToSourcePlaceholderText: z.string().optional(),
      sourceToTargetEventFilterType: z.enum(['all', 'accepted_only']).optional(),
      targetToSourceEventFilterType: z.enum(['all', 'accepted_only']).optional(),
      sourceToTargetPrefix: z.string().optional(),
      targetToSourcePrefix: z.string().optional(),
    });

    const { id } = paramsSchema.parse(request.params);
    const body = bodySchema.parse(request.body);
    const userId = request.user!.id;

    const sync = await syncsRepository.findById(id);

    if (!sync || sync.user_id !== userId) {
      return reply.code(404).send({ error: 'Sync not found' });
    }

    const updateData: any = {};
    if (body.privacyMode !== undefined) updateData.privacy_mode = body.privacyMode;
    if (body.placeholderText !== undefined) updateData.placeholder_text = body.placeholderText;
    if (body.eventFilterType !== undefined) updateData.event_filter_type = body.eventFilterType;
    if (body.sourceToTargetPrivacyMode !== undefined) updateData.source_to_target_privacy_mode = body.sourceToTargetPrivacyMode;
    if (body.targetToSourcePrivacyMode !== undefined) updateData.target_to_source_privacy_mode = body.targetToSourcePrivacyMode;
    if (body.sourceToTargetPlaceholderText !== undefined) updateData.source_to_target_placeholder_text = body.sourceToTargetPlaceholderText;
    if (body.targetToSourcePlaceholderText !== undefined) updateData.target_to_source_placeholder_text = body.targetToSourcePlaceholderText;
    if (body.sourceToTargetEventFilterType !== undefined) updateData.source_to_target_event_filter_type = body.sourceToTargetEventFilterType;
    if (body.targetToSourceEventFilterType !== undefined) updateData.target_to_source_event_filter_type = body.targetToSourceEventFilterType;
    if (body.sourceToTargetPrefix !== undefined) updateData.source_to_target_prefix = body.sourceToTargetPrefix;
    if (body.targetToSourcePrefix !== undefined) updateData.target_to_source_prefix = body.targetToSourcePrefix;

    const settings = await syncsRepository.updateSettings(id, updateData);

    return { settings };
  });

  fastify.post('/api/v1/syncs/:id/trigger', {
    config: {
      rawBody: true
    }
  }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);
    const userId = request.user!.id;

    const sync = await syncsRepository.findById(id);

    if (!sync || sync.user_id !== userId) {
      return reply.code(404).send({ error: 'Sync not found' });
    }

    const result = await syncEngineService.executeSyncJob(id);

    return { result };
  });

  fastify.get('/api/v1/syncs/:id/logs', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const querySchema = z.object({
      limit: z.coerce.number().optional().default(50),
    });

    const { id } = paramsSchema.parse(request.params);
    const { limit } = querySchema.parse(request.query);
    const userId = request.user!.id;

    const sync = await syncsRepository.findById(id);

    if (!sync || sync.user_id !== userId) {
      return reply.code(404).send({ error: 'Sync not found' });
    }

    const logs = await syncsRepository.getLogsBySyncId(id, limit);

    return { logs };
  });
};

export default syncsRoutes;
