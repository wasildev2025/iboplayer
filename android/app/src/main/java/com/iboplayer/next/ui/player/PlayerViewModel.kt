package com.iboplayer.next.ui.player

import android.content.Context
import androidx.annotation.OptIn
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.media3.cast.CastPlayer
import androidx.media3.cast.SessionAvailabilityListener
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.ConnectionResult
import com.iboplayer.next.AppConfig
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.SettingsStore
import com.iboplayer.next.data.remote.EpgProgrammeDto
import com.iboplayer.next.data.remote.PlayerApi
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
@OptIn(UnstableApi::class)
class PlayerViewModel @Inject constructor(
    @ApplicationContext appContext: Context,
    private val exoPlayer: ExoPlayer,
    private val api: PlayerApi,
    private val settings: SettingsStore,
    private val repo: PlaylistRepository,
) : ViewModel() {

    /**
     * CastPlayer requires Google Play Services. On non-Play devices (some
     * TV boxes, some Huawei devices) this fails — we fall back to local-only
     * playback and the MediaRouteButton stays hidden.
     */
    private val castContext: CastContext? = runCatching {
        if (GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(appContext)
            == ConnectionResult.SUCCESS
        ) CastContext.getSharedInstance(appContext) else null
    }.getOrNull()

    private val castPlayer: CastPlayer? = castContext?.let {
        runCatching { CastPlayer(it) }.getOrNull()
    }

    private val _currentPlayer = MutableStateFlow<Player>(exoPlayer)
    val currentPlayer: StateFlow<Player> = _currentPlayer.asStateFlow()

    val castAvailable: Boolean get() = castPlayer != null

    private val _programmes = MutableStateFlow<List<EpgProgrammeDto>>(emptyList())
    val programmes: StateFlow<List<EpgProgrammeDto>> = _programmes.asStateFlow()

    private var pendingMediaItem: MediaItem? = null

    init {
        val cp = castPlayer
        cp?.setSessionAvailabilityListener(object : SessionAvailabilityListener {
            override fun onCastSessionAvailable() {
                // Hand off whatever is currently playing locally to the cast device.
                val item = pendingMediaItem ?: return
                exoPlayer.pause()
                cp.setMediaItem(item)
                cp.prepare()
                cp.play()
                _currentPlayer.update { cp }
            }

            override fun onCastSessionUnavailable() {
                // Resume locally from where the cast left off (best effort).
                val item = pendingMediaItem ?: return
                exoPlayer.setMediaItem(item)
                exoPlayer.prepare()
                exoPlayer.play()
                _currentPlayer.update { exoPlayer }
            }
        })
    }

    fun play(url: String) {
        val mediaItem = MediaItem.fromUri(url)
        pendingMediaItem = mediaItem
        val cp = castPlayer
        val active: Player =
            if (cp != null && cp.isCastSessionAvailable) cp else exoPlayer
        active.setMediaItem(mediaItem)
        active.prepare()
        active.play()
        _currentPlayer.update { active }
    }

    fun loadProgrammes(channelId: Int) {
        if (channelId <= 0) return
        viewModelScope.launch {
            val pl = repo.getConnected() ?: return@launch
            val token = settings.playerToken.first().orEmpty()
            val base = settings.panelBaseUrl.first().orEmpty()
                .ifBlank { AppConfig.DEFAULT_PANEL_BASE_URL }
            if (token.isBlank()) return@launch
            runCatching {
                api.epgProgrammes(base, token, pl.id, channelId)
            }.onSuccess { resp ->
                _programmes.update { resp.data }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        exoPlayer.stop()
        castPlayer?.setSessionAvailabilityListener(null)
        castPlayer?.release()
    }
}
