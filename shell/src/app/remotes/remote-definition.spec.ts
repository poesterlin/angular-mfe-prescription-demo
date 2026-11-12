import { parseManifest, RemoteDefinition } from './remote-definition';

const valid: RemoteDefinition = {
  name: 'prescription',
  remoteEntry: 'http://localhost:4201/remoteEntry.json',
  exposedModule: './routes',
  routePath: 'prescriptions',
  label: 'Prescriptions',
};

describe('parseManifest', () => {
  it('AC-M1 keeps complete entries', () => {
    expect(parseManifest([valid], () => undefined)).toEqual([valid]);
  });

  it('AC-M2 skips and logs entries with missing or wrongly typed fields', () => {
    const warn = vi.fn();
    const result = parseManifest(
      [valid, { ...valid, label: 3 }, { name: 'x' }, null, 'text', { ...valid, routePath: '' }],
      warn,
    );
    expect(result).toEqual([valid]);
    expect(warn).toHaveBeenCalledTimes(5);
  });

  it('AC-M2 treats a non-list as "no Remotes"', () => {
    const warn = vi.fn();
    expect(parseManifest({ remotes: [valid] }, warn)).toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
  });
});
