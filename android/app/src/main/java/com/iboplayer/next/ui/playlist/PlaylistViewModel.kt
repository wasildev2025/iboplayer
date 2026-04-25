package com.iboplayer.next.ui.playlist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.iboplayer.next.AppConfig
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.SettingsStore
import com.iboplayer.next.data.local.PlaylistEntity
import com.iboplayer.next.data.remote.PlayerApi
import com.iboplayer.next.data.remote.PlayerApiException
import com.iboplayer.next.util.DeviceMac
import com.iboplayer.next.util.DeviceName
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PlaylistViewModel @Inject constructor(
    private val settings: SettingsStore,
    private val repo: PlaylistRepository,
    private val api: PlayerApi,
    private val deviceMac: DeviceMac,
) : ViewModel() {

    data class UiState(
        val playlists: List<PlaylistEntity> = emptyList(),
        val connectedId: Int? = null,
        val macAddress: String = "",
        val deviceKey: String = "",
        val panelBaseUrl: String = "",
        val addDialogOpen: Boolean = false,
        val activationCode: String = "",
        val adding: Boolean = false,
        val addError: String? = null,
        val pinDialogFor: PlaylistEntity? = null,
        val pinInput: String = "",
        val pinError: String? = null,
        val connecting: Boolean = false,
    )

    private val _local = MutableStateFlow(UiState())

    private data class SettingsSnapshot(
        val mac: String,
        val deviceKey: String,
        val panelBaseUrl: String,
    )

    private val settingsSnapshot: Flow<SettingsSnapshot> = combine(
        settings.macAddress,
        settings.deviceKey,
        settings.panelBaseUrl,
    ) { mac, deviceKey, base ->
        SettingsSnapshot(mac.orEmpty(), deviceKey.orEmpty(), base.orEmpty())
    }

    val state: StateFlow<UiState> = combine(
        _local,
        repo.playlists,
        repo.connectedPlaylist,
        settingsSnapshot,
    ) { local, list, connected, snap ->
        local.copy(
            playlists = list,
            connectedId = connected?.id,
            macAddress = snap.mac,
            deviceKey = snap.deviceKey,
            panelBaseUrl = snap.panelBaseUrl,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = UiState(),
    )

    fun openAddDialog() = _local.update {
        it.copy(addDialogOpen = true, activationCode = "", addError = null)
    }

    fun closeAddDialog() = _local.update {
        it.copy(addDialogOpen = false, activationCode = "", addError = null, adding = false)
    }

    fun onActivationCodeChange(value: String) = _local.update {
        it.copy(activationCode = value, addError = null)
    }

    fun submitActivationCode(onConnected: () -> Unit) {
        val code = _local.value.activationCode.trim()
        if (code.isEmpty()) {
            _local.update { it.copy(addError = "Enter an activation code") }
            return
        }
        _local.update { it.copy(adding = true, addError = null) }
        viewModelScope.launch {
            try {
                val base = settings.panelBaseUrl.first().orEmpty()
                    .ifBlank { AppConfig.DEFAULT_PANEL_BASE_URL }
                val mac = deviceMac.current()
                val resp = api.activatePlaylist(base, mac, code, deviceName = DeviceName.display)
                // First activation on this device creates a MacUser on the panel
                // and returns a fresh session — persist it so later API calls work.
                val token = resp.token
                if (!token.isNullOrBlank()) {
                    settings.savePanelSession(
                        baseUrl = base,
                        token = token,
                        macAddress = mac,
                        expireAtIso = resp.expireAt,
                        deviceKeyValue = resp.deviceKey,
                    )
                }
                repo.savePlaylistsFromApi(resp.playlists)

                // Channels are fetched + parsed by the server (triggered when
                // the activation code's profile was created), so the device
                // doesn't pull the M3U itself anymore. We just connect the
                // newly-added playlist and navigate.
                val added = resp.added
                    ?: resp.playlists.lastOrNull()
                if (added == null) {
                    _local.update {
                        it.copy(adding = false, addError = "Activation returned no playlist")
                    }
                    return@launch
                }
                repo.setConnected(added.id)
                _local.update {
                    it.copy(adding = false, addDialogOpen = false, activationCode = "")
                }
                onConnected()
            } catch (e: PlayerApiException) {
                _local.update { it.copy(adding = false, addError = e.message) }
            } catch (e: Exception) {
                _local.update { it.copy(adding = false, addError = e.message ?: "Failed") }
            }
        }
    }

    /** Called when a tile is tapped. If protected, open PIN dialog; else connect directly. */
    fun onPlaylistTapped(playlist: PlaylistEntity, onConnected: () -> Unit) {
        if (playlist.isProtected) {
            _local.update { it.copy(pinDialogFor = playlist, pinInput = "", pinError = null) }
        } else {
            connect(playlist, onConnected)
        }
    }

    fun onPinChange(value: String) = _local.update { it.copy(pinInput = value, pinError = null) }

    fun cancelPinDialog() = _local.update {
        it.copy(pinDialogFor = null, pinInput = "", pinError = null)
    }

    fun submitPin(onConnected: () -> Unit) {
        val target = _local.value.pinDialogFor ?: return
        val entered = _local.value.pinInput.trim()
        val expected = target.pin.orEmpty()
        if (expected.isNotBlank() && entered != expected) {
            _local.update { it.copy(pinError = "Incorrect PIN") }
            return
        }
        _local.update { it.copy(pinDialogFor = null, pinInput = "", pinError = null) }
        connect(target, onConnected)
    }

    private fun connect(playlist: PlaylistEntity, onConnected: () -> Unit) {
        _local.update { it.copy(connecting = true) }
        // No client-side M3U fetch — channels are server-side now.
        viewModelScope.launch {
            repo.setConnected(playlist.id)
            _local.update { it.copy(connecting = false) }
            onConnected()
        }
    }
}
