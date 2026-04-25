package com.iboplayer.next.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import com.iboplayer.next.data.SettingsStore
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

/**
 * Tiny VM that just exposes the persisted theme-key flow. Lives here so the
 * Theme composable can read it via `hiltViewModel()` without dragging the
 * theme decision down through every screen.
 */
@HiltViewModel
class ThemeViewModel @Inject constructor(
    settings: SettingsStore,
) : ViewModel() {
    val themeNo = settings.themeNo
}

@Composable
fun IboPlayerTheme(content: @Composable () -> Unit) {
    val vm: ThemeViewModel = hiltViewModel()
    val themeNo by vm.themeNo.collectAsState(initial = null)
    val palette = remember(themeNo) { paletteFor(themeNo) }

    val scheme = remember(palette) {
        darkColorScheme(
            primary = palette.primary,
            onPrimary = Color(0xFF0B1320),
            primaryContainer = palette.dim,
            onPrimaryContainer = Color(0xFFFFE7C6),
            secondary = palette.secondary,
            onSecondary = Color(0xFF0B1320),
            background = ProtonNavyDeep,
            onBackground = ProtonText,
            surface = ProtonSurface,
            onSurface = ProtonText,
            surfaceVariant = ProtonSurfaceTranslucent,
            onSurfaceVariant = ProtonTextMuted,
            outline = palette.primary.copy(alpha = 0.4f),
            error = Color(0xFFEF5350),
            onError = Color.White,
        )
    }

    CompositionLocalProvider(LocalAccentPalette provides palette) {
        MaterialTheme(
            colorScheme = scheme,
            content = content,
        )
    }
}

/** Stadium-style background: dark navy → deeper navy radial-ish gradient. */
@Composable
fun ProtonBackground(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    0.0f to Color(0xFF1A2A40),
                    0.5f to ProtonNavy,
                    1.0f to ProtonNavyDeep,
                )
            )
    ) {
        content()
    }
}
