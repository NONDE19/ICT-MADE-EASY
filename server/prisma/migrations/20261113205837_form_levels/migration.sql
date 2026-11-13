-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LearningModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "formLevel" INTEGER NOT NULL DEFAULT 1,
    "syllabusCode" TEXT NOT NULL DEFAULT '1.1',
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LearningModule" ("category", "createdAt", "description", "id", "isPublished", "number", "slug", "subtitle", "title", "updatedAt") SELECT "category", "createdAt", "description", "id", "isPublished", "number", "slug", "subtitle", "title", "updatedAt" FROM "LearningModule";
DROP TABLE "LearningModule";
ALTER TABLE "new_LearningModule" RENAME TO "LearningModule";
CREATE UNIQUE INDEX "LearningModule_slug_key" ON "LearningModule"("slug");
CREATE UNIQUE INDEX "LearningModule_number_key" ON "LearningModule"("number");
CREATE INDEX "LearningModule_formLevel_idx" ON "LearningModule"("formLevel");
CREATE TABLE "new_PracticalExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "formLevel" INTEGER NOT NULL DEFAULT 1,
    "syllabusCode" TEXT NOT NULL DEFAULT '1.3',
    "level" INTEGER NOT NULL DEFAULT 1,
    "totalMarks" INTEGER NOT NULL DEFAULT 20,
    "deadline" DATETIME,
    "classId" TEXT,
    "createdById" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PracticalExercise_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "LearningModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticalExercise_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PracticalExercise_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PracticalExercise" ("classId", "createdAt", "createdById", "deadline", "description", "id", "instructions", "isPublished", "level", "moduleId", "title", "totalMarks", "updatedAt") SELECT "classId", "createdAt", "createdById", "deadline", "description", "id", "instructions", "isPublished", "level", "moduleId", "title", "totalMarks", "updatedAt" FROM "PracticalExercise";
DROP TABLE "PracticalExercise";
ALTER TABLE "new_PracticalExercise" RENAME TO "PracticalExercise";
CREATE INDEX "PracticalExercise_moduleId_level_idx" ON "PracticalExercise"("moduleId", "level");
CREATE INDEX "PracticalExercise_formLevel_idx" ON "PracticalExercise"("formLevel");
CREATE INDEX "PracticalExercise_classId_idx" ON "PracticalExercise"("classId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
