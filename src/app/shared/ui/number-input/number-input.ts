import {
  computed,
  Directive,
  ElementRef,
  forwardRef,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Text a field may hold at any moment while typing: digits and, when decimals are allowed,
 * one point followed by up to `decimalPlaces` digits ("12." and "." are valid in-between states).
 */
export function numericTextPattern(decimalPlaces: number): RegExp {
  return decimalPlaces > 0 ? new RegExp(`^\\d*(\\.\\d{0,${decimalPlaces}})?$`) : /^\d*$/;
}

/** '' and a lone '.' mean "no number yet". */
export function parseNumericText(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '' || trimmed === '.') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/**
 * Best-effort cleanup for text that bypassed the input filter: keeps digits and, when allowed,
 * the first decimal point with up to `decimalPlaces` digits (commas count as decimal points).
 */
export function sanitizeNumericText(text: string, decimalPlaces: number): string {
  const [integer, ...rest] = text.replace(/,/g, '.').replace(/[^\d.]/g, '').split('.');
  if (decimalPlaces === 0 || rest.length === 0) return integer;
  return `${integer}.${rest.join('').slice(0, decimalPlaces)}`;
}

/**
 * Numeric input that only accepts what the field allows — letters, signs, exponents and
 * (by default) decimal points never reach the field. Pair it with `uiInput` for styling:
 *
 *   <input uiInput uiNumberInput formControlName="quantity" />                 whole numbers
 *   <input uiInput uiNumberInput [decimalPlaces]="2" formControlName="price" />  up to 2 decimals
 *
 * Why not `type="number"`: browsers let "e", "+", "-" (and, in Firefox, any letter) through,
 * then report unparsable text to JavaScript as an empty value, and they hide the caret
 * position needed to filter keystrokes. A text input with `inputmode` keeps the numeric
 * keyboard on mobile and gives full control.
 *
 * Negative numbers are rejected at input time because every number field must be >= 0, and
 * so are values beyond Number.MAX_SAFE_INTEGER (ADR-0013). The form receives `number | null`.
 */
@Directive({
  selector: 'input[uiNumberInput]',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiNumberInput), multi: true },
  ],
  host: {
    type: 'text',
    autocomplete: 'off',
    '[attr.inputmode]': "decimalPlaces() > 0 ? 'decimal' : 'numeric'",
    '(beforeinput)': 'onBeforeInput($event)',
    '(input)': 'onInput()',
    '(blur)': 'onTouched()',
  },
})
export class UiNumberInput implements ControlValueAccessor {
  /** Decimal places allowed; 0 (default) means whole numbers only. */
  readonly decimalPlaces = input(0, { transform: numberAttribute });

  private readonly pattern = computed(() => numericTextPattern(this.decimalPlaces()));
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  private onChange: (value: number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.input.value = typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.input.disabled = isDisabled;
  }

  /** Blocks any insertion (typing, paste, drop) that would leave text the field cannot hold. */
  protected onBeforeInput(event: InputEvent): void {
    if (!event.inputType.startsWith('insert')) return; // deletions are always fine

    const data = event.data ?? event.dataTransfer?.getData('text') ?? '';
    const insertion = data.replace(/,/g, '.').trim();
    const { value } = this.input;
    const start = this.input.selectionStart ?? value.length;
    const end = this.input.selectionEnd ?? value.length;
    const next = value.slice(0, start) + insertion + value.slice(end);

    if (!this.accepts(next)) {
      event.preventDefault();
      return;
    }

    // Valid once normalised (e.g. "," → ".", pasted spaces): insert the normalised text instead.
    if (insertion !== data) {
      event.preventDefault();
      this.input.setRangeText(insertion, start, end, 'end');
      this.onInput();
    }
  }

  /** Emits the parsed number. Sanitises first, in case an insertion bypassed beforeinput (e.g. IME). */
  protected onInput(): void {
    if (!this.pattern().test(this.input.value)) {
      this.input.value = sanitizeNumericText(this.input.value, this.decimalPlaces());
    }
    this.onChange(parseNumericText(this.input.value));
  }

  private accepts(text: string): boolean {
    if (!this.pattern().test(text)) return false;
    const value = parseNumericText(text);
    return value === null || value <= Number.MAX_SAFE_INTEGER;
  }
}
