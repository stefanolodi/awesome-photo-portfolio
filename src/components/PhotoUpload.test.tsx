import { fireEvent, screen } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { PhotoUpload } from './PhotoUpload';
import { renderWithProviders } from '../test/renderWithProviders';

vi.mock('../lib/supabase', () => ({ supabase: {} }));

vi.mock('../lib/cloudinary', () => ({
  getUploadSignature: () => Promise.reject(new Error('Failed to get upload signature (500)')),
  uploadToCloudinary: vi.fn(),
}));

describe('PhotoUpload', () => {
  it('tells the owner when the upload cannot start, and lets them try again', async () => {
    const session = { access_token: 'token' } as Session;
    const { container } = renderWithProviders(<PhotoUpload albumId="album-1" />, { isOwner: true, auth: { session } });
    const file = new File(['pixels'], 'beach.jpg', { type: 'image/jpeg' });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload 1 photo' }));

    expect(await screen.findByText('The upload could not start. Try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload 1 photo' })).toBeEnabled();
  });
});
