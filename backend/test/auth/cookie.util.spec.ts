import {
  getCookieDomain,
  getAuthCookieOptions,
  clearAuthCookie,
} from '../../src/common/utils/cookie.util';

describe('Cookie Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getCookieDomain', () => {
    it('should return COOKIE_DOMAIN if set with leading dot', () => {
      process.env.COOKIE_DOMAIN = '.thalassabemestar.com.br';
      expect(getCookieDomain()).toBe('.thalassabemestar.com.br');
    });

    it('should add leading dot to COOKIE_DOMAIN if missing', () => {
      process.env.COOKIE_DOMAIN = 'thalassabemestar.com.br';
      expect(getCookieDomain()).toBe('.thalassabemestar.com.br');
    });

    it('should auto-detect parent domain from FRONTEND_URL with .com.br', () => {
      delete process.env.COOKIE_DOMAIN;
      process.env.FRONTEND_URL = 'https://finance.thalassabemestar.com.br';
      expect(getCookieDomain()).toBe('.thalassabemestar.com.br');
    });

    it('should auto-detect parent domain from FRONTEND_URL with standard TLD', () => {
      delete process.env.COOKIE_DOMAIN;
      process.env.FRONTEND_URL = 'https://app.example.com';
      expect(getCookieDomain()).toBe('.example.com');
    });

    it('should return undefined for localhost', () => {
      delete process.env.COOKIE_DOMAIN;
      process.env.FRONTEND_URL = 'http://localhost:3000';
      expect(getCookieDomain()).toBeUndefined();
    });

    it('should return undefined for IP address', () => {
      delete process.env.COOKIE_DOMAIN;
      process.env.FRONTEND_URL = 'http://192.168.1.100:3000';
      expect(getCookieDomain()).toBeUndefined();
    });
  });

  describe('getAuthCookieOptions', () => {
    it('should configure production options with secure and domain', () => {
      process.env.NODE_ENV = 'production';
      process.env.FRONTEND_URL = 'https://finance.thalassabemestar.com.br';
      delete process.env.COOKIE_DOMAIN;

      const options = getAuthCookieOptions({ httpOnly: true, maxAge: 900000 });

      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
      expect(options.sameSite).toBe('lax');
      expect(options.domain).toBe('.thalassabemestar.com.br');
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(900000);
    });

    it('should support non-httpOnly option for client accessible cookies', () => {
      const options = getAuthCookieOptions({ httpOnly: false });
      expect(options.httpOnly).toBe(false);
    });
  });

  describe('clearAuthCookie', () => {
    it('should clear cookie with root path and domain if applicable', () => {
      process.env.COOKIE_DOMAIN = '.thalassabemestar.com.br';
      const mockRes: any = {
        clearCookie: jest.fn(),
      };

      clearAuthCookie(mockRes, 'access_token');

      expect(mockRes.clearCookie).toHaveBeenCalledWith('access_token', { path: '/' });
      expect(mockRes.clearCookie).toHaveBeenCalledWith('access_token', {
        path: '/',
        domain: '.thalassabemestar.com.br',
      });
    });
  });
});
