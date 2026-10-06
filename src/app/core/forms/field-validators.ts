import { ValidatorFn, Validators } from '@angular/forms';
import { SchemaField } from '../models';
import { finiteNumber, oneOf, requiredTrimmed } from './validators';

/**
 * The single place where validation rules are decided (ADR-0013).
 * Rules come from schema properties and the field type — never from the label.
 */
export function validatorsFor(field: SchemaField): ValidatorFn[] {
  const validators: ValidatorFn[] = [];

  if (field.required) {
    validators.push(requiredTrimmed);
  }

  switch (field.type) {
    case 'number':
      validators.push(finiteNumber, Validators.min(0));
      break;
    case 'radio':
      validators.push(oneOf(field.options));
      break;
    case 'text':
    case 'toggle':
      break;
  }

  return validators;
}
