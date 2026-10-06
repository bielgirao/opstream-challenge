import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type ToggleSize = 16 | 24;

/**
 * Design system toggle_switch, usable with Reactive Forms.
 * A native checkbox with role="switch": keyboard (Space) and checked state come from the browser.
 * Projected content becomes the inline label; inside a field card, pass `inputId`
 * so the card's <label for> points at the switch.
 */
@Component({
  selector: 'ui-toggle-switch',
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiToggleSwitch), multi: true },
  ],
})
export class UiToggleSwitch implements ControlValueAccessor {
  readonly inputId = input<string | null>(null);
  readonly describedBy = input<string | null>(null);
  readonly size = input(24 as ToggleSize, {
    transform: (value: ToggleSize | `${ToggleSize}`) => Number(value) as ToggleSize,
  });

  protected readonly checked = signal(false);
  protected readonly disabled = signal(false);

  private onChange: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.checked.set(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected toggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checked.set(checked);
    this.onChange(checked);
  }
}
