import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Pill radio group from the design system, usable with Reactive Forms.
 *
 * Built on native radio inputs, so arrow-key navigation, single tab stop and
 * screen reader semantics come from the browser.
 *
 * Usage (inside <ui-field-card group>):
 *   <ui-radio-group name="location" [options]="['USA', 'UK']" formControlName="location"
 *                   [labelledBy]="fieldLabelId(id)" />
 */
@Component({
  selector: 'ui-radio-group',
  templateUrl: './radio-group.html',
  styleUrl: './radio-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiRadioGroup), multi: true },
  ],
})
export class UiRadioGroup implements ControlValueAccessor {
  /** Native `name`; must be unique on the page so groups don't merge. */
  readonly name = input.required<string>();
  readonly options = input.required<readonly string[]>();
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly labelledBy = input<string | null>(null);
  readonly describedBy = input<string | null>(null);

  protected readonly value = signal<string | null>(null);
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' ? value : null);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected select(option: string): void {
    this.value.set(option);
    this.onChange(option);
  }
}
