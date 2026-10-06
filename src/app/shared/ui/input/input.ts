import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Design system styling for a native <input>. Native value accessors keep working,
 * so `formControlName` binds directly (text → DefaultValueAccessor, number → NumberValueAccessor).
 *
 * Usage: <input uiInput type="number" id="qty" formControlName="qty" [invalid]="isInvalid" />
 */
@Component({
  selector: 'input[uiInput]',
  template: '',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-input',
    '[attr.aria-invalid]': 'invalid() || null',
  },
})
export class UiInput {
  readonly invalid = input(false, { transform: booleanAttribute });
}
