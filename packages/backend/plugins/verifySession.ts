import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { isLoginDisabled } from '@utils';

function verifySession(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
) {
  const disableLogin = isLoginDisabled();
  if (disableLogin) {
    return done();
  }

  const isAuthenticated = Boolean(request.session.get('authenticated'));
  if (!isAuthenticated) {
    reply.status(401).send();
    return done();
  }

  return done();
}

const plugin = async (fastify: FastifyInstance) => {
  fastify.decorate('verifySession', verifySession);
};

export const fastifyVerifySession = fastifyPlugin(plugin, {
  fastify: '3.x',
  name: 'fastify-verify-session',
});

declare module 'fastify' {
  interface FastifyInstance {
    verifySession: typeof verifySession;
  }
}
