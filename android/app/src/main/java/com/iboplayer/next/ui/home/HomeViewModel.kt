package com.iboplayer.next.ui.home

import android.content.Context
import android.content.pm.PackageManager
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.iboplayer.next.AppConfig
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.SettingsStore
import com.iboplayer.next.data.remote.PlayerApi
import com.iboplayer.next.util.DeviceMac
import com.iboplayer.next.util.DeviceName
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    @ApplicationContext context: Context,
    private val settings: SettingsStore,
    private val repo: PlaylistRepository,
    private val api: PlayerApi,
    private val deviceMac: DeviceMac,
) : ViewModel() {

    data class UiState(
        val expiresLabel: String? = null,
        val appVersion: String = "4.0",
        val reloading: Boolean = false,
        val reloadError: String? = null,
        val hasConnectedPlaylist: Boolean = false,
    )

    private val _local = MutableStateFlow(UiState(appVersion = context.appVersionName()))

    val state: StateFlow<UiState> = combine(
        _local,
        settings.expireAt,
        repo.connectedPlaylist,
    ) { local, expire, connected ->
        local.copy(
            expiresLabel = formatExpires(expire),
            hasConnectedPlaylist = connected != null,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = _local.value,
    )

    init {
        viewModelScope.launch { bootstrap() }
    }

    /**
     * First-boot session + playlist priming. Silent-fails on offline or missing
     * MacUser — the Home tiles are still usable; Playlist screen shows the gap.
     */
    private suspend fun bootstrap() {
        val base = settings.panelBaseUrl.first().orEmpty()
            .ifBlank { AppConfig.DEFAULT_PANEL_BASE_URL }
        val existingToken = settings.playerToken.first().orEmpty()

        runCatching {
            if (existingToken.isBlank()) {
                val login = api.login(base, deviceMac.current(), null, deviceName = DeviceName.display)
                val token = login.token ?: return@runCatching
                settings.savePanelSession(
                    baseUrl = base,
                    token = token,
                    macAddress = deviceMac.current(),
                    expireAtIso = login.expireAt,
                    deviceKeyValue = login.deviceKey,
                )
                repo.savePlaylistsFromApi(login.playlists)
            } else {
                val resp = api.playlists(base, existingToken)
                repo.savePlaylistsFromApi(resp.playlists)
            }
        }

        // Channels are managed server-side now — nothing to refresh locally.
    }

    /** Pull fresh playlists from panel. (Channels are server-side now.) */
    fun reload(onDone: () -> Unit) {
        _local.update { it.copy(reloading = true, reloadError = null) }
        viewModelScope.launch {
            val base = settings.panelBaseUrl.first().orEmpty()
                .ifBlank { AppConfig.DEFAULT_PANEL_BASE_URL }
            val token = settings.playerToken.first().orEmpty()
            val result = runCatching {
                if (token.isBlank()) {
                    val login = api.login(base, deviceMac.current(), null, deviceName = DeviceName.display)
                    val newToken = login.token ?: error("No token")
                    settings.savePanelSession(
                        baseUrl = base,
                        token = newToken,
                        macAddress = deviceMac.current(),
                        expireAtIso = login.expireAt,
                        deviceKeyValue = login.deviceKey,
                    )
                    repo.savePlaylistsFromApi(login.playlists)
                } else {
                    val resp = api.playlists(base, token)
                    repo.savePlaylistsFromApi(resp.playlists)
                }
                // Channels are server-side; no per-playlist M3U fetch needed here.
            }
            result.onFailure { t ->
                _local.update { it.copy(reloading = false, reloadError = t.message) }
            }.onSuccess {
                _local.update { it.copy(reloading = false) }
                onDone()
            }
        }
    }

    private fun formatExpires(iso: String?): String? {
        if (iso.isNullOrBlank()) return null
        return try {
            val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.systemDefault())
            "Expires: ${formatter.format(Instant.parse(iso))}"
        } catch (_: Exception) {
            null
        }
    }
}

private fun Context.appVersionName(): String = try {
    @Suppress("DEPRECATION")
    packageManager.getPackageInfo(packageName, 0).versionName ?: "1.0"
} catch (_: PackageManager.NameNotFoundException) {
    "1.0"
}
