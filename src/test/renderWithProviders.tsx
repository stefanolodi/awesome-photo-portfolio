import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';

type Options = { path?: string; isOwner?: boolean };

export function renderWithProviders(ui: ReactElement, { path = '/', isOwner = false }: Options = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const auth = {
    session: null,
    isOwner,
    isLoading: false,
    signIn: () => Promise.resolve({ error: null }),
    signOut: () => Promise.resolve(),
  };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );

  return render(ui, { wrapper });
}
