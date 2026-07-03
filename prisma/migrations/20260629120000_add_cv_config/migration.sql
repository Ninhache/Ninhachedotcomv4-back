-- CreateTable
CREATE TABLE "CvConfig" (
    "id" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'international',
    "selection" JSONB NOT NULL,
    "generatedFrUrl" TEXT,
    "generatedEnUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CvConfig_pkey" PRIMARY KEY ("id")
);
