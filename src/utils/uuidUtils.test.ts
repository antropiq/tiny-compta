import { describe, it, expect } from 'vitest';
import { UuidUtils } from './uuidUtils';

describe('UuidUtils', () => {
  it('should generate a valid UUID v4', () => {
    const uuid = UuidUtils.generate();
    
    // UUID v4 regex
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    expect(uuid).toMatch(uuidV4Regex);
    expect(uuid.length).toBe(36);
  });

  it('should generate different UUIDs on consecutive calls', () => {
    const uuid1 = UuidUtils.generate();
    const uuid2 = UuidUtils.generate();
    
    expect(uuid1).not.toBe(uuid2);
  });
});
