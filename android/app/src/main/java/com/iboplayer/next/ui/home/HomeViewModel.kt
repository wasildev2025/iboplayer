package com.iboplayer.next.ui.home

import android.content.pm.PackageManager
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.SettingsStore
import com.iboplayer.next.data.remote.PlayerApi
import com.iboplayer.next.data.remote.PlayerApiException
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
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
) : ViewModel() {

    data class UiState(
        val expiresLabel: String? = null,
        val appVersion: String = "4.0",
        val reloading: Boolean = false,
        val reloadError: String? = null,
    )

    private val _local = MutableStateFlow(UiState(appVersion = context.appVersionName()))

    val state: StateFlow<UiState> = combine(
        _local,
        settings.expireAt,
    ) { local, expire ->
        local.copy(expiresLabel = formatExpires(expire))
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = _local.value,
    )

    /** Re-fetch playlists from the panel and refresh the active playlist's channels. */
    fun reload(onDone: () -> Unit) {
        _local.update { it.copy(reloading = true, reloadError = null) }
        viewModelScope.launch {
            try {
                val base = settings.panelBaseUrl.first().orEmpty()
                val token = settings.playerToken.first().orEmpty()
                if (base.isBlank() || token.isBlank()) {
                    _local.update { it.copy(reloading = false, reloadError = "Not signed in") }
                    return@launch
                }
                val resp = api.playlists(base, token)
                repo.savePlaylistsFromApi(resp.playlists)
                val connected = repo.getConnected()
                if (connected != null) {
                    repo.refreshPlaylist(connected.playlistUrl)
                }
                _local.update { it.copy(reloading = false) }
                onDone()
            } catch (e: PlayerApiException) {
                _local.update { it.copy(reloading = false, reloadError = e.message) }
            } catch (e: Exception) {
                _local.update { it.copy(reloading = false, reloadError = e.message) }
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
