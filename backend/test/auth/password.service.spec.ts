import { PasswordService } from '../../src/modules/auth/password.service';

describe('PasswordService (Argon2id)', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  it('should hash password using Argon2id', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await passwordService.hash(rawPassword);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('should verify correct password successfully', async () => {
    const rawPassword = 'MySecretPassword#456';
    const hash = await passwordService.hash(rawPassword);

    const isValid = await passwordService.verify(hash, rawPassword);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const rawPassword = 'MySecretPassword#456';
    const hash = await passwordService.hash(rawPassword);

    const isValid = await passwordService.verify(hash, 'WrongPassword#999');
    expect(isValid).toBe(false);
  });
});
