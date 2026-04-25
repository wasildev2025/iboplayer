package com.iboplayer.next.ui.browse

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import androidx.paging.cachedIn
import com.iboplayer.next.AppConfig
import com.iboplayer.next.data.Channel
import com.iboplayer.next.data.ChannelPagingSource
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.SettingsStore
import com.iboplayer.next.data.remote.PlayerApi
import com.iboplayer.next.data.remote.PlayerApiException
import com.iboplayer.next.ui.channels.ChannelCategory
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class SortOrder { Added, NameAsc, NameDesc }

data class GroupRow(val title: String, val count: Int)

@HiltViewModel
class BrowseViewModel @Inject constructor(
    private val repo: PlaylistRepository,
    private val api: PlayerApi,
    private val settings: SettingsStore,
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

    private val _groups = MutableStateFlow<List<GroupRow>>(emptyList())
    val groups: StateFlow<List<GroupRow>> = _groups.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        // Load groups whenever the category changes — drives the chip strip.
        viewModelScope.launch {
            _category.collect { loadGroups() }
        }
    }

    /**
     * Pages of channels for the current (category, selectedGroup, query)
     * combination. Backed by `ChannelPagingSource` — each page is a server
     * request, no client-side caching of the full list.
     */
    @OptIn(ExperimentalCoroutinesApi::class)
    val channelPages: Flow<PagingData<Channel>> = combine(
        _category,
        _selectedGroup,
        _query,
    ) { cat, group, query -> Triple(cat, group, query) }
        .flatMapLatest { (cat, group, query) ->
            val pl = repo.getConnected()
            val token = settings.playerToken.first().orEmpty()
            val base = settings.panelBaseUrl.first().orEmpty()
                .ifBlank { AppConfig.DEFAULT_PANEL_BASE_URL }
            if (pl == null || token.isBlank()) {
                _error.update { "No connected playlist or session token" }
                flowOf(PagingData.empty())
            } else {
                Pager(
                    config = PagingConfig(
                        pageSize = 50,
                        initialLoadSize = 50,
                        prefetchDistance = 25,
                        enablePlaceholders = false,
                    ),
                    pagingSourceFactory = {
                        ChannelPagingSource(
                            api = api,
                            baseUrl = base,
                            bearerToken = token,
                            playlistId = pl.id,
                            category = categoryKey(cat),
                            group = group,
                            search = query,
                        )
                    },
                ).flow
            }
        }
        .cachedIn(viewModelScope)

    val state: StateFlow<UiState> = combine(
        _category,
        _selectedGroup,
        _query,
        _sort,
        _groups,
    ) { cat, group, query, sort, groups ->
        UiState(
            category = cat,
            groups = groups,
            selectedGroup = group ?: groups.firstOrNull()?.title,
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
        val query: String = "",
        val sort: SortOrder = SortOrder.Added,
    )

    /**
     * Re-fetch the group list. Called automatically on category change and
     * via the user pulling to refresh.
     */
    fun refresh() {
        if (_refreshing.value) return
        viewModelScope.launch {
            _refreshing.update { true }
            loadGroups()
            _refreshing.update { false }
        }
    }

    private suspend fun loadGroups() {
        val pl = repo.getConnected() ?: return
        val token = settings.playerToken.first().orEmpty()
        val base = settings.panelBaseUrl.first().orEmpty()
            .ifBlank { AppConfig.DEFAULT_PANEL_BASE_URL }
        if (token.isBlank()) return

        try {
            val resp = api.channelGroups(
                baseUrl = base,
                bearerToken = token,
                playlistId = pl.id,
                category = categoryKey(_category.value),
            )
            _groups.update {
                resp.data.map { GroupRow(it.groupName, it.count) }
            }
            _error.update { null }
        } catch (e: PlayerApiException) {
            _error.update { e.message ?: "Failed to load groups" }
        } catch (e: Exception) {
            _error.update { e.message ?: "Failed to load groups" }
        }
    }

    fun onCategoryChange(category: ChannelCategory) {
        _category.update { category }
        _selectedGroup.update { null }
        _query.update { "" }
    }

    fun onGroupSelected(title: String) = _selectedGroup.update { title }

    fun onQueryChange(value: String) = _query.update { value }

    fun onSortChange(order: SortOrder) = _sort.update { order }

    private fun categoryKey(category: ChannelCategory): String? = when (category) {
        ChannelCategory.Live -> "live"
        ChannelCategory.Movies -> "movies"
        ChannelCategory.Series -> "series"
        ChannelCategory.Sports -> "sports"
        ChannelCategory.All -> null
    }
}
