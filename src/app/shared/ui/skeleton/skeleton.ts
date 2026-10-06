import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SkeletonRadius = 'micro' | 'md' | 'lg' | 'pill';

/** Placeholder block shown while content loads. Hidden from assistive tech. */
@Component({
  selector: 'ui-skeleton',
  template: '',
  styleUrl: './skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.border-radius]': "'var(--radius-' + radius() + ')'",
  },
})
export class UiSkeleton {
  readonly width = input('100%');
  readonly height = input('16px');
  readonly radius = input<SkeletonRadius>('micro');
}
