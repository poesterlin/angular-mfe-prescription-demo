import { Routes } from '@angular/router';
import { MockPrescriptionApi } from './data-access/mock-prescription-api';
import { PrescriptionApi } from './data-access/prescription-api';

/**
 * The Remote's only public API (exposed as `./routes`). The Shell or the Standalone
 * Harness mounts it under any path; everything inside navigates relative to it.
 */
const prescriptionRoutes: Routes = [
  {
    path: '',
    title: 'Prescriptions',
    // Swapping the mock for an HTTP implementation changes only this line (C-A10).
    providers: [{ provide: PrescriptionApi, useClass: MockPrescriptionApi }],
    loadComponent: () => import('./feature/prescription-page').then((m) => m.PrescriptionPage),
  },
];

export default prescriptionRoutes;
