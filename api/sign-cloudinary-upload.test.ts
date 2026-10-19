import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './sign-cloudinary-upload';

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
    utils: { api_sign_request: () => 'signature' },
  },
}));

function call(authorization?: string) {
  const req = { method: 'POST', headers: { authorization } } as VercelRequest;
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return handler(req, res as unknown as VercelResponse).then(() => res);
}

beforeEach(() => {
  vi.stubEnv('OWNER_USER_ID', OWNER_ID);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('sign-cloudinary-upload', () => {
  it('returns 401 without a token', async () => {
    const res = await call();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for a token Supabase rejects', async () => {
    const res = await call('Bearer bad-token');
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 for a signed-in user who is not the owner', async () => {
    const res = await call('Bearer stranger-token');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ signature: expect.anything() }));
  });

  it('returns 403 for everyone when OWNER_USER_ID is unset', async () => {
    vi.stubEnv('OWNER_USER_ID', '');
    const res = await call('Bearer owner-token');
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('signs the upload for the owner', async () => {
    const res = await call('Bearer owner-token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ signature: 'signature' }));
  });
});
