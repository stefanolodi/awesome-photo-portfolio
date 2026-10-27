import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';
import handler from './delete-cloudinary-asset';

const OWNER_ID = 'owner-id';

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: (token: string) => {
        const ids: Record<string, string> = { 'owner-token': 'owner-id', 'stranger-token': 'stranger-id' };
        const id = ids[token];
        return Promise.resolve({ data: { user: id ? { id } : null } });
      },
    },
  }),
}));

vi.mock('cloudinary', () => ({
  v2: {
    config: () => {},
    api: { delete_resources: vi.fn(() => Promise.resolve({ deleted: {} })) },
  },
}));

function call(authorization?: string, body: unknown = { publicIds: ['photo-1'] }) {
  const req = { method: 'DELETE', headers: { authorization }, body } as VercelRequest;
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return handler(req, res as unknown as VercelResponse).then(() => res);
}

beforeEach(() => {
  vi.stubEnv('OWNER_USER_ID', OWNER_ID);
  vi.mocked(cloudinary.api.delete_resources).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('delete-cloudinary-asset', () => {
  it('returns 401 without a token', async () => {
    const res = await call();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(cloudinary.api.delete_resources).not.toHaveBeenCalled();
  });

  it('returns 401 for a token Supabase rejects', async () => {
    const res = await call('Bearer bad-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(cloudinary.api.delete_resources).not.toHaveBeenCalled();
  });

  it('returns 403 for a signed-in user who is not the owner', async () => {
    const res = await call('Bearer stranger-token');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(cloudinary.api.delete_resources).not.toHaveBeenCalled();
  });

  it('returns 403 for everyone when OWNER_USER_ID is unset', async () => {
    vi.stubEnv('OWNER_USER_ID', '');
    const res = await call('Bearer owner-token');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(cloudinary.api.delete_resources).not.toHaveBeenCalled();
  });

  it('deletes the assets for the owner', async () => {
    const res = await call('Bearer owner-token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(cloudinary.api.delete_resources).toHaveBeenCalledWith(['photo-1']);
  });

  it.each([
    ['a missing publicIds', {}],
    ['an empty publicIds', { publicIds: [] }],
    ['a publicIds that is not a list of strings', { publicIds: [42] }],
  ])('returns 400 for %s', async (_case, body) => {
    const res = await call('Bearer owner-token', body);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(cloudinary.api.delete_resources).not.toHaveBeenCalled();
  });

  it('splits 250 ids into calls of at most 100', async () => {
    const ids = Array.from({ length: 250 }, (_, i) => `photo-${i}`);
    const res = await call('Bearer owner-token', { publicIds: ids });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(vi.mocked(cloudinary.api.delete_resources).mock.calls.map(([chunk]) => chunk)).toEqual([
      ids.slice(0, 100),
      ids.slice(100, 200),
      ids.slice(200),
    ]);
  });
});
