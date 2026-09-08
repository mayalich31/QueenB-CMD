-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_THANK_YOU';

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "programmingLanguages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "githubUrl" TEXT,
ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "yearsOfExperience" INTEGER,
ADD COLUMN "jobTitle" TEXT,
ADD COLUMN "workplace" TEXT,
ADD COLUMN "techStack" TEXT;

-- AlterTable
ALTER TABLE "Notification"
ADD COLUMN "message" TEXT;
