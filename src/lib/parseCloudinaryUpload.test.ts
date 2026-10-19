import { describe, expect, it } from 'vitest';
import { parseCloudinaryUpload } from './parseCloudinaryUpload';

const response = {
  secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/penny/a.jpg',
  public_id: 'penny/a',
  width: 1200,
  height: 800,
  format: 'jpg',
};

describe('parseCloudinaryUpload', () => {
  it('maps the fields the app uses', () => {
    expect(parseCloudinaryUpload(response)).toEqual({
      url: response.secure_url,
      publicId: 'penny/a',
      width: 1200,
      height: 800,
    });
  });

  it('rejects a response that is not an object', () => {
    expect(() => parseCloudinaryUpload(null)).toThrow('not an object');
    expect(() => parseCloudinaryUpload('ok')).toThrow('not an object');
  });

  it.each(['secure_url', 'public_id', 'width', 'height'])('rejects a response without %s', (field) => {
    const rest: Record<string, unknown> = { ...response };
    delete rest[field];
    expect(() => parseCloudinaryUpload(rest)).toThrow(`no ${field}`);
  });

  it('rejects a width sent as a string', () => {
    expect(() => parseCloudinaryUpload({ ...response, width: '1200' })).toThrow('no width');
  });
});
