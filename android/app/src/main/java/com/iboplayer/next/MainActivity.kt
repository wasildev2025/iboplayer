package com.iboplayer.next

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.iboplayer.next.navigation.AppNavHost
import com.iboplayer.next.ui.theme.IboPlayerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            IboPlayerTheme {
                AppNavHost()
            }
        }
    }
}
