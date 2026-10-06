import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, switchMap } from 'rxjs';
import { answersOf, OpenResult, RequestSession } from '../../core/request';
import { LoadState, toLoadState } from '../../core/utils/load-state';
import { UiButton, UiCard, UiIcon, UiNotification, UiSkeleton } from '../../shared/ui';
import { formatAnswer } from './format-answer';

/** Read-only summary of a submitted request (guarded by submittedRequestGuard). */
@Component({
  selector: 'app-request-summary-page',
  imports: [RouterLink, UiButton, UiCard, UiIcon, UiNotification, UiSkeleton],
  templateUrl: './request-summary.page.html',
  styleUrl: './request-summary.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestSummaryPage {
  readonly requestId = input.required<string>();

  private readonly session = inject(RequestSession);
  private readonly router = inject(Router);
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  protected readonly openState = toSignal(
    combineLatest([toObservable(this.requestId), this.reload$]).pipe(
      switchMap(([requestId]) => this.session.open(requestId).pipe(toLoadState())),
    ),
    { initialValue: { status: 'loading' } as LoadState<OpenResult> },
  );

  protected readonly request = computed(() => {
    const state = this.openState();
    return state.status === 'ready' && state.value === 'ready' ? this.session.active() : null;
  });

  protected readonly sections = computed(() => {
    const request = this.request();
    if (!request) return [];
    const answers = answersOf(request.form);
    return request.schema.sections.map((section) => ({
      id: section.id,
      title: section.title,
      rows: section.fields.map((field) => ({
        id: field.id,
        label: field.label,
        answer: formatAnswer(field, answers[field.id] ?? null),
      })),
    }));
  });

  protected reload(): void {
    this.reload$.next();
  }

  protected createNewRequest(): void {
    this.session.reset();
    void this.router.navigate(['/requests/new']);
  }
}
