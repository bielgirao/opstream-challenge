import { InjectionToken } from '@angular/core';

export interface EndpointProfile {
  /** Random latency range, in ms. */
  latencyMs: readonly [min: number, max: number];
  /** Probability (0–1) of answering with HTTP 500. */
  failureRate: number;
}

export interface MockBackendConfig {
  getSchemas: EndpointProfile;
  getDraft: EndpointProfile;
  saveAnswer: EndpointProfile;
  /** Source of randomness; replaced with a deterministic function in tests. */
  random: () => number;
}

export const DEFAULT_MOCK_BACKEND_CONFIG: MockBackendConfig = {
  getSchemas: { latencyMs: [300, 600], failureRate: 0.1 },
  getDraft: { latencyMs: [300, 600], failureRate: 0 },
  // Brief: 600–1000ms latency and 10–20% random failures on PUT.
  saveAnswer: { latencyMs: [600, 1000], failureRate: 0.15 },
  random: Math.random,
};

/**
 * Lets anyone trying the app force the error paths from the URL:
 * `?mockFailureRate=1` makes every call fail, `?mockFailureRate=0` disables failures.
 */
export function withUrlOverrides(config: MockBackendConfig, search: string): MockBackendConfig {
  const raw = new URLSearchParams(search).get('mockFailureRate');
  const rate = raw === null || raw.trim() === '' ? NaN : Number(raw);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) return config;

  return {
    ...config,
    getSchemas: { ...config.getSchemas, failureRate: rate },
    getDraft: { ...config.getDraft, failureRate: rate },
    saveAnswer: { ...config.saveAnswer, failureRate: rate },
  };
}

export const MOCK_BACKEND_CONFIG = new InjectionToken<MockBackendConfig>('MOCK_BACKEND_CONFIG', {
  providedIn: 'root',
  factory: () => withUrlOverrides(DEFAULT_MOCK_BACKEND_CONFIG, globalThis.location?.search ?? ''),
});
