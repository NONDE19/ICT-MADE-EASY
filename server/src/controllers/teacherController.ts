import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { createExerciseSchema } from '../validators/schemas.js';
import { AppError } from '../middleware/errorHandler.js';
import { recordAuditLog } from '../services/auditService.js';

export async function getTeacherDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teacherId = req.user!.id;
    const schoolId = req.user!.schoolId;

    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId },
      include: {
        classObj: {
          include: {
            school: { select: { id: true, name: true } },
            memberships: {
              include: {
                pupil: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    username: true,
                    lastLoginAt: true,
                    learningProgress: true,
                    assessmentResults: {
                      orderBy: { gradedAt: 'desc' },
                      include: {
                        attempt: {
                          select: {
                            attemptType: true,
                            exercise: { select: { id: true, title: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            exercises: {
              include: {
                module: { select: { number: true, title: true } },
                _count: { select: { attempts: true } },
              },
            },
          },
        },
      },
    });

    const classList = assignments.map((a) => a.classObj);
    const pupilMap = new Map<
      string,
      {
        id: string;
        fullName: string;
        email: string;
        className: string;
        completedLessons: number;
        assessmentCount: number;
        averageScore: number;
        needsSupport: boolean;
        lastLoginAt: Date | null;
      }
    >();

    for (const cls of classList) {
      for (const m of cls.memberships) {
        const p = m.pupil;
        const scores = p.assessmentResults.map((r) => r.percentage);
        const avg =
          scores.length > 0
            ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
            : 0;
        const completedLessons = p.learningProgress.filter((lp) => lp.status === 'COMPLETED').length;
        const needsSupport = (scores.length > 0 && avg < 60) || completedLessons === 0;

        pupilMap.set(p.id, {
          id: p.id,
          fullName: p.fullName,
          email: p.email,
          className: cls.name,
          completedLessons,
          assessmentCount: p.assessmentResults.length,
          averageScore: avg,
          needsSupport,
          lastLoginAt: p.lastLoginAt,
        });
      }
    }

    const pupils = Array.from(pupilMap.values());
    const scoredPupils = pupils.filter((p) => p.assessmentCount > 0);
    const avgClassPerformance =
      scoredPupils.length > 0
        ? Math.round(
            (scoredPupils.reduce((acc, p) => acc + p.averageScore, 0) / scoredPupils.length) * 10
          ) / 10
        : 0;

    const assignedExercises = await prisma.practicalExercise.findMany({
      where: {
        OR: [
          { createdById: teacherId },
          { classId: { in: classList.map((c) => c.id) } },
          { classId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        module: { select: { number: true, title: true } },
        targetClass: { select: { id: true, name: true } },
        criteria: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { attempts: true } },
      },
    });

    const pupilIds = pupils.map((p) => p.id);
    const recentAssessmentActivities =
      pupilIds.length > 0
        ? await prisma.assessmentResult.findMany({
            where: { pupilId: { in: pupilIds } },
            take: 15,
            orderBy: { gradedAt: 'desc' },
            include: {
              pupil: { select: { id: true, fullName: true } },
              attempt: {
                select: {
                  attemptType: true,
                  exercise: { select: { title: true, level: true } },
                },
              },
            },
          })
        : [];

    const activeAssignments = assignedExercises.filter(
      (e) => !e.deadline || new Date(e.deadline) >= new Date()
    ).length;

    const completedAssignmentsCount = recentAssessmentActivities.filter((r) => r.passed).length;

    res.json({
      schoolId,
      stats: {
        assignedClassesCount: classList.length,
        totalPupils: pupils.length,
        activeAssignments,
        completedAssignments: completedAssignmentsCount,
        avgClassPerformance,
        pupilsRequiringAttention: pupils.filter((p) => p.needsSupport).length,
      },
      classes: classList.map((c) => ({
        id: c.id,
        name: c.name,
        gradeLevel: c.gradeLevel,
        schoolName: c.school.name,
        pupilCount: c.memberships.length,
        exerciseCount: c.exercises.length,
      })),
      pupils,
      exercises: assignedExercises,
      recentAssessmentActivities,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPupilDetailForTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const teacherId = req.user!.id;
    const pupilId = String(req.params.pupilId);

    // Ensure school-level and class-level authorization
    const sharedMembership = await prisma.classMembership.findFirst({
      where: {
        pupilId,
        classObj: {
          teacherAssignments: {
            some: { teacherId },
          },
        },
      },
      include: {
        classObj: { select: { name: true, schoolId: true } },
      },
    });

    if (!sharedMembership && req.user!.role !== 'ADMIN') {
      throw new AppError('Access denied: Pupil is not in your assigned classes.', 403);
    }

    const pupil = await prisma.user.findUnique({
      where: { id: pupilId },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        lastLoginAt: true,
        learningProgress: {
          include: {
            module: { select: { number: true, title: true } },
            lesson: { select: { title: true } },
          },
        },
        assessmentResults: {
          orderBy: { gradedAt: 'desc' },
          include: {
            attempt: {
              include: {
                exercise: { select: { title: true, level: true } },
              },
            },
          },
        },
      },
    });

    if (!pupil) throw new AppError('Pupil not found.', 404);
    res.json({ pupil, className: sharedMembership?.classObj.name ?? 'All Classes' });
  } catch (err) {
    next(err);
  }
}

export async function createTeacherExercise(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const teacherId = req.user!.id;
    const data = createExerciseSchema.parse(req.body);

    if (data.classId) {
      const assigned = await prisma.teacherAssignment.findFirst({
        where: { classId: data.classId, teacherId },
      });
      if (!assigned && req.user!.role !== 'ADMIN') {
        throw new AppError('You can only assign exercises to your own classes.', 403);
      }
    }

    const criteriaList = data.criteria && data.criteria.length > 0 ? data.criteria : [];
    const totalMarks =
      criteriaList.length > 0
        ? criteriaList.reduce((sum, c) => sum + c.marks, 0)
        : data.totalMarks;

    const exercise = await prisma.practicalExercise.create({
      data: {
        moduleId: data.moduleId,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        formLevel: data.formLevel ?? 1,
        syllabusCode: data.syllabusCode ?? '1.3',
        level: data.level,
        totalMarks,
        deadline: data.deadline ? new Date(data.deadline) : null,
        classId: data.classId ?? null,
        createdById: teacherId,
        criteria: {
          create: criteriaList.map((c, idx) => ({
            orderIndex: idx + 1,
            label: c.label,
            ruleType: c.ruleType,
            rulePayload: JSON.stringify(c.rulePayload),
            marks: c.marks,
            hintText: c.hintText || '',
          })),
        },
      },
      include: {
        criteria: true,
        module: { select: { number: true, title: true } },
        targetClass: { select: { id: true, name: true } },
      },
    });

    // Notify enrolled pupils if targeted to a class
    if (data.classId) {
      const members = await prisma.classMembership.findMany({
        where: { classId: data.classId },
        select: { pupilId: true },
      });
      if (members.length > 0) {
        await prisma.notification.createMany({
          data: members.map((m) => ({
            userId: m.pupilId,
            title: `New Practical Exercise: ${exercise.title}`,
            message: data.deadline
              ? `Assigned by ${req.user!.fullName}. Due by ${new Date(data.deadline).toLocaleDateString()}.`
              : `Assigned by ${req.user!.fullName}.`,
            category: 'ASSIGNMENT',
          })),
        });
      }
    }

    await recordAuditLog({
      userId: teacherId,
      schoolId: req.user!.schoolId,
      action: 'CREATE_EXERCISE',
      entity: 'PracticalExercise',
      entityId: exercise.id,
      details: `Created exercise "${exercise.title}" (Level ${exercise.level})`,
      ipAddress: req.ip,
    });

    res.status(201).json({ exercise });
  } catch (err) {
    next(err);
  }
}
