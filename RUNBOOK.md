# IPTV Player — Production Runbook

Deployment and operational procedures for the iboplayer panel + Android app.

## Deployment topology

```
   Android device  ──HTTPS──▶  Vercel (Next.js + API routes)
                                       │
                                       ├──▶  Neon Postgres (data)
                                       │
                                       └──▶  IPTV provider M3U
                                            (server fetches, caches in Neon)
```

- **Frontend + admin panel + player API**: Vercel
- **Database**: Neon Postgres (bound to Vercel project via integration)
- **Channel cache**: stored in Neon, refreshed server-side
- **Auth**: NextAuth (admin) + custom HS256 JWT (player)

## First-time deploy

1. **Provision Neon** via Vercel → Storage → Neon → Connect Project
2. **Import this repo** into Vercel as a Next.js project
3. **Set environment variables** (Settings → Environment Variables) — see [.env.example](.env.example) for the full list
4. **Generate strong secrets** locally, paste into Vercel:
   ```bash
   openssl rand -base64 32   # NEXTAUTH_SECRET
   openssl rand -base64 32   # PLAYER_JWT_SECRET (different value!)
   ```
5. **Push to main** — Vercel runs `prisma migrate deploy && next build`
6. **Seed the admin user** locally pointed at production Neon:
   ```bash
   SEED_ADMIN_PASSWORD='<at-least-12-chars-strong>' \
     DATABASE_URL="$POSTGRES_URL_NON_POOLING" \
     npm run db:seed
   ```
7. **Verify** by hitting `https://your-domain/api/health` — should return `{"status":"ok"}`
8. **Log into the admin panel** at `/login` with the seed credentials

## Routine operations

### Refresh a profile's channels manually

Dashboard: Credential Profiles → Edit → "Refresh now"

CLI (when M3U is too big for Vercel timeout):
```bash
DATABASE_URL="$POSTGRES_URL_NON_POOLING" \
  npx tsx -e "import('./src/lib/channel-refresh').then(m => \
    m.refreshChannelsForProfile(<PROFILE_ID>)).then(r => console.log(r))"
```

### Rotate credentials for a profile

Dashboard: Credential Profiles → Edit → paste new M3U → Preview Diff → Apply.

Every activation code, playlist, and device using this profile picks up the new credentials immediately. A channel re-pull is auto-triggered.

### Rotate the admin password

Currently no UI for this — direct DB update:
```bash
DATABASE_URL="$POSTGRES_URL_NON_POOLING" \
  npx tsx -e "
    import { PrismaClient } from '@prisma/client';
    import { hashSync } from 'bcryptjs';
    const p = new PrismaClient();
    p.user.update({ where: { username: 'Admin' }, data: { password: hashSync('NEW_PASSWORD_HERE', 10) }})
      .then(() => console.log('updated'))
      .finally(() => p.\$disconnect());
  "
```

### Prune old used activation codes

```bash
curl -X POST https://your-domain/api/activation-codes/cleanup \
  -H "Cookie: <admin session cookie>" \
  -H "Content-Type: application/json" \
  -d '{"olderThanDays": 90}'
```

Or schedule via Vercel Cron in `vercel.json` once you have a service token.

## Vercel function limits

| Action | Hobby (10s) | Pro (60s default, 800s max) |
|---|---|---|
| Activation API | ✓ fits | ✓ |
| Channel browse (paginated 50/page) | ✓ | ✓ |
| Channel refresh — small M3U (<5k) | ✓ | ✓ |
| Channel refresh — medium (5k–30k) | ✗ may timeout | ✓ |
| Channel refresh — large (30k+) | ✗ | ✗ run via CLI |

For consistent reliability with large M3Us: upgrade to Pro **or** run refreshes from a long-lived script (CI cron, your own machine, a small VPS).

## Rate limits in place

| Endpoint | Limit | Window |
|---|---|---|
| `/api/auth/callback/credentials` (admin login) | 10 | 60s per IP |
| `/api/player/playlists/activate` | 10 | 60s per IP |

Backed by Postgres `rate_limits` table. Edit in `src/lib/rate-limit.ts` to tune.

## Backups

Neon retains 7 days of point-in-time history on the free tier; longer on paid. For meaningful disaster recovery:

```bash
# Periodic dump (run from CI cron or your own machine)
DATABASE_URL="$POSTGRES_URL_NON_POOLING" \
  pg_dump --no-owner --no-acl > backup-$(date +%F).sql

# Push to S3 / GCS / etc. for retention
```

## APK release

1. **Generate the keystore once** (and back it up — losing it means no future updates):
   ```bash
   cd android
   keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 \
           -validity 10000 -alias iboplayer
   ```
2. **Create `android/keystore.properties`** from the example, fill in values
3. **Build**:
   ```bash
   ./gradlew assembleRelease
   # or for Play Store:
   ./gradlew bundleRelease
   ```
4. **Verify signing**:
   ```bash
   apksigner verify --print-certs app/build/outputs/apk/release/app-release.apk
   ```

## Incident playbook

| Symptom | First check | Likely cause |
|---|---|---|
| `/api/health` returns 503 | Neon dashboard | DB unreachable (rare on managed Neon) |
| All Live channels say "No items" | `ChannelRefreshLog` table for that profile | Refresh failed or never ran |
| Admin can't log in | `User` table count, `NEXTAUTH_SECRET` set | DB wiped or env var missing |
| Activation 429 errors | Whose IP is in `rate_limits` table | Brute force OR proxy collapsing many users to one IP |
| Player API 401 on every call | `PLAYER_JWT_SECRET` rotated? | Tokens issued with old secret are now invalid (this is correct on rotation) |

## Open follow-ups

These are tracked but not blocking initial production:

- Sentry integration: set `SENTRY_DSN` + install `@sentry/nextjs` for full integration
- Offline mode in Android: cache last playlist DTO so the app isn't dead without network
- EPG (program guide): pull and serve EPG XML
- Analytics dashboard: DAU, top channels, active devices
- Vercel Cron for `/api/activation-codes/cleanup`
- Audit log of admin actions (who renamed which profile when)

## Contact

Escalation: [your name + phone/email here]
