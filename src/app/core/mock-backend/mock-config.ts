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
  /** Whether the browser is online; offline requests fail like a real network error (status 0). */
  isOnline: () => boolean;
}

export const DEFAULT_MOCK_BACKEND_CONFIG: MockBackendConfig = {
  getSchemas: { latencyMs: [300, 600], failureRate: 0.1 },
  getDraft: { latencyMs: [300, 600], failureRate: 0 },
  // Brief: 600–1000ms latency and 10–20% random failures on PUT.
  saveAnswer: { latencyMs: [600, 1000], failureRate: 0.15 },
  random: Math.random,
  isOnline: () => globalThis.navigator?.onLine ?? true,
};

/**
 * Lets anyone trying the app force the error paths from the URL (read once, on page load):
 * - `?mockFailureRate=0..1` sets the failure rate of every call (`0` disables failures);
 * - `?mockSaveFailureRate=0..1` only affects saving answers, to watch autosave retry and give up.
 */
export function withUrlOverrides(config: MockBackendConfig, search: string): MockBackendConfig {
  const params = new URLSearchParams(search);
  const all = parseRate(params.get('mockFailureRate'));
  const save = parseRate(params.get('mockSaveFailureRate'));
  if (all === null && save === null) return config;

  const withRate = (profile: EndpointProfile, rate: number | null): EndpointProfile =>
    rate === null ? profile : { ...profile, failureRate: rate };

  return {
    ...config,
    getSchemas: withRate(config.getSchemas, all),
    getDraft: withRate(config.getDraft, all),
    saveAnswer: withRate(config.saveAnswer, save ?? all),
  };
}

function parseRate(raw: string | null): number | null {
  const rate = raw === null || raw.trim() === '' ? NaN : Number(raw);
  return Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : null;
}

export const MOCK_BACKEND_CONFIG = new InjectionToken<MockBackendConfig>('MOCK_BACKEND_CONFIG', {
  providedIn: 'root',
  factory: () => withUrlOverrides(DEFAULT_MOCK_BACKEND_CONFIG, globalThis.location?.search ?? ''),
});
