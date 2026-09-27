import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  id: string;
  schoolId: string | null;
  role: UserRole;
  identifier: string;
  fullName: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorizeRoles: (...allowedRoles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

export async function setupAuth(fastify: FastifyInstance) {
  const secret = process.env.JWT_SECRET || 'examora_super_secret_jwt_default_dev';

  await fastify.register(fastifyJwt, {
    secret: secret,
    sign: {
      expiresIn: '7d',
    },
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        success: false,
        message: 'Akses ditolak: Token tidak valid atau kedaluwarsa.',
      });
    }
  });

  fastify.decorate('authorizeRoles', (...allowedRoles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      await fastify.authenticate(request, reply);
      if (reply.sent) return;

      const user = request.user as TokenPayload;
      if (!allowedRoles.includes(user.role)) {
        reply.status(403).send({
          success: false,
          message: 'Akses dilarang: Peran pengguna tidak memiliki hak akses.',
        });
      }
    };
  });
}
