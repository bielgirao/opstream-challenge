import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { firstErrorMessage } from './validation-messages';

/**
 * Template helper: `control.errors | fieldError: control.touched`.
 * Pure on purpose — Angular replaces `errors` with a new object on every validation run,
 * so the pipe re-evaluates exactly when the errors or the visibility flag change.
 */
@Pipe({ name: 'fieldError' })
export class FieldErrorPipe implements PipeTransform {
  transform(errors: ValidationErrors | null | undefined, visible = true): string | null {
    return visible ? firstErrorMessage(errors) : null;
  }
}
