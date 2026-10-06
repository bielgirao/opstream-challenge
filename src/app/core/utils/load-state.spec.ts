import { firstValueFrom, of, throwError, toArray } from 'rxjs';
import { toLoadState } from './load-state';

describe('toLoadState', () => {
  it('emits loading, then the value', async () => {
    expect(await firstValueFrom(of(1).pipe(toLoadState(), toArray()))).toEqual([
      { status: 'loading' },
      { status: 'ready', value: 1 },
    ]);
  });

  it('turns an error into a state instead of erroring', async () => {
    const error = new Error('boom');
    expect(await firstValueFrom(throwError(() => error).pipe(toLoadState(), toArray()))).toEqual([
      { status: 'loading' },
      { status: 'error', error },
    ]);
  });
});
