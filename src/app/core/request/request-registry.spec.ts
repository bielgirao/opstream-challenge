import { TestBed } from '@angular/core/testing';
import { MemoryStorage } from '../../../testing/memory-storage';
import { REQUEST_REGISTRY_STORAGE, RequestRegistry } from './request-registry';

function setup(storage: Storage = new MemoryStorage()) {
  TestBed.configureTestingModule({ providers: [{ provide: REQUEST_REGISTRY_STORAGE, useValue: storage }] });
  return TestBed.inject(RequestRegistry);
}

describe('RequestRegistry', () => {
  it('remembers the schema of a request, not yet submitted', () => {
    const registry = setup();
    registry.register('r1', 'software-request');
    expect(registry.get('r1')).toEqual({ schemaId: 'software-request', submitted: false });
    expect(registry.get('other')).toBeUndefined();
  });

  it('marks a known request as submitted and keeps it when registered again', () => {
    const registry = setup();
    registry.register('r1', 'software-request');
    registry.markSubmitted('r1');
    registry.register('r1', 'software-request');
    expect(registry.get('r1')?.submitted).toBe(true);
  });

  it('ignores unknown requests when marking them as submitted', () => {
    const registry = setup();
    registry.markSubmitted('ghost');
    expect(registry.get('ghost')).toBeUndefined();
  });

  it('survives a reload, and starts empty when the stored data is corrupted', () => {
    const storage = new MemoryStorage();
    setup(storage).register('r1', 'hardware-request');
    TestBed.resetTestingModule();
    expect(setup(storage).get('r1')?.schemaId).toBe('hardware-request');

    TestBed.resetTestingModule();
    storage.setItem('opstream-challenge:requests', '{broken');
    expect(setup(storage).get('r1')).toBeUndefined();
  });
});
