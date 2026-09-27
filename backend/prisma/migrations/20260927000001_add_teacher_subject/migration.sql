-- AlterTable
ALTER TABLE "users" ADD COLUMN "subject_id" UUID;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
