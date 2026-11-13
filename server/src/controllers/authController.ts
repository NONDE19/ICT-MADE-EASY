import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import {
  AuthenticatedUser,
  JwtPayload,
  signAccessToken,
  signRefreshToken,
  UserRole,
} from '../middleware/auth.js';
import { loginSchema, refreshSchema } from '../validators/schemas.js';
import { recordAuditLog } from '../services/auditService.js';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.parse(req.body);
    const identifier = parsed.identifier.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: {
        school: {
          select: { id: true, name: true, code: true, isActive: true },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials or inactive account.' });
      return;
    }

    if (user.school && !user.school.isActive && user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Your school account is currently deactivated. Contact an administrator.' });
      return;
    }

    const validPassword = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!validPassword) {
      await recordAuditLog({
        userId: user.id,
        schoolId: user.schoolId,
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user.id,
        details: 'Incorrect password attempt',
        ipAddress: req.ip,
      });
      res.status(401).json({ error: 'Invalid credentials or inactive account.' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role as UserRole,
      schoolId: user.schoolId,
    };

    const accessToken = signAccessToken(authUser);
    const refreshToken = signRefreshToken(authUser);

    await recordAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
      details: `Signed in as ${user.role}`,
      ipAddress: req.ip,
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        ...authUser,
        school: user.school,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as JwtPayload;

    if (decoded.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid refresh token.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        school: {
          select: { id: true, name: true, code: true, isActive: true },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Account unavailable.' });
      return;
    }

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role as UserRole,
      schoolId: user.schoolId,
    };

    res.json({
      accessToken: signAccessToken(authUser),
      refreshToken: signRefreshToken(authUser),
      user: {
        ...authUser,
        school: user.school,
      },
    });
  } catch {
    res.status(401).json({ error: 'Refresh token expired or invalid.' });
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        schoolId: true,
        lastLoginAt: true,
        school: {
          select: { id: true, name: true, code: true, province: true, district: true },
        },
      },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      await recordAuditLog({
        userId: req.user.id,
        schoolId: req.user.schoolId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: req.user.id,
        details: 'User signed out',
        ipAddress: req.ip,
      });
    }
    res.json({ message: 'Signed out successfully.' });
  } catch (err) {
    next(err);
  }
}
