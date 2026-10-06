import { Routes } from '@angular/router';
import {
  sectionAccessGuard,
  submittedRequestGuard,
} from './features/request-wizard/request-access.guards';

const wizard = () =>
  import('./features/request-wizard/request-wizard.page').then((m) => m.RequestWizardPage);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'requests/new' },
  {
    path: 'requests/new',
    title: 'New request',
    loadComponent: () =>
      import('./features/schema-chooser/schema-chooser.page').then((m) => m.SchemaChooserPage),
  },
  {
    path: 'requests/:requestId/summary',
    title: 'Request submitted',
    canActivate: [submittedRequestGuard],
    loadComponent: () =>
      import('./features/request-summary/request-summary.page').then((m) => m.RequestSummaryPage),
  },
  {
    path: 'requests/:requestId/sections/:sectionId',
    title: 'Request',
    canActivate: [sectionAccessGuard],
    loadComponent: wizard,
  },
  {
    // No section in the URL: the page opens the request and redirects to the right section.
    path: 'requests/:requestId',
    title: 'Request',
    canActivate: [sectionAccessGuard],
    loadComponent: wizard,
  },
  {
    path: 'ui',
    title: 'UI components',
    loadComponent: () =>
      import('./features/ui-playground/ui-playground.page').then((m) => m.UiPlaygroundPage),
  },
  { path: '**', redirectTo: 'requests/new' },
];
