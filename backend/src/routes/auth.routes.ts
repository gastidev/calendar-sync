import { FastifyPluginAsync } from 'fastify';
import { getAuthUrl } from '../config/google-oauth';
import { googleCalendarService } from '../services/google-calendar.service';
import { calendarConnectionsRepository } from '../repositories/calendar-connections.repository';
import { env } from '../config/env';
import { z } from 'zod';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/auth/google/init', async (request, reply) => {
    const querySchema = z.object({
      user_id: z.string().uuid(),
      prefix: z.string().optional().default('Personal'),
      color: z.string().optional().default('#3B82F6'),
    });

    const { user_id, prefix, color } = querySchema.parse(request.query);

    const state = Buffer.from(JSON.stringify({ user_id, prefix, color })).toString('base64');
    const authUrl = getAuthUrl(state);

    return reply.redirect(authUrl);
  });

  fastify.get('/auth/google/callback', async (request, reply) => {
    try {
      const querySchema = z.object({
        code: z.string(),
        state: z.string(),
      });

      const { code, state } = querySchema.parse(request.query);
      const { user_id, prefix, color } = JSON.parse(Buffer.from(state, 'base64').toString());

      const tokenInfo = await googleCalendarService.exchangeCodeForTokens(code);
      const userInfo = await googleCalendarService.getUserInfo(tokenInfo.access_token);

      const connection = await calendarConnectionsRepository.create({
        user_id,
        provider: 'google',
        provider_account_id: userInfo.email,
        access_token: tokenInfo.access_token,
        refresh_token: tokenInfo.refresh_token,
        token_expires_at: tokenInfo.expires_at,
        calendar_prefix: prefix,
        color_tag: color,
      });

      const calendars = await googleCalendarService.listCalendars(tokenInfo.access_token);

      for (const calendar of calendars) {
        if (calendar.id) {
          await calendarConnectionsRepository.createGoogleCalendar({
            connection_id: connection.id,
            google_calendar_id: calendar.id,
            calendar_name: calendar.summary || 'Unnamed Calendar',
            is_primary: calendar.primary || false,
            timezone: calendar.timeZone || 'UTC',
          });
        }
      }

      return reply.redirect(`${env.FRONTEND_URL}/dashboard/calendars?success=true`);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.redirect(`${env.FRONTEND_URL}/dashboard/calendars?error=true`);
    }
  });
};

export default authRoutes;
