import { TestBed } from '@angular/core/testing';
import { NetworkStatus } from './network-status.service';

describe('NetworkStatus', () => {
  afterEach(() => vi.restoreAllMocks());

  it('starts from navigator.onLine', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(TestBed.inject(NetworkStatus).online()).toBe(false);
  });

  it('follows the online / offline events', () => {
    const network = TestBed.inject(NetworkStatus);
    expect(network.online()).toBe(true);

    window.dispatchEvent(new Event('offline'));
    expect(network.online()).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(network.online()).toBe(true);
  });

  it('emits reconnected$ only when the connection comes back', () => {
    const network = TestBed.inject(NetworkStatus);
    let reconnections = 0;
    const subscription = network.reconnected$.subscribe(() => reconnections++);

    window.dispatchEvent(new Event('online')); // already online: no change
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));

    expect(reconnections).toBe(1);
    subscription.unsubscribe();
  });
});
