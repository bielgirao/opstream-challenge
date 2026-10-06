import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Elevated surface for page-level content (chooser, summary). Padding is overridable via --card-padding. */
@Component({
  selector: 'ui-card',
  template: '<ng-content />',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCard {}
