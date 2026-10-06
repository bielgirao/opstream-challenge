import { TestBed } from '@angular/core/testing';
import { MemoryStorage } from '../../../testing/memory-storage';
import { MOCK_STORAGE, MockDb } from './mock-db';

function setup(storage: Storage = new MemoryStorage()) {
  TestBed.configureTestingModule({ providers: [{ provide: MOCK_STORAGE, useValue: storage }] });
  return { db: TestBed.inject(MockDb), storage };
}

describe('MockDb', () => {
  it('creates a draft on the first answer and merges later ones', () => {
    const { db } = setup();
    db.saveAnswer('r1', 'software-request', '1', 'Laptop');
    db.saveAnswer('r1', 'software-request', '2', 3);
    expect(db.getDraft('r1')?.answers).toEqual({ '1': 'Laptop', '2': 3 });
  });

  it('overwrites an answer with its latest value', () => {
    const { db } = setup();
    db.saveAnswer('r1', 's', '1', 'a');
    db.saveAnswer('r1', 's', '1', 'b');
    expect(db.getDraft('r1')?.answers['1']).toBe('b');
  });

  it('survives a reload (new instance, same storage)', () => {
    const storage = new MemoryStorage();
    setup(storage).db.saveAnswer('r1', 's', '1', true);
    TestBed.resetTestingModule();
    expect(setup(storage).db.getDraft('r1')?.answers['1']).toBe(true);
  });

  it('starts empty when the stored data is corrupted', () => {
    const storage = new MemoryStorage();
    storage.setItem('opstream-challenge:mock-db', '{not json');
    const { db } = setup(storage);
    expect(db.getDraft('r1')).toBeUndefined();
    db.saveAnswer('r1', 's', '1', 'ok');
    expect(db.getDraft('r1')?.answers['1']).toBe('ok');
  });

  it('keeps working when storage throws', () => {
    const broken = new MemoryStorage();
    broken.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    const { db } = setup(broken);
    expect(() => db.saveAnswer('r1', 's', '1', 'x')).not.toThrow();
  });
});
