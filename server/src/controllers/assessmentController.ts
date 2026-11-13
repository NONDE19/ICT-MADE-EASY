import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { practicalSubmitSchema } from '../validators/schemas.js';
import { evaluatePracticalSubmission } from '../assessments/evaluator.js';
import { ensurePupilDesktopInitialized } from '../simulation/engine.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listPracticalExercises(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const memberships = await prisma.classMembership.findMany({
      where: { pupilId: userId },
      select: { classId: true },
    });
    const classIds = memberships.map((m) => m.classId);

    const whereClause =
      req.user!.role === 'ADMIN' || req.user!.role === 'TEACHER'
        ? {}
        : {
            isPublished: true,
            OR: [{ classId: null }, { classId: { in: classIds } }],
          };

    const exercises = await prisma.practicalExercise.findMany({
      where: whereClause,
      orderBy: [{ level: 'asc' }, { createdAt: 'asc' }],
      include: {
        module: { select: { id: true, number: true, title: true, slug: true } },
        criteria: { orderBy: { orderIndex: 'asc' } },
        attempts: {
          where: { pupilId: userId },
          orderBy: { startedAt: 'desc' },
          include: { result: true },
        },
      },
    });

    // In Level 3 (Practical Assessment), omit step-by-step hints for pupils
    const sanitized = exercises.map((ex) => ({
      ...ex,
      criteria: ex.criteria.map((c) => ({
        ...c,
        hintText: ex.level === 3 && req.user!.role === 'PUPIL' ? '' : c.hintText,
      })),
    }));

    res.json({ exercises: sanitized });
  } catch (err) {
    next(err);
  }
}

export async function submitPracticalAttempt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pupilId = req.user!.id;
    const data = practicalSubmitSchema.parse(req.body);

    const exercise = await prisma.practicalExercise.findUnique({
      where: { id: data.exerciseId },
      include: { criteria: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!exercise) throw new AppError('Practical exercise not found.', 404);

    // Use persisted server desktop state (or snapshot fallback if provided from offline sync)
    const desktopState = await ensurePupilDesktopInitialized(pupilId);

    const folders =
      data.snapshot?.folders && data.snapshot.folders.length > 0
        ? data.snapshot.folders
        : desktopState.folders;
    const files =
      data.snapshot?.files && data.snapshot.files.length > 0
        ? data.snapshot.files
        : desktopState.files;

    const evaluation = evaluatePracticalSubmission(
      exercise.criteria,
      folders,
      files,
      data.actionsLog
    );

    const attempt = await prisma.pupilAttempt.create({
      data: {
        pupilId,
        exerciseId: exercise.id,
        moduleId: exercise.moduleId,
        attemptType: 'PRACTICAL',
        actionsLogJson: JSON.stringify(data.actionsLog),
        snapshotJson: JSON.stringify({
          folderCount: folders.length,
          fileCount: files.length,
        }),
        status: 'GRADED',
        submittedAt: new Date(),
        result: {
          create: {
            pupilId,
            awardedMarks: evaluation.awardedMarks,
            totalMarks: evaluation.totalMarks || exercise.totalMarks,
            percentage: evaluation.percentage,
            passed: evaluation.passed,
            feedbackJson: JSON.stringify(evaluation.criteriaResults),
          },
        },
      },
      include: { result: true },
    });

    if (evaluation.passed) {
      const ach = await prisma.achievement.findUnique({ where: { code: 'PRACTICAL_PRO' } });
      if (ach) {
        await prisma.userAchievement.upsert({
          where: { userId_achievementId: { userId: pupilId, achievementId: ach.id } },
          update: {},
          create: { userId: pupilId, achievementId: ach.id },
        });
      }
    }

    res.status(201).json({
      attempt,
      evaluation,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyAttemptHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pupilId = req.user!.id;
    const attempts = await prisma.pupilAttempt.findMany({
      where: { pupilId },
      orderBy: { startedAt: 'desc' },
      include: {
        exercise: { select: { id: true, title: true, level: true, totalMarks: true } },
        result: true,
      },
    });
    res.json({ attempts });
  } catch (err) {
    next(err);
  }
}
