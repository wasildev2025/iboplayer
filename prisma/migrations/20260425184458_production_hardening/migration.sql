-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- Trigram extension + index for fast substring search on channel names.
-- Required by /api/player/channels?search=… performance at scale.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS channels_name_trgm_idx ON channels USING gin (name gin_trgm_ops);
