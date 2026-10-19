import { screen } from '@testing-library/react';
import { App } from '../App';
import type { FakeDatabase } from '../test/fakeSupabase';
import { renderWithProviders } from '../test/renderWithProviders';

// GateLock reads the password when the module loads, so the env stub has to run before the imports.
vi.hoisted(() => {
  vi.stubEnv('VITE_GUEST_PASSWORD', 'letmein');
});

const db = vi.hoisted((): FakeDatabase => ({ albums: [], photos: [] }));

vi.mock('../lib/supabase', async () => {
  const { fakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: fakeSupabase(db) };
});

beforeEach(() => {
  sessionStorage.clear();
});

const gate = () => screen.queryByRole('dialog', { name: 'Password gate' });

// The App renders every route, so a route moved outside GateLock fails here.
describe('Rule 5: the gate covers every page except /login, and the owner skips it', () => {
  it.each(['/', '/album/some-album', '/no-such-page'])('shows the gate to a guest at %s', (path) => {
    renderWithProviders(<App />, { path });
    expect(gate()).toBeInTheDocument();
  });

  it('leaves /login open to a guest', () => {
    renderWithProviders(<App />, { path: '/login' });
    expect(gate()).not.toBeInTheDocument();
  });

  it.each(['/', '/album/some-album'])('lets the owner skip the gate at %s', (path) => {
    renderWithProviders(<App />, { path, isOwner: true });
    expect(gate()).not.toBeInTheDocument();
  });
});
