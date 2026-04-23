package com.iboplayer.next.ui.setup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.SettingsStore
import com.iboplayer.next.data.remote.PlayerApi
import com.iboplayer.next.data.remote.PlayerApiException
import com.iboplayer.next.util.DeviceMac
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SetupViewModel @Inject constructor(
    private val settings: SettingsStore,
    private val repo: PlaylistRepository,
    private val api: PlayerApi,
) : ViewModel() {

    data class UiState(
        val panelBaseUrl: String = "",
        val activationCode: String = "",
        val macAddress: String = DeviceMac.current(),
        val loginTitle: String = "Enter Your Activation Code",
        val loginSubtitle: String = "",
        val loading: Boolean = false,
        val error: String? = null,
        val showManualM3u: Boolean = false,
        val manualM3uUrl: String = "",
    )

    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val savedBase = settings.panelBaseUrl.first()
            if (!savedBase.isNullOrBlank()) {
                _state.update { it.copy(panelBaseUrl = savedBase) }
            }
            val savedPl = settings.playlistUrl.first()
            if (!savedPl.isNullOrBlank()) {
                _state.update { it.copy(manualM3uUrl = savedPl, showManualM3u = true) }
            }
        }
    }

    fun onPanelUrlChange(value: String) {
        _state.update { it.copy(panelBaseUrl = value, error = null) }
    }

    fun onActivationChange(value: String) {
        _state.update { it.copy(activationCode = value, error = null) }
    }

    fun onManualUrlChange(value: String) {
        _state.update { it.copy(manualM3uUrl = value, error = null) }
    }

    fun setShowManual(show: Boolean) {
        _state.update { it.copy(showManualM3u = show, error = null) }
    }

    fun loginWithPanel(onSuccess: () -> Unit) {
        val base = _state.value.panelBaseUrl.trim().trimEnd('/')
        val mac = _state.value.macAddress
        val activationOptional = _state.value.activationCode.trim().takeIf { it.isNotEmpty() }
        if (base.isBlank()) {
            _state.update {
                it.copy(error = "Enter panel URL (emulator → host: http://10.0.2.2:PORT)")
            }
            return
        }
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            try {
                val boot = api.bootstrap(base)
                _state.update {
                    it.copy(
                        loginTitle = boot.loginTitle.ifBlank { it.loginTitle },
                        loginSubtitle = boot.loginSubtitle,
                    )
                }
                val login = api.login(base, mac, activationOptional)
                val token = login.token ?: throw IllegalStateException("No token")
                val first =
                    login.playlists.firstOrNull()
                        ?: throw IllegalStateException("No playlists returned")
                settings.savePanelSession(
                    baseUrl = base,
                    token = token,
                    playlistUrl = first.playlistUrl,
                    expireAtIso = login.expireAt,
                    deviceKeyValue = login.deviceKey,
                )
                repo.refreshPlaylist(first.playlistUrl).getOrElse { throw it }
                if (!repo.hasCache()) throw IllegalStateException("Playlist has no channels")
                _state.update { it.copy(loading = false) }
                onSuccess()
            } catch (e: PlayerApiException) {
                _state.update { it.copy(loading = false, error = e.message) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(loading = false, error = e.message ?: "Login failed")
                }
            }
        }
    }

    fun loadManualM3u(onSuccess: () -> Unit) {
        val url = _state.value.manualM3uUrl.trim()
        if (url.isBlank()) return
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            repo.refreshPlaylist(url)
                .onSuccess {
                    if (!repo.hasCache()) {
                        _state.update {
                            it.copy(loading = false, error = "Playlist has no channels")
                        }
                        return@launch
                    }
                    settings.clear()
                    settings.savePlaylistUrl(url)
                    _state.update { it.copy(loading = false) }
                    onSuccess()
                }
                .onFailure { t ->
                    _state.update {
                        it.copy(
                            loading = false,
                            error = t.message ?: "Failed to load playlist",
                        )
                    }
                }
        }
    }
}
