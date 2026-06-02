-- CreateTable
CREATE TABLE "Alias" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AliasBody" (
    "id" TEXT NOT NULL,
    "aliasId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "AliasBody_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Alias_key_key" ON "Alias"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AliasBody_aliasId_locale_key" ON "AliasBody"("aliasId", "locale");

-- AddForeignKey
ALTER TABLE "AliasBody" ADD CONSTRAINT "AliasBody_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "Alias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
