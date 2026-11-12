import type { Routes } from '@angular/router';

/** Welcome, then one route per Remote; unknown paths go back to Welcome (AC-S5). */
export function buildRoutes(remoteRoutes: Routes): Routes {
  return [
    {
      path: '',
      pathMatch: 'full',
      title: 'Welcome',
      loadComponent: () => import('./welcome/welcome').then((m) => m.Welcome),
    },
    ...remoteRoutes,
    { path: '**', redirectTo: '' },
  ];
}
