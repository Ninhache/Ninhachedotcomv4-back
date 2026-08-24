-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "previewToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Article_previewToken_key" ON "Article"("previewToken");
