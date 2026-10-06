import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, of, scan, startWith, switchMap } from 'rxjs';
import { QuestionSaveState, SchemaSection } from '../../core/models';
import {
  furthestReachableIndex,
  OpenResult,
  RequestForm,
  RequestSession,
  sectionRedirect,
} from '../../core/request';
import { LoadState, toLoadState } from '../../core/utils/load-state';
import { NavItemStatus, UiButton, UiNotification, UiSaveIndicator, UiSkeleton } from '../../shared/ui';
import { DynamicField } from './components/dynamic-field/dynamic-field';
import { SectionNav, SectionNavItem } from './components/section-nav/section-nav';
import { WizardActions } from './components/wizard-actions/wizard-actions';

const IN_FLIGHT: readonly QuestionSaveState[] = ['pending', 'saving', 'retrying'];

/**
 * One section of the request per URL: /requests/:requestId/sections/:sectionId.
 * The component is reused while moving between sections; the form lives in RequestSession.
 */
@Component({
  selector: 'app-request-wizard-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DynamicField,
    SectionNav,
    WizardActions,
    UiButton,
    UiNotification,
    UiSaveIndicator,
    UiSkeleton,
  ],
  templateUrl: './request-wizard.page.html',
  styleUrl: './request-wizard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestWizardPage {
  /** Route params, bound with withComponentInputBinding(). */
  readonly requestId = input.required<string>();
  readonly sectionId = input<string>();

  protected readonly session = inject(RequestSession);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

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

  /** Ticks on every value, validity or touched change, so validity-based computeds stay fresh. */
  private readonly formTick = toSignal(
    toObservable(this.request).pipe(
      switchMap((request) => (request ? request.form.events.pipe(startWith(null)) : of(null))),
      scan((tick) => tick + 1, 0),
    ),
    { initialValue: 0 },
  );

  protected readonly sectionIndex = computed(
    () => this.request()?.schema.sections.findIndex((s) => s.id === this.sectionId()) ?? -1,
  );
  protected readonly section = computed(
    () => this.request()?.schema.sections[this.sectionIndex()] ?? null,
  );
  protected readonly isFirst = computed(() => this.sectionIndex() === 0);
  protected readonly isLast = computed(
    () => this.sectionIndex() === (this.request()?.schema.sections.length ?? 0) - 1,
  );

  protected readonly navItems = computed<SectionNavItem[]>(() => {
    const request = this.request();
    if (!request) return [];
    this.formTick();
    const states = this.session.questionStates();
    const furthest = furthestReachableIndex(request.schema, request.form);
    const current = this.sectionIndex();

    return request.schema.sections.map((section, index) => ({
      id: section.id,
      title: section.title,
      active: index === current,
      disabled: index > furthest,
      status: sectionStatus(section, request.form, states, index !== current && index <= furthest),
    }));
  });

  protected readonly submitting = signal(false);
  private readonly submitFailed = signal(false);
  /** Shown after a submit blocked by failed saves, until they are saved. */
  protected readonly showSaveFailure = computed(
    () => this.submitFailed() && this.session.saveStatus() === 'error',
  );

  constructor() {
    // After the request is opened (refresh, deep link), apply the same rules as the route guard.
    effect(() => {
      const request = this.request();
      const sectionId = this.sectionId();
      if (!request) return;
      untracked(() => {
        if (this.session.isSubmitted(request.id)) {
          void this.router.navigate(['/requests', request.id, 'summary'], { replaceUrl: true });
          return;
        }
        const target = sectionRedirect(request.schema, request.form, sectionId);
        if (target) {
          void this.router.navigate(['/requests', request.id, 'sections', target], { replaceUrl: true });
        }
      });
    });
  }

  protected reload(): void {
    this.reload$.next();
  }

  protected next(): void {
    const request = this.request();
    const section = this.section();
    if (!request || !section) return;

    const group = request.form.controls[section.id];
    if (group.invalid) {
      group.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    if (this.isLast()) {
      this.submit();
    } else {
      this.goToSection(request.schema.sections[this.sectionIndex() + 1].id);
    }
  }

  protected previous(): void {
    const request = this.request();
    if (!request || this.isFirst()) return;
    this.goToSection(request.schema.sections[this.sectionIndex() - 1].id);
  }

  protected retrySaves(): void {
    this.session.retryFailed();
  }

  private submit(): void {
    const request = this.request();
    if (!request || this.submitting()) return;

    this.submitting.set(true);
    this.submitFailed.set(false);
    this.session
      .submit()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.submitting.set(false);
        switch (result) {
          case 'submitted':
            void this.router.navigate(['/requests', request.id, 'summary'], { replaceUrl: true });
            break;
          case 'save-failed':
            this.submitFailed.set(true);
            break;
          case 'invalid': {
            // An earlier section became invalid: send the user there with its errors visible.
            const target = sectionRedirect(request.schema, request.form, undefined)!;
            request.form.controls[target].markAllAsTouched();
            this.goToSection(target);
            break;
          }
        }
      });
  }

  private goToSection(sectionId: string): void {
    const requestId = this.request()?.id;
    if (!requestId) return;
    void this.router.navigate(['/requests', requestId, 'sections', sectionId]).then(() =>
      afterNextRender(() => this.focus('.wizard__title'), { injector: this.injector }),
    );
  }

  private focusFirstInvalidField(): void {
    afterNextRender(
      () => {
        const invalid = this.query('[aria-invalid="true"]');
        this.focus(invalid?.matches('input') ? invalid : invalid?.querySelector<HTMLElement>('input'));
      },
      { injector: this.injector },
    );
  }

  private focus(target: string | HTMLElement | null | undefined): void {
    (typeof target === 'string' ? this.query(target) : target)?.focus();
  }

  private query(selector: string): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(selector);
  }
}

/**
 * Sidebar status of a section: save errors first, then saves in flight, then "done" for
 * completed sections (valid, reachable and not the one on screen).
 */
function sectionStatus(
  section: SchemaSection,
  form: RequestForm,
  states: Readonly<Record<string, QuestionSaveState>>,
  completed: boolean,
): NavItemStatus {
  const fieldStates = section.fields.map((field) => states[field.id]).filter(Boolean);
  if (fieldStates.includes('error')) return 'error';
  if (fieldStates.some((state) => IN_FLIGHT.includes(state))) return 'saving';
  return completed && form.controls[section.id].valid ? 'done' : 'none';
}
