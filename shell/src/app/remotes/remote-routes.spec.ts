import type { Route, Routes } from '@angular/router';
import type { RemoteDefinition } from './remote-definition';
import { buildRemoteRoutes } from './remote-routes';

const remote: RemoteDefinition = {
  name: 'prescription',
  remoteEntry: 'http://localhost:4201/remoteEntry.json',
  exposedModule: './routes',
  routePath: 'prescriptions',
  label: 'Prescriptions',
};

async function loadChildren(route: Route): Promise<Routes> {
  const loader = route.loadChildren as () => Promise<Routes>;
  return loader();
}

describe('buildRemoteRoutes', () => {
  it('AC-S4 mounts each Remote at its route path and returns its routes', async () => {
    const remoteRoutes: Routes = [{ path: '' }];
    const [route] = buildRemoteRoutes([remote], () => Promise.resolve(remoteRoutes));

    expect(route.path).toBe('prescriptions');
    expect(await loadChildren(route)).toBe(remoteRoutes);
  });

  it('AC-E1 falls back to an "unavailable" page when loading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const [route] = buildRemoteRoutes([remote], () => Promise.reject(new Error('offline')));

    const [fallback] = await loadChildren(route);
    expect(fallback.path).toBe('**');
    expect(fallback.data).toEqual({ label: 'Prescriptions' });
  });
});
