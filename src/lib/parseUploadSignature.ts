export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export function parseUploadSignature(data: unknown): UploadSignature {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Upload signature is not an object');
  }
  const { signature, timestamp, apiKey, cloudName, folder } = data as Record<string, unknown>;
  if (typeof signature !== 'string') throw new Error('Upload signature has no signature');
  if (typeof timestamp !== 'number') throw new Error('Upload signature has no timestamp');
  if (typeof apiKey !== 'string') throw new Error('Upload signature has no apiKey');
  if (typeof cloudName !== 'string') throw new Error('Upload signature has no cloudName');
  if (typeof folder !== 'string') throw new Error('Upload signature has no folder');
  return { signature, timestamp, apiKey, cloudName, folder };
}
