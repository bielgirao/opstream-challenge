import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type NotificationType = 'neutral' | 'success' | 'error' | 'info' | 'warning';
export type NotificationAppearance = 'filled' | 'outlined';

/**
 * Design system notification. Errors and warnings use role="alert" (announced immediately);
 * the rest use role="status" (announced politely).
 *
 * Usage:
 *   <ui-notification type="error" title="Couldn't load request types">
 *     Check your connection and try again.
 *     <button uiButton uiNotificationActions size="32" (click)="reload()">Try again</button>
 *   </ui-notification>
 */
@Component({
  selector: 'ui-notification',
  templateUrl: './notification.html',
  styleUrl: './notification.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-type]': 'type()',
    '[attr.data-appearance]': 'appearance()',
    '[attr.role]': 'role()',
  },
})
export class UiNotification {
  readonly type = input<NotificationType>('neutral');
  readonly appearance = input<NotificationAppearance>('filled');
  readonly title = input<string | null>(null);

  protected readonly role = computed(() =>
    this.type() === 'error' || this.type() === 'warning' ? 'alert' : 'status',
  );
}
