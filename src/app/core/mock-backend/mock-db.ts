import { inject, Injectable, InjectionToken } from '@angular/core';
import { AnswerValue, RequestDraft } from '../models';

/** Storage used by the mock database; an in-memory implementation is injected in tests. */
export const MOCK_STORAGE = new InjectionToken<Storage>('MOCK_STORAGE', {
  providedIn: 'root',
  factory: () => localStorage,
});

const STORAGE_KEY = 'opstream-challenge:mock-db';

interface MockDbState {
  version: 1;
  drafts: Record<string, RequestDraft>;
}

const emptyState = (): MockDbState => ({ version: 1, drafts: {} });

const isState = (value: unknown): value is MockDbState =>
  typeof value === 'object' &&
  value !== null &&
  (value as MockDbState).version === 1 &&
  typeof (value as MockDbState).drafts === 'object' &&
  (value as MockDbState).drafts !== null;

/**
 * The mock backend's "database": drafts persisted in localStorage, so a page reload
 * behaves like a real server that remembers saved answers (ADR-0008).
 * Corrupted or unavailable storage degrades to an empty, non-persistent database.
 */
@Injectable({ providedIn: 'root' })
export class MockDb {
  private readonly storage = inject(MOCK_STORAGE);

  getDraft(requestId: string): RequestDraft | undefined {
    return this.read().drafts[requestId];
  }

  /** Upsert: creates the draft on its first answer. */
  saveAnswer(
    requestId: string,
    schemaId: string,
    questionId: string,
    value: AnswerValue,
    now = new Date(),
  ): RequestDraft {
    const state = this.read();
    const draft: RequestDraft = {
      id: requestId,
      schemaId,
      answers: { ...state.drafts[requestId]?.answers, [questionId]: value },
      updatedAt: now.toISOString(),
    };
    state.drafts[requestId] = draft;
    this.write(state);
    return draft;
  }

  private read(): MockDbState {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      return isState(parsed) ? parsed : emptyState();
    } catch {
      return emptyState();
    }
  }

  private write(state: MockDbState): void {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked (e.g. private mode): keep working without persistence.
    }
  }
}
