-- DropForeignKey
ALTER TABLE "activation_codes" DROP CONSTRAINT "activation_codes_dns_id_fkey";

-- DropForeignKey
ALTER TABLE "mac_users" DROP CONSTRAINT "mac_users_dns_id_fkey";

-- DropForeignKey
ALTER TABLE "playlists" DROP CONSTRAINT "playlists_dns_id_fkey";

-- DropIndex
DROP INDEX "activation_codes_dns_id_idx";

-- DropIndex
DROP INDEX "mac_users_dns_id_idx";

-- DropIndex
DROP INDEX "playlists_dns_id_idx";

-- AlterTable
ALTER TABLE "activation_codes" DROP COLUMN "dns_id",
DROP COLUMN "password",
DROP COLUMN "url",
DROP COLUMN "username",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "profile_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "mac_users" DROP COLUMN "dns_id",
DROP COLUMN "password",
DROP COLUMN "protection",
DROP COLUMN "url",
DROP COLUMN "username",
ALTER COLUMN "title" SET DEFAULT '';

-- AlterTable
ALTER TABLE "playlists" DROP COLUMN "dns_id",
DROP COLUMN "password",
DROP COLUMN "url",
DROP COLUMN "username",
ADD COLUMN     "profile_id" INTEGER NOT NULL,
ALTER COLUMN "title" DROP NOT NULL;

-- CreateTable
CREATE TABLE "credential_profiles" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "dns_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credential_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credential_profiles_dns_id_idx" ON "credential_profiles"("dns_id");

-- CreateIndex
CREATE UNIQUE INDEX "credential_profiles_dns_id_username_password_key" ON "credential_profiles"("dns_id", "username", "password");

-- CreateIndex
CREATE INDEX "activation_codes_profile_id_idx" ON "activation_codes"("profile_id");

-- CreateIndex
CREATE INDEX "activation_codes_status_idx" ON "activation_codes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mac_users_mac_address_key" ON "mac_users"("mac_address");

-- CreateIndex
CREATE INDEX "playlists_profile_id_idx" ON "playlists"("profile_id");

-- AddForeignKey
ALTER TABLE "credential_profiles" ADD CONSTRAINT "credential_profiles_dns_id_fkey" FOREIGN KEY ("dns_id") REFERENCES "Dns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_codes" ADD CONSTRAINT "activation_codes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "credential_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "credential_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

