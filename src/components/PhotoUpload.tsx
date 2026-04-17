import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCreatePhoto } from '../hooks/usePhotos';
import { getUploadSignature, uploadToCloudinary } from '../lib/cloudinary';

interface FileEntry {
  id: string;
  file: File;
  preview: string;
  title: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

interface Props {
  albumId: string;
  onDone?: () => void;
}

export function PhotoUpload({ albumId, onDone }: Props) {
  const { session } = useAuth();
  const createPhoto = useCreatePhoto();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragover, setIsDragover] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList) => {
    const entries: FileEntry[] = Array.from(incoming)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        preview: URL.createObjectURL(file),
        title: file.name.replace(/\.[^.]+$/, ''),
        progress: 0,
        status: 'pending' as const,
      }));
    setFiles((prev) => [...prev, ...entries]);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragover(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFile = (id: string, patch: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const handleUpload = async () => {
    if (!session || files.length === 0) return;
    setIsUploading(true);

    const sig = await getUploadSignature(session.access_token);

    await Promise.allSettled(
      files
        .filter((f) => f.status === 'pending')
        .map(async (entry) => {
          updateFile(entry.id, { status: 'uploading' });
          try {
            const result = await uploadToCloudinary(entry.file, sig, (progress) => {
              updateFile(entry.id, { progress });
            });
            await createPhoto.mutateAsync({
              albumId,
              title: entry.title,
              url: result.url,
              publicId: result.publicId,
              width: result.width,
              height: result.height,
            });
            updateFile(entry.id, { status: 'done', progress: 100 });
          } catch {
            updateFile(entry.id, { status: 'error' });
          }
        })
    );

    setIsUploading(false);
    const allDone = files.every((f) => f.status === 'done');
    if (allDone) {
      setFiles([]);
      onDone?.();
    }
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <div className="upload-section">
      <div
        className={`upload-dropzone${isDragover ? ' is-dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragover(true); }}
        onDragLeave={() => setIsDragover(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={onFileChange} />
        <div className="upload-dropzone-text">
          <div className="upload-dropzone-icon">↑</div>
          <p className="upload-dropzone-label">Drop photos here or click to browse</p>
          <p className="upload-dropzone-hint">JPEG, PNG, WEBP — multiple files supported</p>
        </div>
      </div>

      {files.length > 0 && (
        <>
          <div className="upload-file-grid">
            {files.map((entry) => (
              <div key={entry.id} className="upload-file-card">
                <div className="upload-file-thumb">
                  <img src={entry.preview} alt={entry.title} />
                  {entry.status !== 'pending' && (
                    <div className="upload-file-status">
                      {entry.status === 'uploading' && `${entry.progress}%`}
                      {entry.status === 'done' && '✓ Done'}
                      {entry.status === 'error' && '✕ Failed'}
                    </div>
                  )}
                  {entry.status === 'pending' && (
                    <button
                      type="button"
                      className="upload-file-remove"
                      onClick={(e) => { e.stopPropagation(); removeFile(entry.id); }}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="upload-file-body">
                  <input
                    type="text"
                    className="upload-file-input"
                    value={entry.title}
                    onChange={(e) => updateFile(entry.id, { title: e.target.value })}
                    placeholder="Photo title"
                    disabled={entry.status !== 'pending'}
                  />
                  <div className="upload-progress-bar">
                    <div
                      className={`upload-progress-fill${entry.status === 'done' ? ' is-done' : ''}`}
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="upload-actions">
            <button type="button" className="btn-ghost" onClick={() => setFiles([])}>Clear all</button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleUpload}
              disabled={isUploading || pendingCount === 0}
            >
              {isUploading ? <><span className="spinner" /> Uploading…</> : `Upload ${pendingCount} photo${pendingCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
