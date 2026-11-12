import { Routes } from '@angular/router';

/**
 * Standalone Harness routes. The Remote is mounted at a different path than the Shell
 * uses, so absolute navigation inside the Remote fails here too.
 */
export const routes: Routes = [
  {
    path: 'sandbox/prescriptions',
    loadChildren: () => import('./prescriptions/prescription.routes'),
  },
  { path: '', pathMatch: 'full', redirectTo: 'sandbox/prescriptions' },
  {
    path: '**',
    title: 'Not found',
    loadComponent: () => import('./not-found').then((m) => m.NotFound),
  },
];
