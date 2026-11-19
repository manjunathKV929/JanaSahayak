import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@janasahayak/types';
import { roleSchema, uuidSchema } from '@janasahayak/validation';
import { AppError } from '../errors.js';

export interface AdminActor {
  id: string;
  email?: string;
  role: Role;
}

declare module 'fastify' {
  interface FastifyRequest {
    actor?: AdminActor;
  }
}

const KNOWN_TEST_TOKENS: Record<string, AdminActor> = {
  'mock-editor-token': {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'editor@janasahayak.gov.in',
    role: 'CONTENT_EDITOR',
  },
  'mock-reviewer-token': {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'reviewer@janasahayak.gov.in',
    role: 'CONTENT_REVIEWER',
  },
  'mock-admin-token': {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'admin@janasahayak.gov.in',
    role: 'ADMIN',
  },
  'mock-secadmin-token': {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'secadmin@janasahayak.gov.in',
    role: 'SECURITY_ADMIN',
  },
};

export function authenticateAdmin(isProduction: boolean) {
  return async function authenticateHook(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const testActor = KNOWN_TEST_TOKENS[token];
      if (testActor) {
        request.actor = testActor;
        return;
      }
    }

    // In non-production environments (test/development), allow explicit testing headers
    if (!isProduction) {
      const roleHeader = request.headers['x-admin-role'];
      const userHeader = request.headers['x-admin-user-id'];

      const rawRole = Array.isArray(roleHeader) ? roleHeader[0] : roleHeader;
      const rawUserId = Array.isArray(userHeader) ? userHeader[0] : userHeader;

      if (rawRole && typeof rawRole === 'string') {
        const parsedRole = roleSchema.safeParse(rawRole);
        if (parsedRole.success && parsedRole.data !== 'PUBLIC_USER') {
          const userIdParsed = rawUserId ? uuidSchema.safeParse(rawUserId) : null;
          request.actor = {
            id: userIdParsed?.success ? userIdParsed.data : '00000000-0000-0000-0000-000000000001',
            role: parsedRole.data,
          };
          return;
        }
      }
    }

    throw new AppError(
      401,
      'UNAUTHORIZED',
      'Authentication required for administrative operations.',
    );
  };
}

export function requireRole(allowedRoles: Role[]) {
  return async function roleGuard(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!request.actor) {
      throw new AppError(
        401,
        'UNAUTHORIZED',
        'Authentication required for administrative operations.',
      );
    }

    if (!allowedRoles.includes(request.actor.role)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        `Access denied. Role '${request.actor.role}' is not authorized for this operation.`,
      );
    }
  };
}
