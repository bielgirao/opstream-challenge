import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiIcon } from '../icon/icon';
import { UiLoader } from '../loader/loader';

export type NavItemStatus = 'none' | 'saving' | 'done' | 'error';

/**
 * Sidebar entry from the design system (secNav), applied to <a> or <button>.
 * The status slot mirrors the design system's spinner / check / error indicators.
 *
 * Disabled anchors cannot be truly disabled in HTML: they get aria-disabled, leave the
 * tab order and ignore pointer events. Navigation must still be guarded by the router.
 */
@Component({
  selector: 'a[uiNavItem], button[uiNavItem]',
  imports: [UiIcon, UiLoader],
  templateUrl: './nav-item.html',
  styleUrl: './nav-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-nav-item',
    '[class.is-active]': 'active()',
    '[class.is-disabled]': 'disabled()',
    '[attr.aria-current]': "active() ? 'step' : null",
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.tabindex]': 'disabled() ? -1 : null',
  },
})
export class UiNavItem {
  readonly active = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly status = input<NavItemStatus>('none');
}
