import { expect, test } from '../fixtures';
import { REMOTE_URL } from '../urls';

interface RemoteEntry {
  name: string;
  exposes: { key: string }[];
}

test('AC-I1 the Remote is named "prescription" and exposes only ./routes', async ({
  request,
}) => {
  const response = await request.get(`${REMOTE_URL}/remoteEntry.json`);
  expect(response.ok()).toBe(true);

  const entry = (await response.json()) as RemoteEntry;
  expect(entry.name).toBe('prescription');
  expect(entry.exposes.map((e) => e.key)).toEqual(['./routes']);
});
