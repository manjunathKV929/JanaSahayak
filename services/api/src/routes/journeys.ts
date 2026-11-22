import type { FastifyInstance } from 'fastify';
import type { Queryable } from '@janasahayak/db';
import {
  createOrResumeUserJourney,
  getUserJourneyInstance,
  completeUserJourneyStep,
  DEFAULT_ANONYMOUS_USER_ID,
} from '@janasahayak/db';
import {
  startJourneyParamSchema,
  startJourneyBodySchema,
  getJourneyParamSchema,
  getJourneyQuerySchema,
  completeJourneyStepParamSchema,
  completeJourneyStepBodySchema,
  evaluateStepCompletion,
  computeJourneyProgress,
} from '@janasahayak/validation';
import type {
  JourneyStepRecord,
  UserJourneyDetail,
  UserJourneyProgressRecord,
} from '@janasahayak/types';
import { AppError, buildSuccessResponse } from '../errors.js';

export interface JourneysRouteOptions {
  db: Queryable;
}

const metaJsonSchema = {
  type: 'object',
  required: ['requestId'],
  properties: {
    requestId: { type: 'string' },
  },
} as const;

const journeyStepJsonSchema = {
  type: 'object',
  required: [
    'id',
    'journeyId',
    'stepKey',
    'title',
    'description',
    'stepType',
    'displayOrder',
    'status',
    'isNextStep',
    'canComplete',
  ],
  properties: {
    id: { type: 'string' },
    journeyId: { type: 'string' },
    stepKey: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'object', additionalProperties: { type: 'string' } },
    stepType: { type: 'string' },
    displayOrder: { type: 'integer' },
    officialUrl: { type: ['string', 'null'] },
    completionRule: { type: ['object', 'null'] },
    status: { type: 'string' },
    completedAt: { type: ['string', 'null'] },
    isNextStep: { type: 'boolean' },
    canComplete: { type: 'boolean' },
  },
} as const;

const journeyProgressJsonSchema = {
  type: 'object',
  required: ['totalSteps', 'completedSteps', 'currentStepIndex', 'percentage', 'status'],
  properties: {
    totalSteps: { type: 'integer' },
    completedSteps: { type: 'integer' },
    currentStepIndex: { type: 'integer' },
    percentage: { type: 'integer' },
    status: { type: 'string' },
    nextStep: {
      type: ['object', 'null'],
      properties: journeyStepJsonSchema.properties,
    },
  },
} as const;

const userJourneyDetailJsonSchema = {
  type: 'object',
  required: [
    'id',
    'serviceId',
    'serviceSlug',
    'serviceTitle',
    'journeyTemplateId',
    'title',
    'description',
    'status',
    'progress',
    'steps',
  ],
  properties: {
    id: { type: 'string' },
    serviceId: { type: 'string' },
    serviceSlug: { type: 'string' },
    serviceTitle: { type: 'string' },
    journeyTemplateId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string' },
    progress: journeyProgressJsonSchema,
    steps: {
      type: 'array',
      items: journeyStepJsonSchema,
    },
    nextStep: {
      type: ['object', 'null'],
      properties: journeyStepJsonSchema.properties,
    },
  },
} as const;

