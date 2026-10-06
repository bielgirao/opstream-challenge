import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type LoaderSize = 'sm' | 'md' | 'lg';

/**
 * Spinner based on the design system's loader-alt.
 * With a `label` it is announced as a status; without one it is decorative
 * (use it inside something that already communicates the state, e.g. a busy button).
 */
@Component({
  selector: 'ui-loader',
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-loader--sm]': "size() === 'sm'",
    '[class.ui-loader--md]': "size() === 'md'",
    '[class.ui-loader--lg]': "size() === 'lg'",
    '[attr.role]': "label() ? 'status' : null",
    '[attr.aria-hidden]': "label() ? null : 'true'",
  },
})
export class UiLoader {
  readonly size = input<LoaderSize>('md');
  readonly label = input<string | null>(null);
}
