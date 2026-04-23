package com.iboplayer.next.ui.splash

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.iboplayer.next.ui.theme.AccentOrange

private val SplashBgTop = Color(0xFF0A0A1A)
private val SplashBgBottom = Color(0xFF0A1528)

@Composable
fun SplashScreen(
    onNavigate: (SplashDestination) -> Unit,
    viewModel: SplashViewModel = hiltViewModel(),
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    colors = listOf(SplashBgTop, SplashBgBottom),
                    start = Offset(0f, 0f),
                    end = Offset(400f, 1600f),
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator(
            color = AccentOrange,
            strokeWidth = 3.dp,
        )
    }
    LaunchedEffect(Unit) {
        val dest = viewModel.resolveDestination()
        onNavigate(dest)
    }
}
