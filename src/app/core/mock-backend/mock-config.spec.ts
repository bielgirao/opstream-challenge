import { DEFAULT_MOCK_BACKEND_CONFIG, withUrlOverrides } from './mock-config';

describe('withUrlOverrides', () => {
  it('overrides every failure rate from ?mockFailureRate', () => {
    const config = withUrlOverrides(DEFAULT_MOCK_BACKEND_CONFIG, '?mockFailureRate=1');
    expect(config.getSchemas.failureRate).toBe(1);
    expect(config.getDraft.failureRate).toBe(1);
    expect(config.saveAnswer.failureRate).toBe(1);
    expect(config.saveAnswer.latencyMs).toEqual(DEFAULT_MOCK_BACKEND_CONFIG.saveAnswer.latencyMs);
  });

  it.each(['', '?mockFailureRate=', '?mockFailureRate=abc', '?mockFailureRate=2', '?other=1'])(
    'ignores %j',
    (search) => {
      expect(withUrlOverrides(DEFAULT_MOCK_BACKEND_CONFIG, search)).toBe(DEFAULT_MOCK_BACKEND_CONFIG);
    },
  );
});
