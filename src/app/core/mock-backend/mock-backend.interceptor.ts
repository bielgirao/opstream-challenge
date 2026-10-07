import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, mergeMap, Observable, of, throwError, timer } from 'rxjs';
import { AnswerValue, RawRequestSchema, SaveAnswerBody, SaveAnswerResponse } from '../models';
import { EndpointProfile, MOCK_BACKEND_CONFIG, MockBackendConfig } from './mock-config';
import { MockDb } from './mock-db';
import { MOCK_SCHEMAS } from './schemas.data';

const SCHEMAS = /^\/api\/schemas$/;
const DRAFT = /^\/api\/requests\/([^/]+)$/;
const ANSWER = /^\/api\/requests\/([^/]+)\/question\/([^/]+)$/;

type Outcome = HttpResponse<unknown> | HttpErrorResponse;

/**
 * Answers `/api/*` calls in the browser, so services use the real HttpClient and the
 * contract URLs (ADR-0004). Every other request passes through untouched.
 *
 * - GET  /api/schemas                              → both schemas
 * - GET  /api/requests/:id                         → saved draft, or 404 (contract extension, ADR-0008)
 * - PUT  /api/requests/:id/question/:questionId    → upserts one answer
 */
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const path = new URL(req.url, 'http://mock.local').pathname;
  if (!path.startsWith('/api/')) return next(req);
  return handle(req, path, inject(MOCK_BACKEND_CONFIG), inject(MockDb));
};

function handle(
  req: HttpRequest<unknown>,
  path: string,
  config: MockBackendConfig,
  db: MockDb,
): Observable<HttpEvent<unknown>> {
  if (req.method === 'GET' && SCHEMAS.test(path)) {
    return simulate(req, config, config.getSchemas, () => ok(req, structuredClone(MOCK_SCHEMAS)));
  }

  const draftMatch = req.method === 'GET' ? DRAFT.exec(path) : null;
  if (draftMatch) {
    const requestId = decodeURIComponent(draftMatch[1]);
    return simulate(req, config, config.getDraft, () => {
      const draft = db.getDraft(requestId);
      return draft ? ok(req, draft) : error(req, 404, `Request ${requestId} not found`);
    });
  }

  const answerMatch = req.method === 'PUT' ? ANSWER.exec(path) : null;
  if (answerMatch) {
    const requestId = decodeURIComponent(answerMatch[1]);
    const questionId = decodeURIComponent(answerMatch[2]);
    return simulate(req, config, config.saveAnswer, () =>
      saveAnswer(req, db, requestId, questionId),
    );
  }

  return simulate(req, config, { latencyMs: [0, 0], failureRate: 0 }, () =>
    error(req, 404, `No mock for ${req.method} ${path}`),
  );
}

function saveAnswer(
  req: HttpRequest<unknown>,
  db: MockDb,
  requestId: string,
  questionId: string,
): Outcome {
  const body = req.body as Partial<SaveAnswerBody> | null;
  if (!body || typeof body.schemaId !== 'string' || !isAnswerValue(body.value)) {
    return error(
      req,
      400,
      'Body must be { schemaId: string, value: string | number | boolean | null }',
    );
  }

  const schema = MOCK_SCHEMAS.find((s) => s.id === body.schemaId);
  if (!schema) return error(req, 404, `Schema ${body.schemaId} not found`);
  if (!hasQuestion(schema, questionId)) {
    return error(req, 400, `Question ${questionId} is not part of ${schema.id}`);
  }

  const existing = db.getDraft(requestId);
  if (existing && existing.schemaId !== body.schemaId) {
    return error(req, 409, `Request ${requestId} belongs to ${existing.schemaId}`);
  }

  const draft = db.saveAnswer(requestId, body.schemaId, questionId, body.value);
  const response: SaveAnswerResponse = { questionId, value: body.value, savedAt: draft.updatedAt };
  return ok(req, response);
}

/**
 * Wraps a handler with latency and random failures. Everything runs at subscription
 * time (`defer`), so each retry rolls the dice again, and the handler runs only after
 * the delay — an unsubscribed (cancelled) request never reaches the "database".
 */
function simulate(
  req: HttpRequest<unknown>,
  config: MockBackendConfig,
  profile: EndpointProfile,
  handler: () => Outcome,
): Observable<HttpEvent<unknown>> {
  return defer(() => {
    const [min, max] = profile.latencyMs;
    const latency = min + config.random() * (max - min);
    const fails = config.random() < profile.failureRate;

    return timer(latency).pipe(
      mergeMap(() => {
        const outcome = fails ? error(req, 500, 'Simulated server error') : handler();
        return outcome instanceof HttpErrorResponse ? throwError(() => outcome) : of(outcome);
      }),
    );
  });
}

const ok = (req: HttpRequest<unknown>, body: unknown) =>
  new HttpResponse({ status: 200, statusText: 'OK', url: req.url, body });

const error = (req: HttpRequest<unknown>, status: number, message: string) =>
  new HttpErrorResponse({ status, statusText: message, url: req.url, error: { message } });

const isAnswerValue = (value: unknown): value is AnswerValue =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value);

const hasQuestion = (schema: RawRequestSchema, questionId: string) =>
  schema.sections.some((section) => section.fields.some((f) => String(f.id) === questionId));
