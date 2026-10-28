import { CookieOptions, Response } from 'express';

/**
 * Resolves the parent domain for cross-subdomain cookie sharing.
 * E.g., for frontend 'finance.thalassabemestar.com.br' and API 'finance-api.thalassabemestar.com.br',
 * returns '.thalassabemestar.com.br'.
 */
export function getCookieDomain(): string | undefined {
  if (process.env.COOKIE_DOMAIN) {
    const trimmed = process.env.COOKIE_DOMAIN.trim();
    if (trimmed) {
      return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
    }
  }

  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl && !frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
    try {
      const hostname = new URL(frontendUrl).hostname;
      // Do not set domain for plain IP addresses
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
        return undefined;
      }

      const parts = hostname.split('.');
      if (parts.length >= 3) {
        // Multi-part ccTLDs like .com.br, .org.br, .co.uk, etc.
        const secondToLast = parts[parts.length - 2];
        const commonSecondLevelDomains = ['com', 'co', 'org', 'net', 'gov', 'edu'];
        if (parts.length >= 4 && commonSecondLevelDomains.includes(secondToLast)) {
          return `.${parts.slice(-3).join('.')}`;
        }
        return `.${parts.slice(-2).join('.')}`;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

/**
 * Builds standard cookie configuration for authentication cookies.
 */
export function getAuthCookieOptions(options?: {
  httpOnly?: boolean;
  maxAge?: number;
}): CookieOptions {
  const isHttps =
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.NODE_ENV === 'production' &&
      (process.env.FRONTEND_URL?.startsWith('https') ?? false));

  const domain = getCookieDomain();
  const sameSite = (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax';

  return {
    httpOnly: options?.httpOnly ?? true,
    secure: isHttps,
    sameSite,
    path: '/',
    ...(domain ? { domain } : {}),
    ...(options?.maxAge !== undefined ? { maxAge: options.maxAge } : {}),
  };
}

/**
 * Reliably clears a cookie from both the host-only origin and the shared root domain.
 */
export function clearAuthCookie(res: Response, name: string) {
  const domain = getCookieDomain();
  res.clearCookie(name, { path: '/' });
  if (domain) {
    res.clearCookie(name, { path: '/', domain });
  }
}
