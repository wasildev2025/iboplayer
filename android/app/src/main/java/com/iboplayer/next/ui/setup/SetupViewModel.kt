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
    )

    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val savedBase = settings.panelBaseUrl.first()
            if (!savedBase.isNullOrBlank()) {
                _state.update { it.copy(panelBaseUrl = savedBase) }
            }
        }
    }

    fun onPanelUrlChange(value: String) {
        _state.update { it.copy(panelBaseUrl = value, error = null) }
    }

    fun onActivationChange(value: String) {
        _state.update { it.copy(activationCode = value, error = null) }
    }

    /**
     * First-time login: register MAC against the panel, persist session, save the
     * returned playlists to local DB. Connection of a specific playlist happens
     * on the Playlist screen (or in the activation-code add flow).
     */
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
                settings.savePanelSession(
                    baseUrl = base,
                    token = token,
                    macAddress = mac,
                    expireAtIso = login.expireAt,
                    deviceKeyValue = login.deviceKey,
                )
                repo.savePlaylistsFromApi(login.playlists)
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
}
