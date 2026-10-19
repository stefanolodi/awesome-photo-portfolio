import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, type AuthContextValue } from '../context/AuthContext';

type Options = { path?: string; isOwner?: boolean; auth?: Partial<AuthContextValue> };

export function renderWithProviders(ui: ReactElement, { path = '/', isOwner = false, auth: authOverrides }: Options = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const auth: AuthContextValue = {
    session: null,
    isOwner,
    isLoading: false,
    signIn: () => Promise.resolve({ error: null }),
    signOut: () => Promise.resolve({ error: null }),
    ...authOverrides,
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
