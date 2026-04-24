package com.iboplayer.next.ui.playlist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.SettingsStore
import com.iboplayer.next.data.local.PlaylistEntity
import com.iboplayer.next.data.remote.PlayerApi
import com.iboplayer.next.data.remote.PlayerApiException
import dagger.hilt.android.lifecycle.HiltViewModel
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

    val state: StateFlow<UiState> = combine(
        _local,
        repo.playlists,
        repo.connectedPlaylist,
        settings.macAddress,
        settings.deviceKey,
        settings.panelBaseUrl,
    ) { arr ->
        val local = arr[0] as UiState
        @Suppress("UNCHECKED_CAST")
        val list = arr[1] as List<PlaylistEntity>
        val connected = arr[2] as PlaylistEntity?
        val mac = arr[3] as String?
        val deviceKey = arr[4] as String?
        val base = arr[5] as String?
        local.copy(
            playlists = list,
            connectedId = connected?.id,
            macAddress = mac.orEmpty(),
            deviceKey = deviceKey.orEmpty(),
            panelBaseUrl = base.orEmpty(),
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

    fun submitActivationCode() {
        val code = _local.value.activationCode.trim()
        if (code.isEmpty()) {
            _local.update { it.copy(addError = "Enter an activation code") }
            return
        }
        _local.update { it.copy(adding = true, addError = null) }
        viewModelScope.launch {
            try {
                val base = settings.panelBaseUrl.first().orEmpty()
                val token = settings.playerToken.first().orEmpty()
                if (base.isBlank() || token.isBlank()) {
                    _local.update { it.copy(adding = false, addError = "Not signed in") }
                    return@launch
                }
                val resp = api.activatePlaylist(base, token, code)
                repo.savePlaylistsFromApi(resp.playlists)
                _local.update {
                    it.copy(adding = false, addDialogOpen = false, activationCode = "")
                }
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
        viewModelScope.launch {
            repo.setConnected(playlist.id)
            repo.refreshPlaylist(playlist.playlistUrl)
            _local.update { it.copy(connecting = false) }
            onConnected()
        }
    }
}
