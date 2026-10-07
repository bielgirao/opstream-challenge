import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiIcon } from '../icon/icon';
import { UiLoader } from '../loader/loader';

/**
 * Aggregate autosave state. Defined here (not imported from core) so shared/ui stays
 * free of domain dependencies; the autosave service maps onto it.
 */
export type SaveIndicatorStatus = 'idle' | 'saving' | 'retrying' | 'saved' | 'error' | 'offline';

/**
 * Autosave status line: "Saving…", "Saved", "Error – retrying…", a final "Couldn't save" with a
 * Retry action once retries are exhausted, or "Offline" while answers wait for the connection.
 * The host is a polite live region, so changes are announced without stealing focus.
 */
@Component({
  selector: 'ui-save-indicator',
  imports: [UiIcon, UiLoader],
  templateUrl: './save-indicator.html',
  styleUrl: './save-indicator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    '[attr.data-status]': 'status()',
  },
})
export class UiSaveIndicator {
  readonly status = input<SaveIndicatorStatus>('idle');
  readonly retry = output<void>();
}
