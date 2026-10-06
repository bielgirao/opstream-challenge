import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  fieldErrorId,
  fieldLabelId,
  SaveIndicatorStatus,
  UiButton,
  UiCard,
  UiChip,
  UiFieldCard,
  UiIcon,
  UiInput,
  UiLoader,
  UiNavItem,
  UiNotification,
  UiRadioGroup,
  UiSaveIndicator,
  UiSkeleton,
  UiToggleSwitch,
} from '../../shared/ui';

/**
 * Development-only catalogue of shared/ui components and their states.
 * A lightweight stand-in for Storybook (see README, "with more time").
 */
@Component({
  selector: 'app-ui-playground',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    UiButton,
    UiCard,
    UiChip,
    UiFieldCard,
    UiIcon,
    UiInput,
    UiLoader,
    UiNavItem,
    UiNotification,
    UiRadioGroup,
    UiSaveIndicator,
    UiSkeleton,
    UiToggleSwitch,
  ],
  templateUrl: './ui-playground.page.html',
  styleUrl: './ui-playground.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiPlaygroundPage {
  protected readonly fieldErrorId = fieldErrorId;
  protected readonly fieldLabelId = fieldLabelId;

  protected readonly selectedSchema = signal<'software' | 'hardware'>('software');
  protected readonly saveStatuses: SaveIndicatorStatus[] = ['saving', 'retrying', 'saved', 'error'];

  protected readonly form = inject(NonNullableFormBuilder).group({
    itemName: ['', Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(0)]],
    location: ['', Validators.required],
    shipping: [false],
  });

  protected errorFor(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!control.touched || control.valid) return null;
    if (control.hasError('required')) return 'This field is required';
    if (control.hasError('min')) return 'Must be 0 or more';
    return 'Invalid value';
  }

  protected validate(): void {
    this.form.markAllAsTouched();
  }
}
