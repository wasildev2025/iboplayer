package com.iboplayer.next.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

private val ProtonColors = darkColorScheme(
    primary = ProtonOrange,
    onPrimary = Color(0xFF0B1320),
    primaryContainer = ProtonOrangeDim,
    onPrimaryContainer = Color(0xFFFFE7C6),
    secondary = ProtonGold,
    onSecondary = Color(0xFF0B1320),
    background = ProtonNavyDeep,
    onBackground = ProtonText,
    surface = ProtonSurface,
    onSurface = ProtonText,
    surfaceVariant = ProtonSurfaceTranslucent,
    onSurfaceVariant = ProtonTextMuted,
    outline = ProtonOutline,
    error = Color(0xFFEF5350),
    onError = Color.White,
)

@Composable
fun IboPlayerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = ProtonColors,
        content = content,
    )
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
