import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(2, 'Email or username is required'),
  password: z.string().min(4, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required'),
});

export const createSchoolSchema = z.object({
  name: z.string().trim().min(3, 'School name must be at least 3 characters'),
  code: z.string().trim().min(2, 'School code is required').max(24),
  province: z.string().trim().min(2, 'Province is required'),
  district: z.string().trim().min(2, 'District is required'),
});

export const updateSchoolSchema = createSchoolSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createUserSchema = z.object({
  email: z.string().trim().email('Valid email required'),
  username: z.string().trim().min(3).max(40),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().trim().min(2, 'Full name is required'),
  role: z.enum(['ADMIN', 'TEACHER', 'PUPIL']),
  schoolId: z.string().nullable().optional(),
  classId: z.string().nullable().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  role: z.enum(['ADMIN', 'TEACHER', 'PUPIL']).optional(),
  isActive: z.boolean().optional(),
  schoolId: z.string().nullable().optional(),
  password: z.string().min(6).optional(),
});

export const createClassSchema = z.object({
  name: z.string().trim().min(2, 'Class name is required'),
  gradeLevel: z.string().trim().min(1, 'Grade level is required'),
  academicYear: z.string().trim().default('2026'),
  schoolId: z.string().min(1, 'School is required'),
});

export const assignTeacherSchema = z.object({
  classId: z.string().min(1),
  teacherId: z.string().min(1),
});

export const enrollPupilSchema = z.object({
  classId: z.string().min(1),
  pupilId: z.string().min(1),
});

export const createExerciseSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().trim().min(3),
  description: z.string().trim().min(5),
  instructions: z.string().trim().min(5),
  formLevel: z.number().int().min(1).max(4).optional().default(1),
  syllabusCode: z.string().trim().max(16).optional().default('1.3'),
  level: z.number().int().min(1).max(3),
  totalMarks: z.number().int().min(1).max(100).default(20),
  deadline: z.string().nullable().optional(),
  classId: z.string().nullable().optional(),
  criteria: z
    .array(
      z.object({
        label: z.string().trim().min(2),
        ruleType: z.string().trim().min(2),
        rulePayload: z.record(z.string(), z.any()),
        marks: z.number().int().min(1).max(100),
        hintText: z.string().optional().default(''),
      })
    )
    .optional(),
});

export const desktopSaveSchema = z.object({
  wallpaper: z.string().optional(),
  themeMode: z.enum(['light', 'dark']).optional(),
  iconSize: z.enum(['small', 'medium', 'large']).optional(),
  showClock: z.boolean().optional(),
  settingsJson: z.string().optional(),
});

export const folderCreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
  parentId: z.string().nullable().optional(),
});

export const folderUpdateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  parentId: z.string().nullable().optional(),
  isDeleted: z.boolean().optional(),
});

export const fileCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  fileType: z.enum([
    'document',
    'spreadsheet',
    'presentation',
    'text',
    'archive',
    'publication',
    'website',
    'email',
    'cloud',
  ]),
  extension: z.string().trim().min(1).max(12).optional(),
  folderId: z.string().nullable().optional(),
  contentJson: z.string().default('{}'),
});

export const fileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  extension: z.string().trim().min(1).max(12).optional(),
  folderId: z.string().nullable().optional(),
  contentJson: z.string().optional(),
  isDeleted: z.boolean().optional(),
});

export const quizSubmitSchema = z.object({
  moduleId: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedIndex: z.number().int().min(-1),
    })
  ),
});

export const practicalSubmitSchema = z.object({
  exerciseId: z.string().min(1),
  actionsLog: z.array(
    z.object({
      type: z.string(),
      target: z.string().optional(),
      detail: z.string().optional(),
      timestamp: z.string().optional(),
    })
  ),
  snapshot: z
    .object({
      folders: z.array(z.any()).optional(),
      files: z.array(z.any()).optional(),
    })
    .optional(),
});

export const progressUpdateSchema = z.object({
  moduleId: z.string().min(1),
  lessonId: z.string().nullable().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  percentComplete: z.number().int().min(0).max(100),
});
