import { inject, Injectable, InjectionToken } from '@angular/core';

/** Per-tab storage for what the backend contract cannot tell us; in-memory in tests. */
export const REQUEST_REGISTRY_STORAGE = new InjectionToken<Storage>('REQUEST_REGISTRY_STORAGE', {
  providedIn: 'root',
  factory: () => sessionStorage,
});

const STORAGE_KEY = 'opstream-challenge:requests';

export interface RegistryEntry {
  schemaId: string;
  submitted: boolean;
}

/**
 * Remembers, per browser tab, which schema each request uses and whether it was submitted.
 *
 * The contract has no "create request" or "submit" endpoint, so without this a refresh right
 * after Start (before any answer is saved) would not know the schema, and a refresh on the
 * summary would not know the request was submitted. A real backend would own both facts.
 */
@Injectable({ providedIn: 'root' })
export class RequestRegistry {
  private readonly storage = inject(REQUEST_REGISTRY_STORAGE);

  get(requestId: string): RegistryEntry | undefined {
    return this.read()[requestId];
  }

  register(requestId: string, schemaId: string): void {
    const entries = this.read();
    entries[requestId] = { schemaId, submitted: entries[requestId]?.submitted ?? false };
    this.write(entries);
  }

  markSubmitted(requestId: string): void {
    const entries = this.read();
    const entry = entries[requestId];
    if (!entry) return;
    entries[requestId] = { ...entry, submitted: true };
    this.write(entries);
  }

  private read(): Record<string, RegistryEntry> {
    try {
      const parsed: unknown = JSON.parse(this.storage.getItem(STORAGE_KEY) ?? '{}');
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, RegistryEntry>)
        : {};
    } catch {
      return {};
    }
  }

  private write(entries: Record<string, RegistryEntry>): void {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Storage unavailable: the app still works, refresh recovery is just lost.
    }
  }
}
