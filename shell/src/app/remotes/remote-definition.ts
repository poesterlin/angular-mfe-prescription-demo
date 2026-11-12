// Runs in main.ts before Angular is loaded, so it must not import Angular.

/** One entry of the Remote Manifest (`remotes.json`). */
export interface RemoteDefinition {
  /** Federation name declared by the Remote. */
  readonly name: string;
  /** Absolute URL of the Remote's `remoteEntry.json`. */
  readonly remoteEntry: string;
  /** Exposed module whose default export is a `Routes` array, e.g. `./routes`. */
  readonly exposedModule: string;
  /** Shell route path the Remote is mounted under, without a leading slash. */
  readonly routePath: string;
  /** Navigation label. */
  readonly label: string;
}

const REQUIRED_FIELDS = ['name', 'remoteEntry', 'exposedModule', 'routePath', 'label'] as const;

function isRemoteDefinition(value: unknown): value is RemoteDefinition {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return REQUIRED_FIELDS.every((field) => typeof record[field] === 'string' && record[field] !== '');
}

/**
 * Turns the parsed `remotes.json` into Remote definitions. Invalid entries are skipped
 * and logged; anything that is not a list means "no Remotes" (AC-M2).
 */
export function parseManifest(
  manifest: unknown,
  warn: (message: string, entry?: unknown) => void = console.warn,
): RemoteDefinition[] {
  if (!Array.isArray(manifest)) {
    warn('Remote Manifest is not a list; starting without Remotes.', manifest);
    return [];
  }
  return manifest.filter((entry: unknown) => {
    const valid = isRemoteDefinition(entry);
    if (!valid) {
      warn('Skipping invalid Remote Manifest entry.', entry);
    }
    return valid;
  });
}
