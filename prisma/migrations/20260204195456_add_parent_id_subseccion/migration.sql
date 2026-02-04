-- AlterTable
ALTER TABLE "SubSeccion" ADD COLUMN     "parentId" INTEGER;

-- CreateIndex
CREATE INDEX "SubSeccion_parentId_idx" ON "SubSeccion"("parentId");

-- AddForeignKey
ALTER TABLE "SubSeccion" ADD CONSTRAINT "SubSeccion_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SubSeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
