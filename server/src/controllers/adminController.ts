import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import {
  assignTeacherSchema,
  createClassSchema,
  createSchoolSchema,
  createUserSchema,
  enrollPupilSchema,
  updateSchoolSchema,
  updateUserSchema,
} from '../validators/schemas.js';
import { recordAuditLog } from '../services/auditService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getAdminOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalSchools,
      activeSchools,
      totalTeachers,
      totalPupils,
      totalClasses,
      totalModules,
      totalExercises,
      totalResults,
      recentAuditLogs,
      recentResults,
    ] = await Promise.all([
      prisma.school.count(),
      prisma.school.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'PUPIL' } }),
      prisma.class.count(),
      prisma.learningModule.count(),
      prisma.practicalExercise.count(),
      prisma.assessmentResult.count(),
      prisma.auditLog.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, role: true } },
          school: { select: { name: true } },
        },
      }),
      prisma.assessmentResult.findMany({
        take: 10,
        orderBy: { gradedAt: 'desc' },
        include: {
          pupil: {
            select: {
              fullName: true,
              school: { select: { name: true } },
            },
          },
          attempt: {
            select: {
              attemptType: true,
              exercise: { select: { title: true } },
            },
          },
        },
      }),
    ]);

    res.json({
      stats: {
        totalSchools,
        activeSchools,
        totalTeachers,
        totalPupils,
        totalClasses,
        totalModules,
        totalExercises,
        totalResults,
      },
      recentAuditLogs,
      recentResults,
    });
  } catch (err) {
    next(err);
  }
}

export async function listSchools(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, classes: true },
        },
      },
    });
    res.json({ schools });
  } catch (err) {
    next(err);
  }
}

export async function createSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createSchoolSchema.parse(req.body);
    const existing = await prisma.school.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) {
      throw new AppError('A school with this code already exists.', 409);
    }

    const school = await prisma.school.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      schoolId: school.id,
      action: 'CREATE_SCHOOL',
      entity: 'School',
      entityId: school.id,
      details: `Registered school ${school.name} (${school.code})`,
      ipAddress: req.ip,
    });

    res.status(201).json({ school });
  } catch (err) {
    next(err);
  }
}

