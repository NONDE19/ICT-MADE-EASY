import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export type UserRole = 'ADMIN' | 'TEACHER' | 'PUPIL';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  schoolId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  schoolId: string | null;
  type: 'access' | 'refresh';
}

export function signAccessToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      schoolId: user.schoolId,
      type: 'access',
    } satisfies JwtPayload,
    env.jwtSecret,
    { expiresIn: env.accessTokenExpiry as jwt.SignOptions['expiresIn'] }
  );
}

export function signRefreshToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      schoolId: user.schoolId,
      type: 'refresh',
    } satisfies JwtPayload,
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenExpiry as jwt.SignOptions['expiresIn'] }
  );
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }

    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    if (decoded.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        schoolId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Account is inactive or no longer exists.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role as UserRole,
      schoolId: user.schoolId,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid token.' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'You do not have permission to perform this action.' });
      return;
    }
    next();
  };
}
