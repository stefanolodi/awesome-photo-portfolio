import { useState, useRef, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCreateAlbum, useUpdateAlbum, type AlbumInput } from '../hooks/useAlbums';
import { getUploadSignature, uploadToCloudinary, deleteCloudinaryAsset } from '../lib/cloudinary';
import type { Album } from '../types';

interface Props {
  album?: Album;
  onClose: () => void;
}

export function AlbumForm({ album, onClose }: Props) {
  const { session } = useAuth();
  const createAlbum = useCreateAlbum();
  const updateAlbum = useUpdateAlbum();
  const isEdit = !!album;

  const [title, setTitle] = useState(album?.title ?? '');
  const [description, setDescription] = useState(album?.description ?? '');
  const [eventDate, setEventDate] = useState(album?.eventDate ?? '');
  const [isPrivate, setIsPrivate] = useState(album?.isPrivate ?? true);
  const [coverPreview, setCoverPreview] = useState(album?.cover ?? '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isDragover, setIsDragover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCoverFile = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCoverFile(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragover(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleCoverFile(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate) return;
    setIsSubmitting(true);
    setError('');

    try {
      let coverUrl = album?.cover ?? '';
      let coverPublicId = album?.coverPublicId ?? '';

      if (coverFile && session) {
        const sig = await getUploadSignature(session.access_token);

        if (isEdit && album?.coverPublicId) {
          await deleteCloudinaryAsset(album.coverPublicId, session.access_token).catch(() => {});
        }

        const result = await uploadToCloudinary(coverFile, sig);
        coverUrl = result.url;
        coverPublicId = result.publicId;
      }

      const input: AlbumInput = { title, description, eventDate, isPrivate, coverUrl, coverPublicId };

      if (isEdit && album) {
        await updateAlbum.mutateAsync({ id: album.id, ...input });
      } else {
        await createAlbum.mutateAsync(input);
      }

      onClose();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="panel-overlay">
      <div className="panel-backdrop" onClick={onClose} />
      <div className="panel-body" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit album' : 'New album'}>
        <div className="panel-header">
          <h2 className="panel-title">{isEdit ? 'Edit album' : 'New album'}</h2>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="panel-scroll" onSubmit={handleSubmit} id="album-form">
          {error && <p className="login-error">{error}</p>}

          <div className="field">
            <label className="field-label" htmlFor="album-title">Title</label>
            <input
              id="album-title"
              type="text"
              className="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Album title"
              required
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="album-desc">Description</label>
            <textarea
              id="album-desc"
              className="field-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this album…"
              rows={3}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="album-date">Event date</label>
            <input
              id="album-date"
              type="date"
              className="field-input"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Cover image</label>
            {coverPreview ? (
              <div className="cover-upload-preview" onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }}>
                <img src={coverPreview} alt="Cover preview" />
                <div className="cover-upload-replace">Click to replace</div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
              </div>
            ) : (
              <div
                className={`cover-upload-zone${isDragover ? ' is-dragover' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragover(true); }}
                onDragLeave={() => setIsDragover(false)}
                onDrop={onDrop}
              >
                <input type="file" accept="image/*" onChange={onFileChange} />
                <div className="cover-upload-prompt">
                  <strong>Drop an image or click to browse</strong>
                  JPEG, PNG, WEBP
                </div>
              </div>
            )}
          </div>

          <div className="field">
            <div className="privacy-field">
              <label className="toggle-switch" htmlFor="album-private">
                <input
                  id="album-private"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <span className="toggle-track" />
              </label>
              <div>
                <p className="privacy-label">Private album</p>
                <p className="privacy-hint">Only you can see this album when private.</p>
              </div>
            </div>
          </div>
        </form>

        <div className="panel-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="album-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner" /> : isEdit ? 'Save changes' : 'Create album'}
          </button>
        </div>
      </div>
    </div>
  );
}
