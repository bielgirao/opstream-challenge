import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** Ids derived from a field id, shared by the card and the control it wraps. */
export const fieldLabelId = (fieldId: string) => `${fieldId}-label`;
export const fieldErrorId = (fieldId: string) => `${fieldId}-error`;

/**
 * Card that wraps one question: label, the projected control, and its error message.
 *
 * - Single control (text, number, toggle): renders a <label for="fieldId">.
 *   Give the control `id="fieldId"`.
 * - Group of controls (`group`, e.g. radio): renders <fieldset> + <legend>.
 *
 * Point the control's aria-describedby at `fieldErrorId(fieldId)` when `error` is set.
 */
@Component({
  selector: 'ui-field-card',
  imports: [NgTemplateOutlet],
  templateUrl: './field-card.html',
  styleUrl: './field-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.has-error]': '!!error()',
  },
})
export class UiFieldCard {
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  readonly group = input(false, { transform: booleanAttribute });
  readonly optional = input(false, { transform: booleanAttribute });
  readonly error = input<string | null>(null);

  protected readonly labelId = computed(() => fieldLabelId(this.fieldId()));
  protected readonly errorId = computed(() => fieldErrorId(this.fieldId()));
}
