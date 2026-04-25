-- AlterTable
ALTER TABLE "credential_profiles" ADD COLUMN "epg_url" TEXT;

-- CreateTable
CREATE TABLE "epg_channels" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "epg_channel_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "epg_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epg_programmes" (
    "id" SERIAL NOT NULL,
    "epg_channel_id" INTEGER NOT NULL,
    "start_utc" TIMESTAMP(3) NOT NULL,
    "stop_utc" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    CONSTRAINT "epg_programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epg_refresh_logs" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "channel_count" INTEGER NOT NULL DEFAULT 0,
    "programme_count" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    CONSTRAINT "epg_refresh_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "epg_channels_profile_id_idx" ON "epg_channels"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "epg_channels_profile_id_epg_channel_id_key" ON "epg_channels"("profile_id", "epg_channel_id");

-- CreateIndex
CREATE INDEX "epg_programmes_epg_channel_id_start_utc_idx" ON "epg_programmes"("epg_channel_id", "start_utc");

-- CreateIndex
CREATE INDEX "epg_programmes_epg_channel_id_stop_utc_idx" ON "epg_programmes"("epg_channel_id", "stop_utc");

-- CreateIndex
CREATE UNIQUE INDEX "epg_refresh_logs_profile_id_key" ON "epg_refresh_logs"("profile_id");

-- AddForeignKey
ALTER TABLE "epg_channels" ADD CONSTRAINT "epg_channels_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "credential_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epg_programmes" ADD CONSTRAINT "epg_programmes_epg_channel_id_fkey" FOREIGN KEY ("epg_channel_id") REFERENCES "epg_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epg_refresh_logs" ADD CONSTRAINT "epg_refresh_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "credential_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
