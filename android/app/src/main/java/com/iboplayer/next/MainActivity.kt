package com.iboplayer.next

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.fragment.app.FragmentActivity
import dagger.hilt.android.AndroidEntryPoint
import com.iboplayer.next.navigation.AppNavHost
import com.iboplayer.next.ui.theme.IboPlayerTheme

// FragmentActivity (not the bare ComponentActivity) so MediaRouteButton's
// route-picker DialogFragment has a FragmentManager to attach to. Compose,
// Hilt's @AndroidEntryPoint, and enableEdgeToEdge all work the same way on
// FragmentActivity since it's a strict superset of ComponentActivity.
@AndroidEntryPoint
class MainActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
        setContent {
            IboPlayerTheme {
                AppNavHost()
            }
        }
    }
}
