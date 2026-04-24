package com.iboplayer.next.ui.channels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.iboplayer.next.data.Channel
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.SettingsStore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChannelListViewModel @Inject constructor(
    private val repo: PlaylistRepository,
    private val settings: SettingsStore,
) : ViewModel() {

    private val _query = MutableStateFlow("")
    private val _selectedGroup = MutableStateFlow<String?>(null)

    val state: StateFlow<UiState> = combine(
        repo.channels,
        repo.groups,
        _query,
        _selectedGroup,
    ) { channels, groups, query, selectedGroup ->
        val finalGroups = (listOf("Favorites") + groups.sorted())

        val filtered = channels.asSequence()
            .filter {
                when (selectedGroup) {
                    null -> true
                    "Favorites" -> it.isFavorite
                    else -> it.group == selectedGroup
                }
            }
            .filter { query.isBlank() || it.name.contains(query, ignoreCase = true) }
            .toList()

        UiState(
            query = query,
            selectedGroup = selectedGroup,
            groups = finalGroups,
            filtered = filtered,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = UiState(),
    )

    data class UiState(
        val query: String = "",
        val selectedGroup: String? = null,
        val groups: List<String> = emptyList(),
        val filtered: List<Channel> = emptyList(),
    )

    fun onQueryChange(value: String) {
        _query.update { value }
    }

    fun onGroupSelected(group: String?) {
        _selectedGroup.update { group }
    }

    fun toggleFavorite(channel: Channel) {
        viewModelScope.launch {
            repo.toggleFavorite(channel.id, !channel.isFavorite)
        }
    }

    /** Clears saved panel session + playlist URL + channel cache, then navigate via [onDone]. */
    fun resetSession(onDone: () -> Unit) {
        viewModelScope.launch {
            settings.clear()
            repo.clearChannelCache()
            onDone()
        }
    }
}
