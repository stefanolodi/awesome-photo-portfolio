import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { AuthContext } from './context/AuthContext';
import { App } from './App';

// Mock supabase so tests don't need real env vars
vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    }),
  },
}));

const authValue = {
  session: null,
  isOwner: false,
  isLoading: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
};

function TestProviders({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <BrowserRouter>
      <QueryClientProvider client={qc}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

describe('App shell', () => {
  it('renders the owner login link for guests', async () => {
    render(<App />, { wrapper: TestProviders });
    await waitFor(() => expect(screen.getByText(/owner login/i)).toBeInTheDocument());
  });
});
