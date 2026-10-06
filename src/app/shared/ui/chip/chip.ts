import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Selectable pill, used by the schema chooser. Applied to a native <button>;
 * selection is exposed with aria-pressed.
 *
 * Usage: <button uiChip type="button" [selected]="isSelected"><ui-icon name="apps" /> Software</button>
 */
@Component({
  selector: 'button[uiChip]',
  template: '<ng-content />',
  styleUrl: './chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-chip',
    '[class.is-selected]': 'selected()',
    '[attr.aria-pressed]': 'selected()',
  },
})
export class UiChip {
  readonly selected = input(false, { transform: booleanAttribute });
}
