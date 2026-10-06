import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '../../../../shared/ui';

/**
 * Previous / Next / Submit. The primary button is a submit button, so Enter inside a field
 * moves forward too; the page decides whether that means "next section" or "submit".
 * Buttons stay enabled on invalid input: the click is blocked and errors are shown instead,
 * because a greyed-out button does not tell the user what is missing.
 */
@Component({
  selector: 'app-wizard-actions',
  imports: [UiButton],
  template: `
    @if (!isFirst()) {
      <button uiButton type="button" variant="secondary" size="32" caps (click)="previous.emit()">
        Previous
      </button>
    }
    <button uiButton type="submit" size="32" caps [loading]="submitting()">
      {{ isLast() ? 'Submit' : 'Next' }}
    </button>
  `,
  styles: `
    :host {
      display: flex;
      gap: var(--space-3);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardActions {
  readonly isFirst = input(false, { transform: booleanAttribute });
  readonly isLast = input(false, { transform: booleanAttribute });
  readonly submitting = input(false, { transform: booleanAttribute });
  readonly previous = output<void>();
}
