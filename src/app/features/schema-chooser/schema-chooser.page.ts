import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { BehaviorSubject, switchMap } from 'rxjs';
import { SchemaApiService } from '../../core/api';
import { RequestSession } from '../../core/request';
import { toLoadState } from '../../core/utils/load-state';
import {
  IconName,
  UiButton,
  UiCard,
  UiChip,
  UiIcon,
  UiNotification,
  UiSkeleton,
} from '../../shared/ui';

/** Presentation only: unknown schemas fall back to a generic icon. */
const SCHEMA_ICONS: Readonly<Record<string, IconName>> = {
  'software-request': 'apps',
  'hardware-request': 'desktop',
};

@Component({
  selector: 'app-schema-chooser-page',
  imports: [UiButton, UiCard, UiChip, UiIcon, UiNotification, UiSkeleton],
  templateUrl: './schema-chooser.page.html',
  styleUrl: './schema-chooser.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaChooserPage {
  private readonly schemaApi = inject(SchemaApiService);
  private readonly session = inject(RequestSession);
  private readonly router = inject(Router);

  private readonly reload$ = new BehaviorSubject<void>(undefined);

  protected readonly state = toSignal(
    this.reload$.pipe(switchMap(() => this.schemaApi.getSchemas().pipe(toLoadState()))),
    { requireSync: true },
  );

  protected readonly schemas = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.value : [];
  });

  /** First schema preselected, as in the mockup; follows the list when it (re)loads. */
  protected readonly selectedId = linkedSignal(() => this.schemas()[0]?.id ?? null);

  protected iconFor(schemaId: string): IconName {
    return SCHEMA_ICONS[schemaId] ?? 'apps';
  }

  protected retry(): void {
    this.reload$.next();
  }

  protected start(): void {
    const schema = this.schemas().find((s) => s.id === this.selectedId());
    if (!schema) return;
    const request = this.session.start(schema);
    void this.router.navigate(['/requests', request.id, 'sections', schema.sections[0].id]);
  }
}
