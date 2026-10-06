import { DEFAULT_MOCK_BACKEND_CONFIG, withUrlOverrides } from './mock-config';

describe('withUrlOverrides', () => {
  it('overrides every failure rate from ?mockFailureRate', () => {
    const config = withUrlOverrides(DEFAULT_MOCK_BACKEND_CONFIG, '?mockFailureRate=1');
    expect(config.getSchemas.failureRate).toBe(1);
    expect(config.getDraft.failureRate).toBe(1);
    expect(config.saveAnswer.failureRate).toBe(1);
    expect(config.saveAnswer.latencyMs).toEqual(DEFAULT_MOCK_BACKEND_CONFIG.saveAnswer.latencyMs);
  });

  it('overrides only saves from ?mockSaveFailureRate, and it wins over the global rate', () => {
    const config = withUrlOverrides(DEFAULT_MOCK_BACKEND_CONFIG, '?mockFailureRate=0&mockSaveFailureRate=1');
    expect(config.getSchemas.failureRate).toBe(0);
    expect(config.saveAnswer.failureRate).toBe(1);
  });

  it.each(['', '?mockFailureRate=', '?mockFailureRate=abc', '?mockFailureRate=2', '?other=1'])(
    'ignores %j',
    (search) => {
      expect(withUrlOverrides(DEFAULT_MOCK_BACKEND_CONFIG, search)).toBe(DEFAULT_MOCK_BACKEND_CONFIG);
    },
  );
});
