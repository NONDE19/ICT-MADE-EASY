import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { progressUpdateSchema, quizSubmitSchema } from '../validators/schemas.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getPupilDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pupilId = req.user!.id;

    const [
      modules,
      progressRecords,
      assessmentResults,
      achievements,
      notifications,
      memberships,
    ] = await Promise.all([
      prisma.learningModule.findMany({
        where: { isPublished: true },
        orderBy: { number: 'asc' },
        include: {
          lessons: {
            orderBy: { orderIndex: 'asc' },
            select: { id: true, title: true, slug: true, estimatedMins: true, offlineReady: true },
          },
          _count: { select: { questions: true, exercises: true } },
        },
      }),
      prisma.learningProgress.findMany({
        where: { pupilId },
        orderBy: { lastAccessedAt: 'desc' },
        include: {
          module: { select: { id: true, number: true, title: true, slug: true } },
          lesson: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.assessmentResult.findMany({
        where: { pupilId },
        orderBy: { gradedAt: 'desc' },
        include: {
          attempt: {
            select: {
              attemptType: true,
              moduleId: true,
              exercise: { select: { id: true, title: true, level: true } },
            },
          },
        },
      }),
      prisma.userAchievement.findMany({
        where: { userId: pupilId },
        include: { achievement: true },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.notification.findMany({
        where: { userId: pupilId },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.classMembership.findMany({
        where: { pupilId },
        select: { classId: true, classObj: { select: { name: true, gradeLevel: true } } },
      }),
    ]);

    const classIds = memberships.map((m) => m.classId);
    const assignedExercises = await prisma.practicalExercise.findMany({
      where: {
        isPublished: true,
        OR: [{ classId: null }, { classId: { in: classIds } }],
      },
      orderBy: [{ deadline: 'asc' }, { level: 'asc' }],
      include: {
        module: { select: { number: true, title: true, slug: true } },
      },
    });

    const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedLessons = progressRecords.filter(
      (p) => p.lessonId && p.status === 'COMPLETED'
    ).length;

    const completedModuleIds = new Set(
      modules
        .filter((m) => {
          if (m.lessons.length === 0) return false;
          const completedInModule = progressRecords.filter(
            (p) => p.moduleId === m.id && p.lessonId && p.status === 'COMPLETED'
          ).length;
          return completedInModule >= m.lessons.length;
        })
        .map((m) => m.id)
    );

    const overallProgressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const completedLessonIds = new Set(
      progressRecords.filter((p) => p.status === 'COMPLETED' && p.lessonId).map((p) => p.lessonId!)
    );

    const recommendedLessons = modules
      .flatMap((m) =>
        m.lessons
          .filter((l) => !completedLessonIds.has(l.id))
          .map((l) => ({
            moduleId: m.id,
            moduleNumber: m.number,
            moduleTitle: m.title,
            moduleSlug: m.slug,
            lessonId: l.id,
            lessonTitle: l.title,
            estimatedMins: l.estimatedMins,
          }))
      )
      .slice(0, 4);

    const unfinishedActivity = progressRecords.find((p) => p.status === 'IN_PROGRESS') ?? null;

    res.json({
      classes: memberships.map((m) => m.classObj),
      summary: {
        overallProgressPercent,
        completedModulesCount: completedModuleIds.size,
        totalModulesCount: modules.length,
        completedLessonsCount: completedLessons,
        totalLessonsCount: totalLessons,
        averageScore:
          assessmentResults.length > 0
            ? Math.round(
                (assessmentResults.reduce((s, r) => s + r.percentage, 0) /
                  assessmentResults.length) *
                  10
              ) / 10
            : 0,
        achievementsCount: achievements.length,
      },
      modules: modules.map((m) => {
        const doneCount = progressRecords.filter(
          (p) => p.moduleId === m.id && p.lessonId && p.status === 'COMPLETED'
        ).length;
        return {
          ...m,
          completedLessons: doneCount,
          totalLessons: m.lessons.length,
          percentComplete:
            m.lessons.length > 0 ? Math.round((doneCount / m.lessons.length) * 100) : 0,
        };
      }),
      assignedExercises,
      recentResults: assessmentResults.slice(0, 6),
      recentActivities: progressRecords.slice(0, 6),
      achievements: achievements.map((ua) => ({
        ...ua.achievement,
        earnedAt: ua.earnedAt,
      })),
      notifications,
      recommendedLessons,
      unfinishedActivity,
    });
  } catch (err) {
    next(err);
  }
}

export async function listModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const isAdminOrTeacher = req.user!.role === 'ADMIN' || req.user!.role === 'TEACHER';

    const modules = await prisma.learningModule.findMany({
      where: isAdminOrTeacher ? {} : { isPublished: true },
      orderBy: { number: 'asc' },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            slug: true,
            orderIndex: true,
            title: true,
            summary: true,
            estimatedMins: true,
            offlineReady: true,
          },
        },
        _count: { select: { questions: true, exercises: true } },
      },
    });

    const progress = await prisma.learningProgress.findMany({
      where: { pupilId: userId },
    });

    res.json({
      modules: modules.map((m) => {
        const completedInModule = progress.filter(
          (p) => p.moduleId === m.id && p.lessonId && p.status === 'COMPLETED'
        ).length;
        return {
          ...m,
          completedLessons: completedInModule,
          totalLessons: m.lessons.length,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

export async function getModuleBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slug = String(req.params.slug);
    const pupilId = req.user!.id;

    const moduleObj = await prisma.learningModule.findUnique({
      where: { slug },
      include: {
        lessons: { orderBy: { orderIndex: 'asc' } },
        resources: true,
        questions: {
          select: {
            id: true,
            questionText: true,
            optionsJson: true,
            marks: true,
            difficulty: true,
          },
        },
        exercises: {
          where: { isPublished: true },
          orderBy: { level: 'asc' },
          include: {
            criteria: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    if (!moduleObj) throw new AppError('Learning module not found.', 404);

    const progress = await prisma.learningProgress.findMany({
      where: { pupilId, moduleId: moduleObj.id },
    });

    res.json({ module: moduleObj, progress });
  } catch (err) {
    next(err);
  }
}

export async function updateLearningProgress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pupilId = req.user!.id;
    const data = progressUpdateSchema.parse(req.body);

    const existing = await prisma.learningProgress.findFirst({
      where: {
        pupilId,
        moduleId: data.moduleId,
        lessonId: data.lessonId ?? null,
      },
    });

    const record = existing
      ? await prisma.learningProgress.update({
          where: { id: existing.id },
          data: {
            status: data.status,
            percentComplete: data.percentComplete,
            lastAccessedAt: new Date(),
            completedAt: data.status === 'COMPLETED' ? new Date() : existing.completedAt,
          },
        })
      : await prisma.learningProgress.create({
          data: {
            pupilId,
            moduleId: data.moduleId,
            lessonId: data.lessonId ?? null,
            status: data.status,
            percentComplete: data.percentComplete,
            completedAt: data.status === 'COMPLETED' ? new Date() : null,
          },
        });

    if (data.status === 'COMPLETED') {
      const firstLessonAch = await prisma.achievement.findUnique({
        where: { code: 'FIRST_LESSON' },
      });
      if (firstLessonAch) {
        await prisma.userAchievement.upsert({
          where: { userId_achievementId: { userId: pupilId, achievementId: firstLessonAch.id } },
          update: {},
          create: { userId: pupilId, achievementId: firstLessonAch.id },
        });
      }
    }

    res.json({ progress: record });
  } catch (err) {
    next(err);
  }
}

export async function submitQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pupilId = req.user!.id;
    const data = quizSubmitSchema.parse(req.body);

    const questions = await prisma.assessmentQuestion.findMany({
      where: { moduleId: data.moduleId },
    });

    if (questions.length === 0) {
      throw new AppError('No quiz questions configured for this module.', 404);
    }

    const answerMap = new Map(data.answers.map((a) => [a.questionId, a.selectedIndex]));
    let totalMarks = 0;
    let awardedMarks = 0;

    const breakdown = questions.map((q) => {
      totalMarks += q.marks;
      const selected = answerMap.get(q.id) ?? -1;
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) awardedMarks += q.marks;
      return {
        questionId: q.id,
        questionText: q.questionText,
        selectedIndex: selected,
        correctIndex: q.correctIndex,
        isCorrect,
        marksAwarded: isCorrect ? q.marks : 0,
        maxMarks: q.marks,
        explanation: q.explanation,
      };
    });

    const percentage = totalMarks > 0 ? Math.round((awardedMarks / totalMarks) * 1000) / 10 : 0;
    const passed = percentage >= 60;

    const attempt = await prisma.pupilAttempt.create({
      data: {
        pupilId,
        moduleId: data.moduleId,
        attemptType: 'QUIZ',
        snapshotJson: JSON.stringify(data.answers),
        status: 'GRADED',
        submittedAt: new Date(),
        result: {
          create: {
            pupilId,
            awardedMarks,
            totalMarks,
            percentage,
            passed,
            feedbackJson: JSON.stringify(breakdown),
          },
        },
      },
      include: { result: true },
    });

    if (passed) {
      const quizAch = await prisma.achievement.findUnique({ where: { code: 'QUIZ_MASTER' } });
      if (quizAch) {
        await prisma.userAchievement.upsert({
          where: { userId_achievementId: { userId: pupilId, achievementId: quizAch.id } },
          update: {},
          create: { userId: pupilId, achievementId: quizAch.id },
        });
      }
    }

    res.json({
      attemptId: attempt.id,
      awardedMarks,
      totalMarks,
      percentage,
      passed,
      breakdown,
    });
  } catch (err) {
    next(err);
  }
}

export async function getOfflineBundle(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const modules = await prisma.learningModule.findMany({
      where: { isPublished: true },
      orderBy: { number: 'asc' },
      include: {
        lessons: {
          where: { offlineReady: true },
          orderBy: { orderIndex: 'asc' },
        },
        questions: {
          select: {
            id: true,
            questionText: true,
            optionsJson: true,
            correctIndex: true,
            explanation: true,
            marks: true,
          },
        },
      },
    });

    res.json({
      generatedAt: new Date().toISOString(),
      modules,
    });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== req.user!.id) {
      throw new AppError('Notification not found.', 404);
    }
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ notification: updated });
  } catch (err) {
    next(err);
  }
}
