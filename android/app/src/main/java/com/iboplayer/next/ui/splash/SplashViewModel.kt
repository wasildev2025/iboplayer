package com.iboplayer.next.ui.splash

import androidx.lifecycle.ViewModel
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.SettingsStore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.first
import javax.inject.Inject

enum class SplashDestination {
    Channels,
    Setup,
}

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val settings: SettingsStore,
    private val repo: PlaylistRepository,
) : ViewModel() {

    suspend fun resolveDestination(): SplashDestination {
        val playlist = settings.playlistUrl.first().orEmpty()
        if (playlist.isBlank()) return SplashDestination.Setup

        val refresh = repo.refreshPlaylist(playlist)
        if (refresh.isSuccess) return SplashDestination.Channels

        return if (repo.hasCache()) SplashDestination.Channels else SplashDestination.Setup
    }
}
