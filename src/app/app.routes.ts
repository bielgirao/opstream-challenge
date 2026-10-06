import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'ui',
    title: 'UI components',
    loadComponent: () =>
      import('./features/ui-playground/ui-playground.page').then((m) => m.UiPlaygroundPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'ui' },
];
