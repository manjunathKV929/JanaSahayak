import type { FastifyInstance } from 'fastify';
import type { Queryable } from '@janasahayak/db';
import {
  addServiceSource,
  createServiceDraft,
  createServiceVersion,
  deprecateService,
  getServiceById,
  getServiceHistory,
  publishService,
  queryAuditLogs,
  recordAuditLog,
  recordContentReview,
  transitionServiceStatus,
  updateService,
} from '@janasahayak/db';
import type { ApiErrorDetail } from '@janasahayak/types';
import {
  auditLogQuerySchema,
  createServiceSchema,
  createServiceSourceSchema,
  createServiceVersionSchema,
  publishServiceSchema,
  reviewDecisionSchema,
  submitReviewSchema,
  updateServiceSchema,
  uuidSchema,
} from '@janasahayak/validation';
import type { z } from 'zod';
import { AppError, buildSuccessResponse } from '../errors.js';
import { authenticateAdmin, requireRole } from '../middleware/rbac.js';

export interface AdminRoutesOptions {
  db: Queryable;
  isProduction: boolean;
}

function formatZodIssues(issues: z.ZodIssue[]): ApiErrorDetail[] {
  return issues.map((issue) => {
    const detail: ApiErrorDetail = {
      message: issue.message,
    };
    if (issue.path.length > 0) {
      detail.field = issue.path.join('.');
    }
    return detail;
  });
}

const metaJsonSchema = {
  type: 'object',
  required: ['requestId'],
  properties: {
    requestId: { type: 'string' },
  },
} as const;

