package com.iboplayer.next.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.iboplayer.next.ui.channels.ChannelListScreen
import com.iboplayer.next.ui.player.PlayerScreen
import com.iboplayer.next.ui.setup.SetupScreen
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

object Routes {
    const val SETUP = "setup"
    const val CHANNELS = "channels"
    const val PLAYER = "player/{name}/{url}"

    fun player(name: String, url: String): String {
        val n = URLEncoder.encode(name, StandardCharsets.UTF_8.toString())
        val u = URLEncoder.encode(url, StandardCharsets.UTF_8.toString())
        return "player/$n/$u"
    }
}

@Composable
fun AppNavHost() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = Routes.SETUP) {
        composable(Routes.SETUP) {
            SetupScreen(
                onLoaded = {
                    navController.navigate(Routes.CHANNELS) {
                        popUpTo(Routes.SETUP) { inclusive = true }
                    }
                }
            )
        }
        composable(Routes.CHANNELS) {
            ChannelListScreen(
                onChannelClick = { channel ->
                    navController.navigate(Routes.player(channel.name, channel.url))
                },
                onBack = { navController.navigateUp() },
                onReset = {
                    navController.navigate(Routes.SETUP) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        composable(Routes.PLAYER) { backStackEntry ->
            val name = URLDecoder.decode(
                backStackEntry.arguments?.getString("name").orEmpty(),
                StandardCharsets.UTF_8.toString()
            )
            val url = URLDecoder.decode(
                backStackEntry.arguments?.getString("url").orEmpty(),
                StandardCharsets.UTF_8.toString()
            )
            PlayerScreen(
                title = name,
                streamUrl = url,
                onBack = { navController.navigateUp() }
            )
        }
    }
}
