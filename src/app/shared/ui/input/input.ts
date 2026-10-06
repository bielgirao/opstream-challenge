import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Design system styling for a native <input>. Angular's DefaultValueAccessor keeps working,
 * so `formControlName` binds directly. For numbers, add the `uiNumberInput` directive.
 *
 * Usage: <input uiInput id="name" formControlName="name" [invalid]="isInvalid" />
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
