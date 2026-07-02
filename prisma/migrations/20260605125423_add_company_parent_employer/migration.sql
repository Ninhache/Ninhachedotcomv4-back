-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "parentEmployerId" TEXT;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_parentEmployerId_fkey" FOREIGN KEY ("parentEmployerId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
