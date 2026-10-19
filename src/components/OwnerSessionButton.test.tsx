import { fireEvent, screen } from '@testing-library/react';
import { AuthError } from '@supabase/supabase-js';
import { OwnerSessionButton } from './OwnerSessionButton';
import { renderWithProviders } from '../test/renderWithProviders';

vi.mock('../lib/supabase', () => ({ supabase: {} }));

describe('OwnerSessionButton', () => {
  it('tells the owner when Supabase refuses the sign out', async () => {
    const signOut = () => Promise.resolve({ error: new AuthError('offline') });
    renderWithProviders(<OwnerSessionButton />, { isOwner: true, auth: { signOut } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('button', { name: 'Sign out failed, try again' })).toBeInTheDocument();
  });

  it('tells the owner when the sign out request throws', async () => {
    const signOut = () => Promise.reject(new Error('offline'));
    renderWithProviders(<OwnerSessionButton />, { isOwner: true, auth: { signOut } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('button', { name: 'Sign out failed, try again' })).toBeInTheDocument();
  });
});
