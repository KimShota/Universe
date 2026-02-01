/**
 * Deep link security: validate that a URL uses an allowed scheme before processing.
 * Prevents open redirect / session fixation attacks via malicious redirect URLs.
 */
const ALLOWED_SCHEMES = ['frontend', 'exp'];

export function isValidDeepLink(url: string, allowedSchemes: string[] = ALLOWED_SCHEMES): boolean {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(':', '');
    return allowedSchemes.includes(scheme.toLowerCase());
  } catch {
    return false;
  }
}

export function parseAuthTokensFromUrl(url: string): { accessToken: string | null; refreshToken: string | null } {
  try {
    const hash = url.includes('#') ? url.split('#')[1] : '';
    const query = url.includes('?') ? url.split('?')[1] : '';
    const params = new URLSearchParams(hash || query);
    return {
      accessToken: params.get('access_token'),
      refreshToken: params.get('refresh_token'),
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}
