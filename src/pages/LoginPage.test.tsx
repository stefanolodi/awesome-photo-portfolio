import { fireEvent, screen } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import { renderWithProviders } from '../test/renderWithProviders';

vi.mock('../lib/supabase', () => ({ supabase: {} }));

describe('LoginPage', () => {
  it('tells the owner when the sign in request throws, and lets them try again', async () => {
    const signIn = () => Promise.reject(new Error('offline'));
    const { container } = renderWithProviders(<LoginPage />, { path: '/login', auth: { signIn } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'owner@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.submit(container.querySelector('form')!);

    expect(await screen.findByText('Could not reach the server. Try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });
});
