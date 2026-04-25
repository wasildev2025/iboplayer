-- CreateTable
CREATE TABLE "channels" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "logo" TEXT,
    "group_name" TEXT,
    "category" TEXT NOT NULL,
    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "channel_refresh_logs" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "channel_count" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    CONSTRAINT "channel_refresh_logs_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "channels_profile_id_category_idx" ON "channels"("profile_id", "category");
-- CreateIndex
CREATE INDEX "channels_profile_id_category_group_name_idx" ON "channels"("profile_id", "category", "group_name");
-- CreateIndex
CREATE UNIQUE INDEX "channels_profile_id_external_id_key" ON "channels"("profile_id", "external_id");
-- CreateIndex
CREATE UNIQUE INDEX "channel_refresh_logs_profile_id_key" ON "channel_refresh_logs"("profile_id");
-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "credential_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "channel_refresh_logs" ADD CONSTRAINT "channel_refresh_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "credential_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
