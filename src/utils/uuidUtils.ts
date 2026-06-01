import { v4 as uuidv4 } from 'uuid';

export class UuidUtils {
  /**
   * Generates a fresh UUID v4.
   * @returns A string representing a fresh UUID v4.
   */
  static generate(): string {
    return uuidv4();
  }
}
