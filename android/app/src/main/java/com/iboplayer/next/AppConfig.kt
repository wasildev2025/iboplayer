package com.iboplayer.next

/**
 * Build-time constants for this branded app.
 *
 * The panel URL is set per build variant in `app/build.gradle.kts`:
 *   - debug   → your LAN dev server (e.g. http://10.0.2.2:3001 for emulator,
 *               or http://192.168.x.x:3001 for a real device on the same LAN)
 *   - release → your production panel (e.g. https://panel.example.com)
 *
 * For multiple operators / white-label builds, use Gradle product flavors so
 * each operator ships their own APK with their own baked-in URL.
 */
object AppConfig {
    val DEFAULT_PANEL_BASE_URL: String = BuildConfig.PANEL_BASE_URL

    /** Start year for the "© {start}-{currentYear}" copyright line. */
    const val COPYRIGHT_START_YEAR: Int = 2009
}
