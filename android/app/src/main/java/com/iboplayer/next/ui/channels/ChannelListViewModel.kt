package com.iboplayer.next.ui.channels

import androidx.lifecycle.ViewModel
import com.iboplayer.next.data.Channel
import com.iboplayer.next.data.ChannelHolder
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class ChannelListViewModel : ViewModel() {

    data class UiState(
        val query: String = "",
        val selectedGroup: String? = null,
        val allChannels: List<Channel> = emptyList(),
    ) {
        val groups: List<String> = allChannels
            .mapNotNull { it.group }
            .distinct()
            .sorted()

        val filtered: List<Channel> = allChannels
            .asSequence()
            .filter { selectedGroup == null || it.group == selectedGroup }
            .filter { query.isBlank() || it.name.contains(query, ignoreCase = true) }
            .toList()
    }

    private val _state = MutableStateFlow(UiState(allChannels = ChannelHolder.channels))
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun onQueryChange(value: String) {
        _state.update { it.copy(query = value) }
    }

    fun onGroupSelected(group: String?) {
        _state.update { it.copy(selectedGroup = group) }
    }
}
