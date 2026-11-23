import type { FastifyInstance } from 'fastify';
import { scanFamilyEligibility } from '@janasahayak/db';
import { familyScanRequestSchema } from '@janasahayak/validation';
import { AppError, buildSuccessResponse } from '../errors.js';

const metaJsonSchema = {
  type: 'object',
  required: ['requestId'],
  properties: {
    requestId: { type: 'string' },
  },
} as const;

export async function registerFamilyRoutes(app: FastifyInstance): Promise<void> {
  // POST /family/scan
  app.post(
    '/family/scan',
    {
      schema: {
        description: 'Privacy-first multi-member family eligibility evaluation engine',
        tags: ['Family'],
        body: {
          type: 'object',
          required: ['members'],
          properties: {
            members: {
              type: 'array',
              minItems: 1,
              maxItems: 15,
              items: {
                type: 'object',
                required: ['name', 'relationship', 'age', 'gender'],
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string', minLength: 1, maxLength: 100 },
                  relationship: {
                    type: 'string',
                    enum: ['SELF', 'SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'GRANDPARENT', 'OTHER'],
                  },
                  age: { type: 'integer', minimum: 0, maximum: 120 },
                  gender: {
                    type: 'string',
                    enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
                  },
                  occupation: { type: 'string', maxLength: 100 },
                  educationLevel: { type: 'string', maxLength: 100 },
                  annualIncome: { type: 'number', minimum: 0, nullable: true },
                  casteCategory: { type: 'string', maxLength: 50, nullable: true },
                  disability: { type: 'boolean' },
                  residenceState: { type: 'string', maxLength: 10 },
                },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: ['results', 'scannedCount', 'totalEligibleFound', 'privacyDisclaimer'],
                properties: {
                  results: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['memberId', 'memberName', 'relationship', 'eligibleServices'],
                      properties: {
                        memberId: { type: 'string' },
                        memberName: { type: 'string' },
                        relationship: { type: 'string' },
                        eligibleServices: {
                          type: 'array',
                          items: {
                            type: 'object',
                            required: [
                              'serviceId',
                              'slug',
                              'title',
                              'category',
                              'departmentName',
                              'reason',
                              'confidence',
                            ],
                            properties: {
                              serviceId: { type: 'string' },
                              slug: { type: 'string' },
                              title: { type: 'string' },
                              category: { type: 'string' },
                              departmentName: { type: 'string' },
                              reason: { type: 'string' },
                              confidence: {
                                type: 'string',
                                enum: ['POTENTIALLY_ELIGIBLE', 'CHECK_REQUIRED'],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  scannedCount: { type: 'integer' },
                  totalEligibleFound: { type: 'integer' },
                  privacyDisclaimer: { type: 'string' },
                },
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request) => {
      const parsed = familyScanRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'The family scan request is invalid.',
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        );
      }
      const scanResult = scanFamilyEligibility(parsed.data.members);
      return buildSuccessResponse(scanResult, { requestId: request.id });
    },
  );
}
