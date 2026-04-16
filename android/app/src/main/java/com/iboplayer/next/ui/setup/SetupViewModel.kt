package com.iboplayer.next.ui.setup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import com.iboplayer.next.IboApp
import com.iboplayer.next.data.ChannelHolder
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.SettingsStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SetupViewModel(
    private val settings: SettingsStore,
    private val repo: PlaylistRepository,
) : ViewModel() {

    data class UiState(
        val url: String = "",
        val loading: Boolean = false,
        val error: String? = null,
    )

    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            settings.playlistUrl.firstOrNull()?.let { saved ->
                _state.update { it.copy(url = saved) }
            }
        }
    }

    fun onUrlChange(newUrl: String) {
        _state.update { it.copy(url = newUrl, error = null) }
    }

    fun load(onLoaded: () -> Unit) {
        val url = _state.value.url.trim()
        if (url.isBlank()) return
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            val result = repo.load(url)
            result
                .onSuccess { channels ->
                    if (channels.isEmpty()) {
                        _state.update {
                            it.copy(loading = false, error = "Playlist has no channels")
                        }
                        return@onSuccess
                    }
                    ChannelHolder.channels = channels
                    settings.savePlaylistUrl(url)
                    _state.update { it.copy(loading = false) }
                    onLoaded()
                }
                .onFailure { t ->
                    _state.update {
                        it.copy(
                            loading = false,
                            error = t.message ?: "Failed to load playlist"
                        )
                    }
                }
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val app = this[APPLICATION_KEY] as IboApp
                SetupViewModel(app.settingsStore, app.playlistRepository)
            }
        }
    }
}
