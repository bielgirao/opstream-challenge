import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiLoader } from '../loader/loader';

/** `style` in the design system; renamed because `style` is a native HTML attribute. */
export type ButtonVariant = 'main' | 'secondary';
export type ButtonSize = 32 | 40;

/**
 * Design system button, applied to a native <button> so type, focus, keyboard and
 * form semantics stay native.
 *
 * Usage: <button uiButton type="button" variant="secondary" size="32" caps>Previous</button>
 *
 * While `loading`, the button is natively disabled and marked aria-busy.
 * Trade-off: a disabled button cannot keep focus; callers should guard their own
 * handlers too (e.g. an `isSubmitting` flag) instead of relying on the button alone.
 */
@Component({
  selector: 'button[uiButton]',
  imports: [UiLoader],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-button',
    '[class.ui-button--main]': "variant() === 'main'",
    '[class.ui-button--secondary]': "variant() === 'secondary'",
    '[class.ui-button--32]': 'size() === 32',
    '[class.ui-button--40]': 'size() === 40',
    '[class.ui-button--caps]': 'caps()',
    '[class.is-loading]': 'loading()',
    '[attr.aria-busy]': 'loading() || null',
    '[disabled]': 'disabled() || loading()',
  },
})
export class UiButton {
  readonly variant = input<ButtonVariant>('main');
  readonly size = input(40 as ButtonSize, {
    transform: (value: ButtonSize | `${ButtonSize}`) => Number(value) as ButtonSize,
  });
  readonly caps = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
}
