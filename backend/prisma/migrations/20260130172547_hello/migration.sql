/*
  Warnings:

  - The values [CITIZEN,JOURNALIST,FACT_CHECKER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `house` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "House" AS ENUM ('CITIZEN', 'JOURNALIST', 'FACT_CHECKER');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "house" "House" NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'USER';
