export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export async function getUploadSignature(authToken: string): Promise<UploadSignature> {
  const response = await fetch('/api/sign-cloudinary-upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to get upload signature (${response.status}): ${body}`);
  }
  return response.json();
}

export function uploadToCloudinary(
  file: File,
  sig: UploadSignature,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sig.apiKey);
    formData.append('timestamp', String(sig.timestamp));
    formData.append('signature', sig.signature);
    formData.append('folder', sig.folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
        });
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload network error'));
    xhr.send(formData);
  });
}

export async function deleteCloudinaryAsset(publicId: string, authToken: string): Promise<void> {
  const response = await fetch('/api/delete-cloudinary-asset', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publicId }),
  });
  if (!response.ok) throw new Error('Failed to delete asset');
}
