package com.iboplayer.next.ui.browse

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.iboplayer.next.data.Channel
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.ui.channels.ChannelCategory
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
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

    val state: StateFlow<UiState> = combine(
        repo.channels,
        _category,
        _selectedGroup,
        _query,
        _sort,
    ) { channels, category, selectedGroup, query, sort ->
        val categoryChannels = channels.filter { matchesCategory(it.group, category) }

        val groupCounts = categoryChannels
            .mapNotNull { it.group }
            .groupingBy { it }
            .eachCount()
        val groups = groupCounts.entries
            .map { GroupRow(it.key, it.value) }
            .sortedBy { it.title }

        val effectiveGroup = selectedGroup ?: groups.firstOrNull()?.title

        val filteredItems = categoryChannels.asSequence()
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
            category = category,
            groups = groups,
            selectedGroup = effectiveGroup,
            items = filteredItems,
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

    private fun matchesCategory(group: String?, category: ChannelCategory): Boolean {
        if (category == ChannelCategory.All) return true
        val g = group?.uppercase().orEmpty()
        return when (category) {
            ChannelCategory.Movies ->
                MOVIE_KEYWORDS.any { g.contains(it) } && SERIES_KEYWORDS.none { g.contains(it) }
            ChannelCategory.Series -> SERIES_KEYWORDS.any { g.contains(it) }
            ChannelCategory.Sports -> SPORT_KEYWORDS.any { g.contains(it) }
            ChannelCategory.Live -> {
                MOVIE_KEYWORDS.none { g.contains(it) } &&
                    SERIES_KEYWORDS.none { g.contains(it) } &&
                    SPORT_KEYWORDS.none { g.contains(it) }
            }
            ChannelCategory.All -> true
        }
    }

    companion object {
        private val MOVIE_KEYWORDS = listOf("MOVIE", "FILM", "CINEMA", "VOD")
        private val SERIES_KEYWORDS = listOf("SERIES", "SERIE", "TV SHOW", "SEASON", "TELEFILM")
        private val SPORT_KEYWORDS = listOf(
            "SPORT", "FOOTBALL", "SOCCER", "NBA", "NFL", "UFC", "CRICKET",
            "TENNIS", "F1", "MOTOR", "RUGBY", "BOXING", "GOLF",
        )
    }
}
