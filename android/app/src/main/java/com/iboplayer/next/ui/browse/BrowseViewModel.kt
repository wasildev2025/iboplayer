package com.iboplayer.next.ui.browse

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.iboplayer.next.data.Channel
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.local.CATEGORY_LIVE
import com.iboplayer.next.data.local.CATEGORY_MOVIES
import com.iboplayer.next.data.local.CATEGORY_SERIES
import com.iboplayer.next.data.local.CATEGORY_SPORTS
import com.iboplayer.next.ui.channels.ChannelCategory
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class SortOrder { Added, NameAsc, NameDesc }

data class GroupRow(val title: String, val count: Int)

@HiltViewModel
class BrowseViewModel @Inject constructor(
    private val repo: PlaylistRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val initialCategory: ChannelCategory =
        ChannelCategory.fromKey(savedStateHandle["category"])

    private val _category = MutableStateFlow(initialCategory)
    private val _selectedGroup = MutableStateFlow<String?>(null)
    private val _query = MutableStateFlow("")
    private val _sort = MutableStateFlow(SortOrder.Added)
    private val _refreshing = MutableStateFlow(false)
    val refreshing: StateFlow<Boolean> = _refreshing.asStateFlow()

    init {
        // First-open auto-refresh: pull the M3U if the channel cache is empty
        // (fresh install / cache cleared) so users don't land on an empty grid.
        viewModelScope.launch {
            if (!repo.hasChannelCache()) refresh()
        }
    }

    fun refresh() {
        if (_refreshing.value) return
        viewModelScope.launch {
            _refreshing.update { true }
            runCatching {
                val connected = repo.getConnected() ?: return@runCatching
                repo.refreshPlaylist(connected.playlistUrl)
            }
            _refreshing.update { false }
        }
    }

    /**
     * Channels + group counts scoped to the current category. Subscribing only
     * to the active category's rows keeps the SQLite cursor window small and
     * avoids loading the entire channel table (which OOMs on 10k+ playlists).
     */
    @OptIn(ExperimentalCoroutinesApi::class)
    private val categoryData: Flow<CategorySnapshot> =
        _category.flatMapLatest { cat ->
            val key = categoryKey(cat)
            if (key != null) {
                combine(
                    repo.channelsForCategory(key),
                    repo.groupsForCategory(key),
                ) { channels, counts ->
                    CategorySnapshot(
                        category = cat,
                        channels = channels,
                        groups = counts.map { GroupRow(it.groupName, it.count) },
                    )
                }
            } else {
                // ChannelCategory.All — falls back to the full table. Not used
                // by the current Home navigation but kept for completeness.
                repo.channels.map { channels ->
                    val groups = channels.asSequence()
                        .mapNotNull { it.group }
                        .groupingBy { it }
                        .eachCount()
                        .entries
                        .map { GroupRow(it.key, it.value) }
                        .sortedBy { it.title.lowercase() }
                    CategorySnapshot(cat, channels, groups)
                }
            }
        }

    val state: StateFlow<UiState> = combine(
        categoryData,
        _selectedGroup,
        _query,
        _sort,
    ) { snap, selectedGroup, query, sort ->
        val effectiveGroup = selectedGroup ?: snap.groups.firstOrNull()?.title

        val items = snap.channels.asSequence()
            .filter { effectiveGroup == null || it.group == effectiveGroup }
            .filter { query.isBlank() || it.name.contains(query, ignoreCase = true) }
            .toList()
            .let { list ->
                when (sort) {
                    SortOrder.Added -> list
                    SortOrder.NameAsc -> list.sortedBy { it.name.lowercase() }
                    SortOrder.NameDesc -> list.sortedByDescending { it.name.lowercase() }
                }
            }

        UiState(
            category = snap.category,
            groups = snap.groups,
            selectedGroup = effectiveGroup,
            items = items,
            query = query,
            sort = sort,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = UiState(category = initialCategory),
    )

    data class UiState(
        val category: ChannelCategory = ChannelCategory.All,
        val groups: List<GroupRow> = emptyList(),
        val selectedGroup: String? = null,
        val items: List<Channel> = emptyList(),
        val query: String = "",
        val sort: SortOrder = SortOrder.Added,
    )

    private data class CategorySnapshot(
        val category: ChannelCategory,
        val channels: List<Channel>,
        val groups: List<GroupRow>,
    )

    fun onCategoryChange(category: ChannelCategory) {
        _category.update { category }
        _selectedGroup.update { null }
        _query.update { "" }
    }

    fun onGroupSelected(title: String) = _selectedGroup.update { title }

    fun onQueryChange(value: String) = _query.update { value }

    fun onSortChange(order: SortOrder) = _sort.update { order }

    fun toggleFavorite(channel: Channel) {
        viewModelScope.launch {
            repo.toggleFavorite(channel.id, !channel.isFavorite)
        }
    }

    private fun categoryKey(category: ChannelCategory): String? = when (category) {
        ChannelCategory.Live -> CATEGORY_LIVE
        ChannelCategory.Movies -> CATEGORY_MOVIES
        ChannelCategory.Series -> CATEGORY_SERIES
        ChannelCategory.Sports -> CATEGORY_SPORTS
        ChannelCategory.All -> null
    }
}
