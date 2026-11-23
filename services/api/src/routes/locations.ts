import type { FastifyInstance } from 'fastify';
import type { Queryable } from '@janasahayak/db';
import { getLocationsForService, listLocations } from '@janasahayak/db';
import { locationQuerySchema } from '@janasahayak/validation';
import { AppError, buildSuccessResponse } from '../errors.js';

export interface LocationsRouteOptions {
  db: Queryable;
}

const metaJsonSchema = {
  type: 'object',
  required: ['requestId'],
  properties: {
    requestId: { type: 'string' },
  },
} as const;

const locationItemSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'centerType',
    'address',
    'district',
    'stateCode',
    'isActive',
    'supportedServices',
  ],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    centerType: {
      type: 'string',
      enum: [
        'B1_K1_CENTRE',
        'NADAKACHERI',
        'TALUK_OFFICE',
        'DISTRICT_OFFICE',
        'SEVA_KENDRA',
        'OTHER',
      ],
    },
    address: { type: 'string' },
    district: { type: 'string' },
    taluk: { type: 'string', nullable: true },
    stateCode: { type: 'string' },
    pincode: { type: 'string', nullable: true },
    latitude: { type: 'number', nullable: true },
    longitude: { type: 'number', nullable: true },
    contactPhone: { type: 'string', nullable: true },
    operatingHours: { type: 'string', nullable: true },
    verifiedSourceUrl: { type: 'string', nullable: true },
    isActive: { type: 'boolean' },
    supportedServices: {
      type: 'array',
      items: {
        type: 'object',
        required: ['serviceId', 'serviceSlug', 'serviceTitle', 'assistanceType'],
        properties: {
          serviceId: { type: 'string' },
          serviceSlug: { type: 'string' },
          serviceTitle: { type: 'string' },
          assistanceType: { type: 'string' },
        },
      },
    },
  },
} as const;

export async function registerLocationsRoutes(
  app: FastifyInstance,
  options: LocationsRouteOptions,
): Promise<void> {
  const { db } = options;

  // GET /locations
  app.get(
    '/locations',
    {
      schema: {
        description: 'Discover nearby verified government service desks and citizen centers',
        tags: ['Locations'],
        querystring: {
          type: 'object',
          properties: {
            state: { type: 'string' },
            district: { type: 'string' },
            taluk: { type: 'string' },
            centerType: {
              type: 'string',
              enum: [
                'B1_K1_CENTRE',
                'NADAKACHERI',
                'TALUK_OFFICE',
                'DISTRICT_OFFICE',
                'SEVA_KENDRA',
                'OTHER',
              ],
            },
            pincode: { type: 'string' },
            serviceId: { type: 'string', format: 'uuid' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
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
                items: locationItemSchema,
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request) => {
      const parsed = locationQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'The request parameters are invalid.',
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        );
      }
      const locations = await listLocations(db, parsed.data);
      return buildSuccessResponse(locations, { requestId: request.id });
    },
  );

  // GET /services/:id/locations
  app.get(
    '/services/:id/locations',
    {
      schema: {
        description: 'Get verified physical service desks supporting this specific service',
        tags: ['Locations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: locationItemSchema,
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const locations = await getLocationsForService(db, id);
      return buildSuccessResponse(locations, { requestId: request.id });
    },
  );
}
