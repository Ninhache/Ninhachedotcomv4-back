-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "blogArticleId" TEXT,
ADD COLUMN     "blogCategoryId" TEXT;

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "coverImageUrl" TEXT,
    "tags" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "ArticleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ArticleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleOnCategory" (
    "articleId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ArticleOnCategory_pkey" PRIMARY KEY ("articleId","categoryId")
);

-- CreateTable
CREATE TABLE "ArticleCategoryTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "articleCategoryId" TEXT NOT NULL,

    CONSTRAINT "ArticleCategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTranslation_articleId_locale_key" ON "ArticleTranslation"("articleId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCategory_slug_key" ON "ArticleCategory"("slug");

-- CreateIndex
CREATE INDEX "ArticleOnCategory_categoryId_idx" ON "ArticleOnCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCategoryTranslation_articleCategoryId_locale_key" ON "ArticleCategoryTranslation"("articleCategoryId", "locale");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_blogCategoryId_fkey" FOREIGN KEY ("blogCategoryId") REFERENCES "ArticleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_blogArticleId_fkey" FOREIGN KEY ("blogArticleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleOnCategory" ADD CONSTRAINT "ArticleOnCategory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleOnCategory" ADD CONSTRAINT "ArticleOnCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ArticleCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleCategoryTranslation" ADD CONSTRAINT "ArticleCategoryTranslation_articleCategoryId_fkey" FOREIGN KEY ("articleCategoryId") REFERENCES "ArticleCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
