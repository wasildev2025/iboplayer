-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dns" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Dns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mac_users" (
    "id" SERIAL NOT NULL,
    "mac_address" TEXT NOT NULL,
    "protection" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "dns_id" INTEGER,

    CONSTRAINT "mac_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" SERIAL NOT NULL,
    "mac_user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "protection" BOOLEAN NOT NULL DEFAULT false,
    "pin" TEXT,
    "dns_id" INTEGER,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activation_codes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NotUsed',
    "dns_id" INTEGER,

    CONSTRAINT "activation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trials" (
    "id" SERIAL NOT NULL,
    "mac_address" TEXT NOT NULL,
    "expire_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demo" (
    "id" SERIAL NOT NULL,
    "mplname" TEXT NOT NULL DEFAULT '',
    "mdns" TEXT NOT NULL DEFAULT '',
    "muser" TEXT NOT NULL DEFAULT '',
    "mpass" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Demo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "message_one" TEXT NOT NULL DEFAULT '',
    "message_two" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mac_length" (
    "id" SERIAL NOT NULL,
    "length" INTEGER NOT NULL DEFAULT 12,

    CONSTRAINT "mac_length_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" SERIAL NOT NULL,
    "theme_no" TEXT NOT NULL DEFAULT 'theme_10',

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_text" (
    "id" SERIAL NOT NULL,
    "logintitial" TEXT NOT NULL DEFAULT '',
    "loginsubtitial" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "login_text_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads_settings" (
    "id" SERIAL NOT NULL,
    "adstype" TEXT NOT NULL DEFAULT 'auto',

    CONSTRAINT "ads_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_layout" (
    "id" SERIAL NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'layout_7',

    CONSTRAINT "auto_layout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frame_layout" (
    "id" SERIAL NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'layout_2',

    CONSTRAINT "frame_layout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_ads" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "manual_ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" SERIAL NOT NULL,
    "league_name" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_widgets" (
    "id" SERIAL NOT NULL,
    "league_name" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,

    CONSTRAINT "league_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports" (
    "id" SERIAL NOT NULL,
    "api" TEXT NOT NULL DEFAULT '',
    "header_n" TEXT NOT NULL DEFAULT 'Event',
    "border_c" TEXT NOT NULL DEFAULT '#000000',
    "background_c" TEXT NOT NULL DEFAULT '#000000',
    "text_c" TEXT NOT NULL DEFAULT '#ffffff',

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tmdb_api" (
    "id" SERIAL NOT NULL,
    "tmdbkey" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "tmdb_api_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_update" (
    "id" SERIAL NOT NULL,
    "nversion" TEXT NOT NULL DEFAULT '1.0',
    "nurl" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "remote_update_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Dns_url_key" ON "Dns"("url");

-- CreateIndex
CREATE INDEX "mac_users_dns_id_idx" ON "mac_users"("dns_id");

-- CreateIndex
CREATE INDEX "playlists_mac_user_id_idx" ON "playlists"("mac_user_id");

-- CreateIndex
CREATE INDEX "playlists_dns_id_idx" ON "playlists"("dns_id");

-- CreateIndex
CREATE UNIQUE INDEX "activation_codes_code_key" ON "activation_codes"("code");

-- CreateIndex
CREATE INDEX "activation_codes_dns_id_idx" ON "activation_codes"("dns_id");

-- AddForeignKey
ALTER TABLE "mac_users" ADD CONSTRAINT "mac_users_dns_id_fkey" FOREIGN KEY ("dns_id") REFERENCES "Dns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_mac_user_id_fkey" FOREIGN KEY ("mac_user_id") REFERENCES "mac_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_dns_id_fkey" FOREIGN KEY ("dns_id") REFERENCES "Dns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_codes" ADD CONSTRAINT "activation_codes_dns_id_fkey" FOREIGN KEY ("dns_id") REFERENCES "Dns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
