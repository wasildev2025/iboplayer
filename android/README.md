# IBO Player Next (Android)

Native Android IPTV player that loads M3U/M3U8 playlists and streams channels via ExoPlayer (Media3). Pairs with the Next.js admin panel in this repo.

## Stack

- Kotlin 2.0 + Jetpack Compose (Material 3)
- Media3 ExoPlayer (HLS + DASH + progressive)
- OkHttp for M3U fetching
- DataStore for remembering the last playlist URL
- Coil for channel logos

## Build

Requires Android Studio **Ladybug** (AGP 8.7) or newer and JDK 17.

```bash
cd android
./gradlew assembleDebug
# or open the `android/` folder in Android Studio and press Run
```

The Gradle wrapper JAR is not committed. Generate it once with:

```bash
cd android
gradle wrapper --gradle-version 8.11.1
```

(Or open the project in Android Studio — it will generate the wrapper automatically.)

## Features (MVP)

- Enter any M3U/M3U8 URL on first launch
- Parses `#EXTINF` attributes: `tvg-id`, `tvg-name`, `tvg-logo`, `group-title`
- Channel list with search + group filter
- Full-screen player (HLS / DASH / TS auto-detected by Media3)
- Last-used URL persisted in DataStore

## Next steps

- Wire activation-code login against the Next.js API (`/api/activation-codes`, `/api/auth`)
- EPG (XMLTV) support
- Favorites + recently watched
- Android TV leanback launcher
- Background playback with MediaSession