export async function registerJourneysRoutes(
  app: FastifyInstance,
  options: JourneysRouteOptions,
): Promise<void> {
  const { db } = options;

  // POST /services/:id/journeys
  app.post(
    '/services/:id/journeys',
    {
      schema: {
        description: 'Create or resume an active personalized application journey for a service',
        tags: ['Journeys'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Service UUID or unique slug',
            },
          },
        },
        body: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Optional registered user ID. If omitted, uses anonymous session ID.',
            },
            anonymousSessionId: {
              type: 'string',
              description: 'Optional anonymous client session identifier',
            },
          },
        },
        response: {
          200: {
            description: 'Journey instance created or resumed successfully',
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: userJourneyDetailJsonSchema,
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsedParam = startJourneyParamSchema.safeParse(request.params);
      if (!parsedParam.success) {
        throw new AppError(
          400,
          'BAD_REQUEST',
          parsedParam.error.issues[0]?.message ?? 'Invalid service identifier',
        );
      }

      const parsedBody = startJourneyBodySchema.safeParse(request.body ?? {});
      if (!parsedBody.success) {
        throw new AppError(
          400,
          'BAD_REQUEST',
          parsedBody.error.issues[0]?.message ?? 'Invalid request body',
        );
      }

      const userId = parsedBody.data?.userId ?? DEFAULT_ANONYMOUS_USER_ID;
      const bundle = await createOrResumeUserJourney(db, parsedParam.data.id, userId);

      if (!bundle) {
        throw new AppError(
          404,
          'NOT_FOUND',
          `Service or journey template not found for "${parsedParam.data.id}".`,
        );
      }

      const completedStepIds = new Set(
        bundle.progressRecords
          .filter((p: UserJourneyProgressRecord) => p.status === 'COMPLETED')
          .map((p: UserJourneyProgressRecord) => p.stepId),
      );

      const { progress, stepsWithProgress, nextStep } = computeJourneyProgress(
        bundle.steps,
        completedStepIds,
      );

      const detail: UserJourneyDetail = {
        id: bundle.userJourney.id,
        serviceId: bundle.service.id,
        serviceSlug: bundle.service.slug,
        serviceTitle: bundle.service.title,
        journeyTemplateId: bundle.journey.id,
        title: bundle.journey.title,
        description: bundle.journey.description,
        status: bundle.userJourney.status,
        progress,
        steps: stepsWithProgress,
        nextStep,
      };

      return reply.code(200).send(buildSuccessResponse(detail, { requestId: request.id }));
    },
  );

  // GET /journeys/:id
  app.get(
    '/journeys/:id',
    {
      schema: {
        description:
          'Retrieve journey progress, ordered steps, and current next-step recommendation',
        tags: ['Journeys'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'User journey instance UUID, template journey UUID, or service slug',
            },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Optional user UUID to query private progress',
            },
          },
        },
        response: {
          200: {
            description: 'Journey progress retrieved successfully',
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: userJourneyDetailJsonSchema,
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsedParam = getJourneyParamSchema.safeParse(request.params);
      if (!parsedParam.success) {
        throw new AppError(
          400,
          'BAD_REQUEST',
          parsedParam.error.issues[0]?.message ?? 'Invalid journey identifier',
        );
      }

      const parsedQuery = getJourneyQuerySchema.safeParse(request.query ?? {});
      const userId =
        parsedQuery.success && parsedQuery.data?.userId
          ? parsedQuery.data.userId
          : DEFAULT_ANONYMOUS_USER_ID;

      const bundle = await getUserJourneyInstance(db, parsedParam.data.id, userId);
      if (!bundle) {
        throw new AppError(
          404,
          'NOT_FOUND',
          `Journey not found for identifier "${parsedParam.data.id}".`,
        );
      }

      const completedStepIds = new Set(
        bundle.progressRecords
          .filter((p: UserJourneyProgressRecord) => p.status === 'COMPLETED')
          .map((p: UserJourneyProgressRecord) => p.stepId),
      );

      const { progress, stepsWithProgress, nextStep } = computeJourneyProgress(
        bundle.steps,
        completedStepIds,
      );

      const detail: UserJourneyDetail = {
        id: bundle.userJourney.id,
        serviceId: bundle.service.id,
        serviceSlug: bundle.service.slug,
        serviceTitle: bundle.service.title,
        journeyTemplateId: bundle.journey.id,
        title: bundle.journey.title,
        description: bundle.journey.description,
        status: bundle.userJourney.status,
        progress,
        steps: stepsWithProgress,
        nextStep,
      };

      return reply.code(200).send(buildSuccessResponse(detail, { requestId: request.id }));
    },
  );

  // POST /journeys/:id/steps/:stepId/complete
  app.post(
    '/journeys/:id/steps/:stepId/complete',
    {
      schema: {
        description:
          'Mark a journey step complete after validating prerequisites and completion rules',
        tags: ['Journeys'],
        params: {
          type: 'object',
          required: ['id', 'stepId'],
          properties: {
            id: {
              type: 'string',
              description: 'Journey instance UUID or template UUID',
            },
            stepId: {
              type: 'string',
              description: 'Step UUID or unique step key',
            },
          },
        },
        body: {
          type: 'object',
          properties: {
            confirmation: {
              type: 'boolean',
              description: 'Explicit confirmation flag',
            },
            referenceNumber: {
              type: 'string',
              description: 'Official application reference or acknowledgement number',
            },
            notes: {
              type: 'string',
              description: 'Optional citizen note',
            },
          },
        },
        response: {
          200: {
            description: 'Step marked complete and progress advanced successfully',
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: userJourneyDetailJsonSchema,
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsedParams = completeJourneyStepParamSchema.safeParse(request.params);
      if (!parsedParams.success) {
        throw new AppError(
          400,
          'BAD_REQUEST',
          parsedParams.error.issues[0]?.message ?? 'Invalid journey or step parameters',
        );
      }

      const parsedBody = completeJourneyStepBodySchema.safeParse(request.body ?? {});
      if (!parsedBody.success) {
        throw new AppError(
          400,
          'BAD_REQUEST',
          parsedBody.error.issues[0]?.message ?? 'Invalid request body',
        );
      }

      const { id, stepId } = parsedParams.data;
      const userId = DEFAULT_ANONYMOUS_USER_ID;

      // 1. Fetch current journey state
      const bundle = await getUserJourneyInstance(db, id, userId);
      if (!bundle) {
        throw new AppError(404, 'NOT_FOUND', `Journey "${id}" not found.`);
      }

      // 2. Resolve target step
      const targetStep = bundle.steps.find(
        (s: JourneyStepRecord) => s.id === stepId || s.stepKey === stepId,
      );
      if (!targetStep) {
        throw new AppError(
          404,
          'NOT_FOUND',
          `Step "${stepId}" does not exist in journey "${bundle.journey.title}".`,
        );
      }

      // 3. Evaluate completion prerequisites
      const completedStepIds = new Set(
        bundle.progressRecords
          .filter((p: UserJourneyProgressRecord) => p.status === 'COMPLETED')
          .map((p: UserJourneyProgressRecord) => p.stepId),
      );

      const evalResult = evaluateStepCompletion({
        step: targetStep,
        allSteps: bundle.steps,
        completedStepIds,
        body: parsedBody.data,
      });

      if (!evalResult.canComplete) {
        throw new AppError(
          422,
          'UNPROCESSABLE_ENTITY',
          evalResult.reason ?? 'Step completion prerequisites not satisfied.',
        );
      }

      // 4. Record step completion in database
      const updatedBundle = await completeUserJourneyStep(
        db,
        bundle.userJourney.id,
        targetStep.id,
        bundle.userJourney.userId,
      );

      if (!updatedBundle) {
        throw new AppError(500, 'INTERNAL_ERROR', 'Failed to update journey step completion.');
      }

      const updatedCompletedStepIds = new Set(
        updatedBundle.progressRecords
          .filter((p: UserJourneyProgressRecord) => p.status === 'COMPLETED')
          .map((p: UserJourneyProgressRecord) => p.stepId),
      );

      const { progress, stepsWithProgress, nextStep } = computeJourneyProgress(
        updatedBundle.steps,
        updatedCompletedStepIds,
      );

      const detail: UserJourneyDetail = {
        id: updatedBundle.userJourney.id,
        serviceId: updatedBundle.service.id,
        serviceSlug: updatedBundle.service.slug,
        serviceTitle: updatedBundle.service.title,
        journeyTemplateId: updatedBundle.journey.id,
        title: updatedBundle.journey.title,
        description: updatedBundle.journey.description,
        status: updatedBundle.userJourney.status,
        progress,
        steps: stepsWithProgress,
        nextStep,
      };

      return reply.code(200).send(buildSuccessResponse(detail, { requestId: request.id }));
    },
  );
}
