# ADR-0004: Mock backend as an HttpInterceptor

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context

No real server. The contract is `GET /api/schemas` and `PUT /api/requests/:id/question/:questionId`.
PUT must take 600–1000ms and fail randomly 10–20% of the time.

## Decision

A functional `HttpInterceptor` answers `/api/*` requests. Services use the real `HttpClient` with the contract URLs.
Latency and failure rate live in one config file. GET requests also fail occasionally, to exercise the load-error state.

## Options considered

- **`in-memory-web-api`:** official, but little control over latency and failures per route.
- **MSW:** realistic, but needs a service worker and more setup for the same result.
- **Fake service with `delay`/`throwError`:** simplest, but skips `HttpClient`, so the real HTTP path is never tested.
- **Interceptor — chosen:** real HTTP path, full control, zero dependencies.

## Consequences

- Switching to a real backend means removing one provider.
- Mock failures are random; tests inject a deterministic config.
