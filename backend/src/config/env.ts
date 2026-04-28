export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  return 'development-only-secret';
}

export function getFrontendOrigins(): string[] {
  const origins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === 'production') {
    origins.push('app://autotraq');
  }

  if (process.env.NODE_ENV === 'production' && origins.length === 0) {
    throw new Error('FRONTEND_URL is required in production');
  }

  return [...new Set(origins)];
}