export async function updateSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const data = updateSchoolSchema.parse(req.body);
    const school = await prisma.school.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      schoolId: school.id,
      action: 'UPDATE_SCHOOL',
      entity: 'School',
      entityId: school.id,
      details: `Updated school ${school.name} (active=${school.isActive})`,
      ipAddress: req.ip,
    });

    res.json({ school });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roleFilter = req.query.role ? String(req.query.role) : undefined;
    const schoolFilter = req.query.schoolId ? String(req.query.schoolId) : undefined;

    const users = await prisma.user.findMany({
      where: {
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(schoolFilter ? { schoolId: schoolFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        schoolId: true,
        lastLoginAt: true,
        createdAt: true,
        school: { select: { id: true, name: true, code: true } },
        classMemberships: {
          include: { classObj: { select: { id: true, name: true } } },
        },
        teacherAssignments: {
          include: { classObj: { select: { id: true, name: true } } },
        },
      },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createUserSchema.parse(req.body);
    const email = data.email.toLowerCase();
    const username = data.username.toLowerCase();

    const duplicate = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (duplicate) {
      throw new AppError('Email or username is already registered.', 409);
    }

    if ((data.role === 'TEACHER' || data.role === 'PUPIL') && !data.schoolId) {
      throw new AppError('Teachers and pupils must be assigned to a school.', 400);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
        schoolId: data.schoolId ?? null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        schoolId: true,
      },
    });

    if (data.classId) {
      if (data.role === 'PUPIL') {
        await prisma.classMembership.create({
          data: { classId: data.classId, pupilId: user.id },
        });
      } else if (data.role === 'TEACHER') {
        await prisma.teacherAssignment.create({
          data: { classId: data.classId, teacherId: user.id },
        });
      }
    }

    await recordAuditLog({
      userId: req.user?.id,
      schoolId: user.schoolId,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      details: `Created ${user.role} account for ${user.fullName}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const data = updateUserSchema.parse(req.body);

    const updateData: Record<string, unknown> = {
      ...(data.fullName ? { fullName: data.fullName } : {}),
      ...(data.role ? { role: data.role } : {}),
      ...(typeof data.isActive === 'boolean' ? { isActive: data.isActive } : {}),
      ...(data.schoolId !== undefined ? { schoolId: data.schoolId } : {}),
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        schoolId: true,
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      schoolId: user.schoolId,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user.id,
      details: `Updated user ${user.fullName} (active=${user.isActive}, role=${user.role})`,
      ipAddress: req.ip,
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function listClasses(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        school: { select: { id: true, name: true, code: true } },
        teacherAssignments: {
          include: { teacher: { select: { id: true, fullName: true, email: true } } },
        },
        _count: { select: { memberships: true, exercises: true } },
      },
    });
    res.json({ classes });
  } catch (err) {
    next(err);
  }
}

export async function createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createClassSchema.parse(req.body);
    const created = await prisma.class.create({
      data,
      include: { school: { select: { id: true, name: true } } },
    });

    await recordAuditLog({
      userId: req.user?.id,
      schoolId: created.schoolId,
      action: 'CREATE_CLASS',
      entity: 'Class',
      entityId: created.id,
      details: `Created class ${created.name} (${created.gradeLevel})`,
      ipAddress: req.ip,
    });

    res.status(201).json({ class: created });
  } catch (err) {
    next(err);
  }
}

export async function assignTeacherToClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { classId, teacherId } = assignTeacherSchema.parse(req.body);
    const [cls, teacher] = await Promise.all([
      prisma.class.findUnique({ where: { id: classId } }),
      prisma.user.findUnique({ where: { id: teacherId } }),
    ]);
    if (!cls || !teacher || teacher.role !== 'TEACHER') {
      throw new AppError('Valid class and teacher are required.', 400);
    }
    if (teacher.schoolId !== cls.schoolId) {
      throw new AppError('Teacher must belong to the same school as the class.', 400);
    }

    const assignment = await prisma.teacherAssignment.upsert({
      where: { classId_teacherId: { classId, teacherId } },
      update: {},
      create: { classId, teacherId },
    });

    await recordAuditLog({
      userId: req.user?.id,
      schoolId: cls.schoolId,
      action: 'ASSIGN_TEACHER',
      entity: 'TeacherAssignment',
      entityId: assignment.id,
      details: `Assigned ${teacher.fullName} to ${cls.name}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ assignment });
  } catch (err) {
    next(err);
  }
}

export async function enrollPupilInClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { classId, pupilId } = enrollPupilSchema.parse(req.body);
    const [cls, pupil] = await Promise.all([
      prisma.class.findUnique({ where: { id: classId } }),
      prisma.user.findUnique({ where: { id: pupilId } }),
    ]);
    if (!cls || !pupil || pupil.role !== 'PUPIL') {
      throw new AppError('Valid class and pupil are required.', 400);
    }
    if (pupil.schoolId !== cls.schoolId) {
      throw new AppError('Pupil must belong to the same school as the class.', 400);
    }

    const membership = await prisma.classMembership.upsert({
      where: { classId_pupilId: { classId, pupilId } },
      update: {},
      create: { classId, pupilId },
    });

    res.status(201).json({ membership });
  } catch (err) {
    next(err);
  }
}

export async function toggleModulePublished(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const existing = await prisma.learningModule.findUnique({ where: { id } });
    if (!existing) throw new AppError('Module not found.', 404);

    const updated = await prisma.learningModule.update({
      where: { id },
      data: { isPublished: !existing.isPublished },
    });
    res.json({ module: updated });
  } catch (err) {
    next(err);
  }
}

export async function getSystemSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSystemSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = String(req.body.key || '').trim();
    const value = String(req.body.value ?? '');
    const description = String(req.body.description ?? '');
    if (!key) throw new AppError('Setting key is required.', 400);

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, ...(description ? { description } : {}) },
      create: { key, value, description },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'UPDATE_SETTING',
      entity: 'SystemSetting',
      entityId: key,
      details: `Updated setting ${key}=${value}`,
      ipAddress: req.ip,
    });

    res.json({ setting });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, role: true, email: true } },
        school: { select: { name: true, code: true } },
      },
    });
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}
