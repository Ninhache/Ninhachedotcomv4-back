-- CreateTable
CREATE TABLE "CompanyTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "description" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "CompanyTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTranslation_companyId_locale_key" ON "CompanyTranslation"("companyId", "locale");

-- AddForeignKey
ALTER TABLE "CompanyTranslation" ADD CONSTRAINT "CompanyTranslation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
