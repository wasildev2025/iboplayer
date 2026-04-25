-- DropIndex (re-created below to preserve search performance — Prisma doesn't
-- track GIN/trigram indexes in the schema, so it would otherwise prune them)
DROP INDEX IF EXISTS "channels_name_trgm_idx";
-- CreateTable
CREATE TABLE "favorites" (
    "id" SERIAL NOT NULL,
    "mac_user_id" INTEGER NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER,
    "actor_name" TEXT NOT NULL DEFAULT 'system',
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "favorites_mac_user_id_idx" ON "favorites"("mac_user_id");
-- CreateIndex
CREATE UNIQUE INDEX "favorites_mac_user_id_channel_id_key" ON "favorites"("mac_user_id", "channel_id");
-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");
-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");
-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_mac_user_id_fkey" FOREIGN KEY ("mac_user_id") REFERENCES "mac_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Re-create trigram extension + index dropped above. pg_trgm makes the
-- channel name search (ILIKE '%foo%') use a GIN index instead of a full scan.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS channels_name_trgm_idx ON channels USING gin (name gin_trgm_ops);
