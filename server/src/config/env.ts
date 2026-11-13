import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const devFallbackSecret = crypto
  .createHash('sha256')
  .update(process.cwd() + '_virtuolab_dev_jwt')
  .digest('hex');

const devFallbackRefresh = crypto
  .createHash('sha256')
  .update(process.cwd() + '_virtuolab_dev_refresh')
  .digest('hex');

function resolveSecret(envKey: string, fallback: string): string {
  const value = process.env[envKey];
  if (value && value !== 'change-this-in-production-use-a-long-random-string' && value !== 'change-this-refresh-secret-in-production') {
    return value;
  }
  if (isProduction) {
    throw new Error(`FATAL: ${envKey} must be set to a secure secret in production.`);
  }
  return fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT || 3000),
  jwtSecret: resolveSecret('JWT_SECRET', devFallbackSecret),
  jwtRefreshSecret: resolveSecret('JWT_REFRESH_SECRET', devFallbackRefresh),
  accessTokenExpiry: '2h',
  refreshTokenExpiry: '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
};
