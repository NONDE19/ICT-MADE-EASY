export type UserRole = 'ADMIN' | 'TEACHER' | 'PUPIL';

export interface SchoolSummary {
  id: string;
  name: string;
  code: string;
  province?: string;
  district?: string;
  isActive?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  schoolId: string | null;
  school?: SchoolSummary | null;
}

export interface LessonItem {
  id: string;
  moduleId: string;
  slug: string;
  orderIndex: number;
  title: string;
  summary: string;
  contentJson?: string;
  estimatedMins: number;
  offlineReady: boolean;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  optionsJson: string;
  marks: number;
  difficulty: string;
}

export interface AssessmentCriterion {
  id: string;
  orderIndex: number;
  label: string;
  ruleType: string;
  rulePayload: string;
  marks: number;
  hintText: string;
}

export type FormLevelFilter = 'all' | 1 | 2 | 3 | 4;

export interface PracticalExercise {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  instructions: string;
  formLevel: number;
  syllabusCode: string;
  level: 1 | 2 | 3;
  totalMarks: number;
  deadline: string | null;
  module?: { id?: string; number: number; title: string; slug: string };
  criteria: AssessmentCriterion[];
  attempts?: Array<{
    id: string;
    startedAt: string;
    submittedAt: string | null;
    result?: {
      awardedMarks: number;
      totalMarks: number;
      percentage: number;
      passed: boolean;
      feedbackJson: string;
      gradedAt: string;
    } | null;
  }>;
}

export interface LearningModuleSummary {
  id: string;
  slug: string;
  number: number;
  formLevel: number;
  syllabusCode: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  isPublished: boolean;
  lessons: LessonItem[];
  completedLessons?: number;
  totalLessons?: number;
  percentComplete?: number;
  _count?: { questions: number; exercises: number };
}

export interface SimFolder {
  id: string;
  desktopStateId: string;
  name: string;
  parentId: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
}

export type SimFileType =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'text'
  | 'archive'
  | 'publication'
  | 'website'
  | 'email'
  | 'cloud';

export interface SimFile {
  id: string;
  desktopStateId: string;
  folderId: string | null;
  name: string;
  fileType: SimFileType;
  extension: string;
  contentJson: string;
  sizeBytes: number;
  isDeleted: boolean;
  deletedAt: string | null;
  updatedAt?: string;
}

export interface VirtualDesktopStateData {
  id: string;
  pupilId: string;
  wallpaper: string;
  themeMode: 'light' | 'dark';
  iconSize: 'small' | 'medium' | 'large';
  showClock: boolean;
  settingsJson: string;
  folders: SimFolder[];
  files: SimFile[];
}

export type DesktopAppId =
  | 'file-manager'
  | 'word-writer'
  | 'calc-sheet'
  | 'slide-deck'
  | 'publisher'
  | 'edu-mail'
  | 'web-builder'
  | 'cloud-drive'
  | 'edu-browser'
  | 'recycle-bin'
  | 'settings';

export interface DesktopWindow {
  id: string;
  appId: DesktopAppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  fileId?: string | null;
}

export interface SimActionLog {
  type: string;
  target?: string;
  detail?: string;
  timestamp: string;
}
