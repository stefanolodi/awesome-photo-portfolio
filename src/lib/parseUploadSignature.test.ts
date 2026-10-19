import { describe, expect, it } from 'vitest';
import { parseUploadSignature } from './parseUploadSignature';

const payload = {
  signature: 'abc123',
  timestamp: 1700000000,
  apiKey: '123456789',
  cloudName: 'demo',
  folder: 'penny-portfolio/albums',
};

describe('parseUploadSignature', () => {
  it('returns the signature fields', () => {
    expect(parseUploadSignature(payload)).toEqual(payload);
  });

  it('rejects a payload that is not an object', () => {
    expect(() => parseUploadSignature(undefined)).toThrow('not an object');
  });

  it.each(['signature', 'timestamp', 'apiKey', 'cloudName', 'folder'])('rejects a payload without %s', (field) => {
    const rest: Record<string, unknown> = { ...payload };
    delete rest[field];
    expect(() => parseUploadSignature(rest)).toThrow(`no ${field}`);
  });
});
