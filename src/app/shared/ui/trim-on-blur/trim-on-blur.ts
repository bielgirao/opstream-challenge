import { Directive, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Removes leading and trailing whitespace when the field loses focus, through the form
 * control, so the trimmed value is what gets validated and saved.
 *
 * Usage: <input uiInput uiTrimOnBlur formControlName="name" />
 */
@Directive({
  selector: 'input[uiTrimOnBlur]',
  host: { '(blur)': 'trim()' },
})
export class UiTrimOnBlur {
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  protected trim(): void {
    const control = this.ngControl?.control;
    if (typeof control?.value !== 'string') return;
    const trimmed = control.value.trim();
    if (trimmed !== control.value) control.setValue(trimmed);
  }
}