const serviceRecordJsonSchema = {
  type: 'object',
  required: [
    'id',
    'slug',
    'serviceType',
    'title',
    'shortDescription',
    'departmentName',
    'status',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    slug: { type: 'string' },
    serviceType: { type: 'string' },
    title: { type: 'string' },
    shortDescription: { type: 'string' },
    departmentName: { type: 'string' },
    stateCode: { type: ['string', 'null'] },
    status: {
      type: 'string',
      enum: ['DRAFT', 'IN_REVIEW', 'VERIFIED', 'PUBLISHED', 'REVIEW_DUE', 'DEPRECATED', 'REJECTED'],
    },
    currentVersionId: { type: ['string', 'null'], format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export async function registerAdminRoutes(
  app: FastifyInstance,
  options: AdminRoutesOptions,
): Promise<void> {
  const { db, isProduction } = options;
  const authHook = authenticateAdmin(isProduction);

  // 1. POST /admin/services - Create draft
  app.post(
    '/admin/services',
    {
      preHandler: [authHook, requireRole(['CONTENT_EDITOR', 'ADMIN'])],
      schema: {
        tags: ['Admin Content'],
        summary: 'Create a new service draft',
        description: 'Creates a service record with DRAFT status and records an audit log.',
        body: {
          type: 'object',
          required: ['slug', 'serviceType', 'title', 'shortDescription', 'departmentName'],
          properties: {
            slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
            serviceType: { type: 'string', minLength: 2, maxLength: 50 },
            title: { type: 'string', minLength: 3, maxLength: 255 },
            shortDescription: { type: 'string', minLength: 10, maxLength: 1000 },
            departmentName: { type: 'string', minLength: 2, maxLength: 255 },
            stateCode: { type: 'string', pattern: '^[A-Z]{2}$', nullable: true },
          },
        },
        response: {
          201: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: serviceRecordJsonSchema,
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = createServiceSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid service creation payload.',
          formatZodIssues(parsed.error.issues),
        );
      }

      const service = await createServiceDraft(db, parsed.data);

      await recordAuditLog(db, {
        actorId: request.actor?.id ?? null,
        action: 'SERVICE_CREATE',
        resourceType: 'service',
        resourceId: service.id,
        metadata: {
          slug: service.slug,
          title: service.title,
          serviceType: service.serviceType,
        },
      });

      return reply.code(201).send(buildSuccessResponse(service, { requestId: request.id }));
    },
  );

  // 2. PATCH /admin/services/:id - Update service
  app.patch(
    '/admin/services/:id',
    {
      preHandler: [authHook, requireRole(['CONTENT_EDITOR', 'ADMIN'])],
      schema: {
        tags: ['Admin Content'],
        summary: 'Update service details',
        description: 'Updates service metadata and records an audit log.',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: serviceRecordJsonSchema,
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const idParsed = uuidSchema.safeParse(params.id);
      if (!idParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid service ID.');
      }

      const parsed = updateServiceSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid service update payload.',
          formatZodIssues(parsed.error.issues),
        );
      }

      const existing = await getServiceById(db, idParsed.data);
      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Service not found.');
      }

      const updated = await updateService(db, idParsed.data, parsed.data);
      if (!updated) {
        throw new AppError(404, 'NOT_FOUND', 'Service not found.');
      }

      await recordAuditLog(db, {
        actorId: request.actor?.id ?? null,
        action: 'SERVICE_UPDATE',
        resourceType: 'service',
        resourceId: updated.id,
        metadata: { changes: parsed.data as Record<string, unknown> },
      });

      return reply.send(buildSuccessResponse(updated, { requestId: request.id }));
    },
  );

  // 3. POST /admin/services/:id/versions - Create version
  app.post(
    '/admin/services/:id/versions',
    {
      preHandler: [authHook, requireRole(['CONTENT_EDITOR', 'ADMIN'])],
      schema: {
        tags: ['Admin Content'],
        summary: 'Create a new content version for a service',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          201: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: [
                  'id',
                  'serviceId',
                  'versionNumber',
                  'content',
                  'language',
                  'createdBy',
                  'createdAt',
                ],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  serviceId: { type: 'string', format: 'uuid' },
                  versionNumber: { type: 'integer' },
                  content: { type: 'object' },
                  language: { type: 'string' },
                  effectiveFrom: { type: ['string', 'null'] },
                  effectiveTo: { type: ['string', 'null'] },
                  createdBy: { type: 'string', format: 'uuid' },
                  approvedBy: { type: ['string', 'null'], format: 'uuid' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const idParsed = uuidSchema.safeParse(params.id);
      if (!idParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid service ID.');
      }

      const parsed = createServiceVersionSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid version payload.',
          formatZodIssues(parsed.error.issues),
        );
      }

      const service = await getServiceById(db, idParsed.data);
      if (!service) {
        throw new AppError(404, 'NOT_FOUND', 'Service not found.');
      }

      const actorId = request.actor?.id ?? '00000000-0000-0000-0000-000000000001';
      const version = await createServiceVersion(db, idParsed.data, parsed.data, actorId);

      await recordAuditLog(db, {
        actorId,
        action: 'SERVICE_VERSION_CREATE',
        resourceType: 'service_version',
        resourceId: version.id,
        metadata: {
          serviceId: service.id,
          versionNumber: version.versionNumber,
          language: version.language,
        },
      });

      return reply.code(201).send(buildSuccessResponse(version, { requestId: request.id }));
    },
  );

  // 4. POST /admin/services/:id/sources - Add source metadata
  app.post(
    '/admin/services/:id/sources',
    {
      preHandler: [authHook, requireRole(['CONTENT_EDITOR', 'ADMIN'])],
      schema: {
        tags: ['Admin Content'],
        summary: 'Add official source metadata to a service',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          201: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: [
                  'id',
                  'serviceId',
                  'sourceUrl',
                  'sourceType',
                  'publisher',
                  'verificationStatus',
                  'retrievedAt',
                  'lastVerifiedAt',
                ],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  serviceId: { type: 'string', format: 'uuid' },
                  sourceUrl: { type: 'string', format: 'uri' },
                  sourceType: { type: 'string' },
                  publisher: { type: 'string' },
                  verificationStatus: { type: 'string' },
                  reviewNotes: { type: ['string', 'null'] },
                  retrievedAt: { type: 'string', format: 'date-time' },
                  lastVerifiedAt: { type: 'string', format: 'date-time' },
                },
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const idParsed = uuidSchema.safeParse(params.id);
      if (!idParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid service ID.');
      }

      const parsed = createServiceSourceSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid source payload.',
          formatZodIssues(parsed.error.issues),
        );
      }

      const service = await getServiceById(db, idParsed.data);
      if (!service) {
        throw new AppError(404, 'NOT_FOUND', 'Service not found.');
      }

      const source = await addServiceSource(db, idParsed.data, parsed.data);

      await recordAuditLog(db, {
        actorId: request.actor?.id ?? null,
        action: 'SERVICE_SOURCE_ADD',
        resourceType: 'service_source',
        resourceId: source.id,
        metadata: {
          serviceId: service.id,
          sourceUrl: source.sourceUrl,
          publisher: source.publisher,
        },
      });

      return reply.code(201).send(buildSuccessResponse(source, { requestId: request.id }));
    },
  );

  // 5. POST /admin/services/:id/submit-review - Submit for review
  app.post(
    '/admin/services/:id/submit-review',
    {
      preHandler: [authHook, requireRole(['CONTENT_EDITOR', 'ADMIN'])],
      schema: {
        tags: ['Admin Content'],
        summary: 'Submit a service draft for review',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: serviceRecordJsonSchema,
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const idParsed = uuidSchema.safeParse(params.id);
      if (!idParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid service ID.');
      }

      const parsed = submitReviewSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid submit-review payload.');
      }

      const service = await getServiceById(db, idParsed.data);
      if (!service) {
        throw new AppError(404, 'NOT_FOUND', 'Service not found.');
      }

      if (
        service.status !== 'DRAFT' &&
        service.status !== 'REJECTED' &&
        service.status !== 'REVIEW_DUE'
      ) {
        throw new AppError(
          409,
          'CONFLICT',
          `Cannot submit service in status '${service.status}' for review. Must be DRAFT, REJECTED, or REVIEW_DUE.`,
        );
      }

      const updated = await transitionServiceStatus(db, idParsed.data, 'IN_REVIEW');
      if (!updated) {
        throw new AppError(500, 'INTERNAL_ERROR', 'Failed to update service status.');
      }

      await recordAuditLog(db, {
        actorId: request.actor?.id ?? null,
        action: 'SERVICE_SUBMIT_REVIEW',
        resourceType: 'service',
        resourceId: updated.id,
        metadata: {
          previousStatus: service.status,
          newStatus: 'IN_REVIEW',
          notes: parsed.data.notes ?? null,
        },
      });

      return reply.send(buildSuccessResponse(updated, { requestId: request.id }));
    },
  );

  // 6. POST /admin/services/:id/review - Record review decision
  app.post(
    '/admin/services/:id/review',
    {
      preHandler: [authHook, requireRole(['CONTENT_REVIEWER', 'ADMIN'])],
      schema: {
        tags: ['Admin Content'],
        summary: 'Record review decision for a service',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['decision'],
          properties: {
            decision: { type: 'string', enum: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'] },
            notes: { type: 'string', maxLength: 2000 },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: ['service', 'review'],
                properties: {
                  service: serviceRecordJsonSchema,
                  review: {
                    type: 'object',
                    required: ['id', 'serviceId', 'decision', 'reviewedAt'],
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      serviceId: { type: 'string', format: 'uuid' },
                      reviewerId: { type: ['string', 'null'], format: 'uuid' },
                      decision: { type: 'string' },
                      notes: { type: ['string', 'null'] },
                      reviewedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const idParsed = uuidSchema.safeParse(params.id);
      if (!idParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid service ID.');
      }

      const parsed = reviewDecisionSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid review decision payload.',
          formatZodIssues(parsed.error.issues),
        );
      }

      const service = await getServiceById(db, idParsed.data);
      if (!service) {
        throw new AppError(404, 'NOT_FOUND', 'Service not found.');
      }

      const reviewerId = request.actor?.id ?? null;
      const review = await recordContentReview(db, {
        serviceId: idParsed.data,
        reviewerId,
        decision: parsed.data.decision,
        notes: parsed.data.notes ?? null,
      });

      let nextStatus = service.status;
      if (parsed.data.decision === 'APPROVED') {
        nextStatus = 'VERIFIED';
      } else if (parsed.data.decision === 'REJECTED') {
        nextStatus = 'REJECTED';
      } else if (parsed.data.decision === 'CHANGES_REQUESTED') {
        nextStatus = 'DRAFT';
      }

      const updated = await transitionServiceStatus(db, idParsed.data, nextStatus);

      await recordAuditLog(db, {
        actorId: reviewerId,
        action: 'SERVICE_REVIEW_DECISION',
        resourceType: 'service',
        resourceId: service.id,
        metadata: {
          decision: parsed.data.decision,
          notes: parsed.data.notes ?? null,
          resultingStatus: nextStatus,
        },
      });

      return reply.send(
        buildSuccessResponse({ service: updated ?? service, review }, { requestId: request.id }),
      );
    },
  );

  // 7. POST /admin/services/:id/publish - Publish service
  app.post(
    '/admin/services/:id/publish',
    {
      preHandler: [authHook, requireRole(['CONTENT_REVIEWER', 'ADMIN'])],
      schema: {
        tags: ['Admin Content'],
        summary: 'Publish verified service',
        description:
          'Publishes a verified service record, linking current version and updating audit trail.',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: serviceRecordJsonSchema,
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const idParsed = uuidSchema.safeParse(params.id);
      if (!idParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid service ID.');
      }

      const parsed = publishServiceSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid publish payload.');
      }

      const service = await getServiceById(db, idParsed.data);
      if (!service) {
        throw new AppError(404, 'NOT_FOUND', 'Service not found.');
      }

      // Security check: Must be VERIFIED (or already PUBLISHED for version update)
      if (service.status !== 'VERIFIED' && service.status !== 'PUBLISHED') {
        throw new AppError(
          409,
          'CONFLICT',
          `Cannot publish service in status '${service.status}'. Service must be reviewed and VERIFIED before publication.`,
        );
      }

      const actorId = request.actor?.id ?? '00000000-0000-0000-0000-000000000002';
      const published = await publishService(db, idParsed.data, actorId, parsed.data.versionId);
      if (!published) {
        throw new AppError(500, 'INTERNAL_ERROR', 'Failed to publish service.');
      }

      await recordAuditLog(db, {
        actorId,
        action: 'SERVICE_PUBLISH',
        resourceType: 'service',
        resourceId: published.id,
        metadata: {
          versionId: published.currentVersionId,
          previousStatus: service.status,
          status: 'PUBLISHED',
        },
      });

      return reply.send(buildSuccessResponse(published, { requestId: request.id }));
    },
  );

  // 8. POST /admin/services/:id/deprecate - Deprecate service
  app.post(
    '/admin/services/:id/deprecate',
    {
      preHandler: [authHook, requireRole(['CONTENT_REVIEWER', 'ADMIN'])],
      schema: {
        tags: ['Admin Content'],
        summary: 'Deprecate a service',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: serviceRecordJsonSchema,
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const idParsed = uuidSchema.safeParse(params.id);
      if (!idParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid service ID.');
      }

      const service = await getServiceById(db, idParsed.data);
      if (!service) {
        throw new AppError(404, 'NOT_FOUND', 'Service not found.');
      }

      const deprecated = await deprecateService(db, idParsed.data);
      if (!deprecated) {
        throw new AppError(500, 'INTERNAL_ERROR', 'Failed to deprecate service.');
      }

      await recordAuditLog(db, {
        actorId: request.actor?.id ?? null,
        action: 'SERVICE_DEPRECATE',
        resourceType: 'service',
        resourceId: deprecated.id,
        metadata: {
          previousStatus: service.status,
          status: 'DEPRECATED',
        },
      });

      return reply.send(buildSuccessResponse(deprecated, { requestId: request.id }));
    },
  );

  // 9. GET /admin/services/:id/history - Versions & Reviews history
  app.get(
    '/admin/services/:id/history',
    {
      preHandler: [
        authHook,
        requireRole(['CONTENT_EDITOR', 'CONTENT_REVIEWER', 'ADMIN', 'SECURITY_ADMIN']),
      ],
      schema: {
        tags: ['Admin Content'],
        summary: 'Get version and review history for a service',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: ['versions', 'reviews'],
                properties: {
                  versions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: [
                        'id',
                        'serviceId',
                        'versionNumber',
                        'content',
                        'language',
                        'createdBy',
                        'createdAt',
                      ],
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        serviceId: { type: 'string', format: 'uuid' },
                        versionNumber: { type: 'integer' },
                        content: { type: 'object' },
                        language: { type: 'string' },
                        effectiveFrom: { type: ['string', 'null'] },
                        effectiveTo: { type: ['string', 'null'] },
                        createdBy: { type: 'string', format: 'uuid' },
                        approvedBy: { type: ['string', 'null'], format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                  reviews: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'serviceId', 'decision', 'reviewedAt'],
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        serviceId: { type: 'string', format: 'uuid' },
                        reviewerId: { type: ['string', 'null'], format: 'uuid' },
                        decision: { type: 'string' },
                        notes: { type: ['string', 'null'] },
                        reviewedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const idParsed = uuidSchema.safeParse(params.id);
      if (!idParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid service ID.');
      }

      const service = await getServiceById(db, idParsed.data);
      if (!service) {
        throw new AppError(404, 'NOT_FOUND', 'Service not found.');
      }

      const history = await getServiceHistory(db, idParsed.data);
      return reply.send(buildSuccessResponse(history, { requestId: request.id }));
    },
  );

  // 10. GET /admin/audit-logs - Query audit trail
  app.get(
    '/admin/audit-logs',
    {
      preHandler: [authHook, requireRole(['ADMIN', 'SECURITY_ADMIN'])],
      schema: {
        tags: ['Admin Content'],
        summary: 'Query immutable audit log trail',
        querystring: {
          type: 'object',
          properties: {
            actorId: { type: 'string', format: 'uuid' },
            resourceType: { type: 'string' },
            resourceId: { type: 'string', format: 'uuid' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'action', 'resourceType', 'metadata', 'createdAt'],
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    actorId: { type: ['string', 'null'], format: 'uuid' },
                    action: { type: 'string' },
                    resourceType: { type: 'string' },
                    resourceId: { type: ['string', 'null'], format: 'uuid' },
                    metadata: { type: 'object' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = auditLogQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid audit log query parameters.',
          formatZodIssues(parsed.error.issues),
        );
      }

      const logs = await queryAuditLogs(db, parsed.data);
      return reply.send(buildSuccessResponse(logs, { requestId: request.id }));
    },
  );
}
