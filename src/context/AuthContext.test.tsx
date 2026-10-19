import { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import { AuthContext, AuthProvider } from './AuthContext';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.reject(new Error('storage unavailable')),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}));

function SessionState() {
  const auth = useContext(AuthContext);
  if (auth?.isLoading) return <p>Loading</p>;
  return <p>{auth?.session ? 'Signed in' : 'Signed out'}</p>;
}

describe('AuthProvider', () => {
  it('finishes loading as signed out when the stored session cannot be read', async () => {
    render(
      <AuthProvider>
        <SessionState />
      </AuthProvider>
    );
    expect(await screen.findByText('Signed out')).toBeInTheDocument();
  });
});
