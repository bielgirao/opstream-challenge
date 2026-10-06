import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { map, startWith, switchMap } from 'rxjs';
import { firstErrorMessage } from '../../../../core/forms';
import { SchemaField } from '../../../../core/models';
import { AnswerControl } from '../../../../core/request';
import {
  fieldErrorId,
  fieldLabelId,
  UiFieldCard,
  UiInput,
  UiNumberInput,
  UiRadioGroup,
  UiToggleSwitch,
} from '../../../../shared/ui';

/**
 * Renders one schema field with the control for its type (ADR-0006).
 * Unknown types never reach this component: they are dropped when the schema is normalised.
 */
@Component({
  selector: 'app-dynamic-field',
  imports: [
    ReactiveFormsModule,
    UiFieldCard,
    UiInput,
    UiNumberInput,
    UiRadioGroup,
    UiToggleSwitch,
  ],
  templateUrl: './dynamic-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicField {
  readonly field = input.required<SchemaField>();
  readonly control = input.required<AnswerControl>();

  protected readonly inputId = computed(() => `field-${this.field().id}`);
  protected readonly labelId = computed(() => fieldLabelId(this.inputId()));

  /**
   * Errors and touched state as a signal. They change outside this component (e.g. the page
   * calls markAllAsTouched on "Next"), so they are read from the control's event stream.
   */
  private readonly controlState = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.events.pipe(
          startWith(null),
          map(() => ({ errors: control.errors, touched: control.touched })),
        ),
      ),
    ),
    { initialValue: { errors: null, touched: false } },
  );

  protected readonly error = computed(() => {
    const { errors, touched } = this.controlState();
    return touched ? firstErrorMessage(errors) : null;
  });

  protected readonly describedBy = computed(() =>
    this.error() ? fieldErrorId(this.inputId()) : null,
  );

  /** A switch always has a value, so "(optional)" would only add noise. */
  protected readonly showOptional = computed(
    () => !this.field().required && this.field().type !== 'toggle',
  );
}
