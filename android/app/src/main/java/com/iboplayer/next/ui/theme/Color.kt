package com.iboplayer.next.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Color

// Static, theme-agnostic surface + text colors. These don't change when the
// admin switches the app theme — only the accent triplet below does.
val ProtonNavy = Color(0xFF0B1320)
val ProtonNavyDeep = Color(0xFF050A14)
val ProtonSurface = Color(0xFF111C2E)
val ProtonSurfaceTranslucent = Color(0x80111C2E)

val ProtonText = Color(0xFFF1F5F9)
val ProtonTextMuted = Color(0xFFB6C0CC)

/**
 * Accent palette for the app — the one piece the admin can swap from the
 * panel's "App Themes" page. `primary` drives focus rings, the now-playing
 * label, the heart-when-favorited tint; `secondary` is the chip border /
 * gold accent; `dim` is the translucent variant of primary.
 */
data class AccentPalette(
    val primary: Color,
    val secondary: Color,
    val dim: Color,
)

val OrangePalette = AccentPalette(
    primary = Color(0xFFF59E29),
    secondary = Color(0xFFE8A94A),
    dim = Color(0xCCF59E29),
)

val BluePalette = AccentPalette(
    primary = Color(0xFF3B82F6),
    secondary = Color(0xFF60A5FA),
    dim = Color(0xCC3B82F6),
)

val GreenPalette = AccentPalette(
    primary = Color(0xFF22C55E),
    secondary = Color(0xFF4ADE80),
    dim = Color(0xCC22C55E),
)

val PurplePalette = AccentPalette(
    primary = Color(0xFFA855F7),
    secondary = Color(0xFFC084FC),
    dim = Color(0xCCA855F7),
)

val RedPalette = AccentPalette(
    primary = Color(0xFFEF4444),
    secondary = Color(0xFFF87171),
    dim = Color(0xCCEF4444),
)

val CyanPalette = AccentPalette(
    primary = Color(0xFF06B6D4),
    secondary = Color(0xFF22D3EE),
    dim = Color(0xCC06B6D4),
)

/**
 * Map the admin-chosen `themeNo` to one of our palettes. Source of truth on
 * the panel side is `THEME_OPTIONS` in `src/types/index.ts` — keep both
 * lists in lockstep when adding a new theme. Unknown / legacy keys fall
 * back to orange so devices that still hold an old `themeNo` value keep
 * rendering instead of going blank.
 */
fun paletteFor(themeNo: String?): AccentPalette = when (themeNo) {
    "theme_blue" -> BluePalette
    "theme_green" -> GreenPalette
    else -> OrangePalette  // theme_orange + any unknown / legacy value
}

/**
 * `compositionLocalOf` (not `staticCompositionLocalOf`) so flipping the
 * palette at runtime — when the bootstrap response brings down a new
 * themeNo — actually triggers recomposition of the call sites.
 */
val LocalAccentPalette = compositionLocalOf { OrangePalette }

// Composable getters — keep the legacy names so existing call sites across
// BrowseScreen / HomeScreen / TvFocus / etc. don't need to change.
val ProtonOrange: Color
    @Composable get() = LocalAccentPalette.current.primary

val ProtonOrangeDim: Color
    @Composable get() = LocalAccentPalette.current.dim

val ProtonGold: Color
    @Composable get() = LocalAccentPalette.current.secondary

// Outline color tracks the active accent — used by chip strip + tile borders.
val ProtonOutline: Color
    @Composable get() = LocalAccentPalette.current.primary.copy(alpha = 0.4f)

// Plain Color aliases (non-composable) for any consumer that needs a stable
// brand color — falls back to the orange.
val Primary = Color(0xFFF59E29)
val OnPrimary = Color(0xFF0B1320)
val PrimaryContainer = Color(0xFF7A4912)
val OnPrimaryContainer = Color(0xFFFFE7C6)
