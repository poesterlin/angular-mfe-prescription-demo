// Angular is a shared singleton and only exists once federation is initialised, so
// nothing here may import Angular.
import { initFederation } from '@angular-architects/native-federation';
import { parseManifest } from './app/remotes/remote-definition';

async function readManifest(): Promise<unknown> {
  try {
    const response = await fetch('remotes.json', { cache: 'no-cache' });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function start(): Promise<void> {
  const remotes = parseManifest(await readManifest());
  // Remotes are registered lazily on first navigation, so one broken Remote only
  // affects its own route.
  const federation = await initFederation({}, { hostRemoteEntry: { url: './remoteEntry.json' } });
  const { bootstrap } = await import('./bootstrap');
  await bootstrap(remotes, federation);
}

start().catch((err: unknown) => console.error(err));
