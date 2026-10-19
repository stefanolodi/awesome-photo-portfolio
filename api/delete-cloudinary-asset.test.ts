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
    uploader: { destroy: vi.fn(() => Promise.resolve({ result: 'ok' })) },
  },
}));

function call(authorization?: string) {
  const req = { method: 'DELETE', headers: { authorization }, body: { publicId: 'photo-1' } } as VercelRequest;
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return handler(req, res as unknown as VercelResponse).then(() => res);
}

beforeEach(() => {
  vi.stubEnv('OWNER_USER_ID', OWNER_ID);
  vi.mocked(cloudinary.uploader.destroy).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('delete-cloudinary-asset', () => {
  it('returns 401 without a token', async () => {
    const res = await call();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it('returns 401 for a token Supabase rejects', async () => {
    const res = await call('Bearer bad-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it('returns 403 for a signed-in user who is not the owner', async () => {
    const res = await call('Bearer stranger-token');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it('returns 403 for everyone when OWNER_USER_ID is unset', async () => {
    vi.stubEnv('OWNER_USER_ID', '');
    const res = await call('Bearer owner-token');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it('deletes the asset for the owner', async () => {
    const res = await call('Bearer owner-token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('photo-1');
  });
});
