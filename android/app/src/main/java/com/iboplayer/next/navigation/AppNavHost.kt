package com.iboplayer.next.navigation

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.iboplayer.next.ui.browse.BrowseScreen
import com.iboplayer.next.ui.home.HomeAction
import com.iboplayer.next.ui.home.HomeScreen
import com.iboplayer.next.ui.home.HomeViewModel
import com.iboplayer.next.ui.player.PlayerScreen
import com.iboplayer.next.ui.playlist.PlaylistScreen
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

object Routes {
    const val HOME = "home"
    const val PLAYLISTS = "playlists"
    const val BROWSE = "browse/{category}"
    const val PLAYER = "player/{name}/{url}"

    fun browse(category: String) = "browse/$category"

    fun player(name: String, url: String): String {
        val n = URLEncoder.encode(name, StandardCharsets.UTF_8.toString())
        val u = URLEncoder.encode(url, StandardCharsets.UTF_8.toString())
        return "player/$n/$u"
    }
}

@Composable
fun AppNavHost() {
    val navController = rememberNavController()
    val activity = LocalContext.current.findActivity()

    NavHost(navController = navController, startDestination = Routes.HOME) {
        composable(Routes.HOME) {
            val homeVm: HomeViewModel = hiltViewModel()
            val state by homeVm.state.collectAsState()
            HomeScreen(
                viewModel = homeVm,
                onAction = { action ->
                    val toBrowse: (String) -> Unit = { category ->
                        if (state.hasConnectedPlaylist) {
                            navController.navigate(Routes.browse(category))
                        } else {
                            navController.navigate(Routes.PLAYLISTS)
                        }
                    }
                    when (action) {
                        HomeAction.Live -> toBrowse("live")
                        HomeAction.Movies -> toBrowse("movies")
                        HomeAction.Series -> toBrowse("series")
                        HomeAction.Sports -> toBrowse("sports")
                        HomeAction.Playlist -> navController.navigate(Routes.PLAYLISTS)
                        HomeAction.Reload -> homeVm.reload { /* stay on Home */ }
                        HomeAction.Settings -> navController.navigate(Routes.PLAYLISTS)
                        HomeAction.Exit -> activity?.finishAffinity()
                    }
                },
            )
        }

        composable(Routes.PLAYLISTS) {
            PlaylistScreen(
                onConnected = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.HOME) { inclusive = true }
                    }
                },
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(Routes.HOME) {
                            popUpTo(Routes.PLAYLISTS) { inclusive = true }
                        }
                    }
                },
            )
        }

        composable(
            route = Routes.BROWSE,
            arguments = listOf(navArgument("category") { type = NavType.StringType }),
        ) {
            BrowseScreen(
                onPlay = { channel ->
                    navController.navigate(Routes.player(channel.name, channel.url))
                },
                onHome = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.HOME) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.PLAYER) { backStackEntry ->
            val name = URLDecoder.decode(
                backStackEntry.arguments?.getString("name").orEmpty(),
                StandardCharsets.UTF_8.toString(),
            )
            val url = URLDecoder.decode(
                backStackEntry.arguments?.getString("url").orEmpty(),
                StandardCharsets.UTF_8.toString(),
            )
            PlayerScreen(
                title = name,
                streamUrl = url,
                onBack = { navController.navigateUp() },
            )
        }
    }
}

private fun Context.findActivity(): Activity? {
    var ctx: Context? = this
    while (ctx is ContextWrapper) {
        if (ctx is Activity) return ctx
        ctx = ctx.baseContext
    }
    return null
}
