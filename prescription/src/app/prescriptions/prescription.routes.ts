import { Routes } from '@angular/router';

/**
 * The Remote's only public API (exposed as `./routes`). The Shell or the Standalone
 * Harness mounts it under any path; everything inside navigates relative to it.
 */
const prescriptionRoutes: Routes = [
  {
    path: '',
    title: 'Prescriptions',
    loadComponent: () => import('./feature/prescription-page').then((m) => m.PrescriptionPage),
  },
];

export default prescriptionRoutes;
