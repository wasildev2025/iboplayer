# IPTV Player (Android)

Native Android IPTV player that loads M3U/M3U8 playlists and streams channels via ExoPlayer (Media3). Works **end-to-end with the Next.js panel** using the public player APIs (`/api/player/*`).

## Stack

- Kotlin 2.0 + Jetpack Compose (Material 3)
- Hilt for Dependency Injection
- Room for local persistence (channel caching)
- Media3 ExoPlayer (HLS + DASH + progressive)
- OkHttp for playlists + panel API calls
- DataStore for settings (panel URL, JWT, playlist URL)
- kotlinx.serialization for JSON

## End-to-end flow with the backend

1. Run the Next.js app from the repo root (`npm run dev`). Note the port (e.g. `3000` or `3001`).
2. Ensure `NEXTAUTH_SECRET` is set in `.env` (used to sign player JWTs unless `PLAYER_JWT_SECRET` is set).
3. In the **admin panel**, create either:
   - A **MAC user** whose MAC matches the device (see Setup screen), with portal URL + username + password, **or**
   - An **activation code** with status **NotUsed** (optional MAC path still requires a MAC on the device for the request body).
4. On the phone/emulator, open the app:
   - **Panel base URL**: use `http://10.0.2.2:<PORT>` on the Android emulator to reach the host machine’s localhost; on a real device use `http://<your-pc-lan-ip>:<PORT>`.
   - Leave **Activation code** empty for MAC-only login, or enter a code for code-based activation (code is marked **Used** after success).
5. After login, the app stores the JWT + primary playlist URL, parses the M3U, and opens the channel list.

Direct **M3U URL** loading (without the panel) remains available under **Advanced**.

## Build

Requires Android Studio **Ladybug** (AGP 8.7) or newer and JDK 17.

```bash
cd android
./gradlew assembleDebug
```

The Gradle wrapper JAR may not be committed. Generate it once with:

```bash
cd android
gradle wrapper --gradle-version 8.11.1
```

## Features

- Panel bootstrap (`GET /api/player/bootstrap`) for login copy and DNS list metadata
- Panel login (`POST /api/player/login`) with MAC + optional activation code
- Session refresh (`GET /api/player/playlists`) with Bearer JWT (available for future use / retries)
- M3U parsing and full-screen playback

## Next steps

- EPG (XMLTV), richer TV home UI, multi-playlist picker
- Background playback with MediaSession
