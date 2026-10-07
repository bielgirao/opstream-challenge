import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RequestSession, sectionRedirect } from '../../core/request';

/**
 * Wizard routes (ADR-0007):
 * - a submitted request goes to its summary;
 * - a section is only reachable when every earlier section is valid.
 *
 * When the request is not loaded yet (refresh, deep link) the guard lets the page through;
 * the page opens the request and applies the same rule (`sectionRedirect`).
 */
export const sectionAccessGuard: CanActivateFn = (route) => {
  const session = inject(RequestSession);
  const router = inject(Router);
  const requestId = route.paramMap.get('requestId') ?? '';

  if (session.isSubmitted(requestId)) {
    return router.createUrlTree(['/requests', requestId, 'summary']);
  }

  const active = session.active();
  if (active?.id !== requestId) return true;

  const target = sectionRedirect(
    active.schema,
    active.form,
    route.paramMap.get('sectionId') ?? undefined,
  );
  return target ? router.createUrlTree(['/requests', requestId, 'sections', target]) : true;
};

/** The summary only exists for submitted requests; otherwise go back to the wizard. */
export const submittedRequestGuard: CanActivateFn = (route) => {
  const requestId = route.paramMap.get('requestId') ?? '';
  return inject(RequestSession).isSubmitted(requestId)
    ? true
    : inject(Router).createUrlTree(['/requests', requestId]);
};
