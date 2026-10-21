import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

@Injectable()
export class PasswordService {
  // OWASP-recommended parameters for Argon2id: 19 MiB memory, 2 iterations, 1 parallelism thread
  private readonly argon2Options = {
    memoryCost: 19456, // 19 MiB in KiB
    timeCost: 2,
    parallelism: 1,
  };

  /**
   * Hashes a plaintext password using Argon2id
   */
  async hash(password: string): Promise<string> {
    return hash(password, this.argon2Options);
  }

  /**
   * Verifies a plaintext password against an Argon2id hash string
   */
  async verify(hashStr: string, password: string): Promise<boolean> {
    try {
      return await verify(hashStr, password);
    } catch {
      return false;
    }
  }
}
