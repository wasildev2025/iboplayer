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
import com.iboplayer.next.data.local.CacheDao
import com.iboplayer.next.data.local.CacheEntryEntity
import com.iboplayer.next.data.remote.ChannelGroupsResponseDto
import com.iboplayer.next.data.remote.EpgNowNextEntryDto
import com.iboplayer.next.data.remote.FavoritesResponseDto
import com.iboplayer.next.data.remote.PlayerApi
import com.iboplayer.next.data.remote.PlayerJson
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
    private val cache: CacheDao,
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

    private val _favoriteIds = MutableStateFlow<Set<Int>>(emptySet())
    val favoriteIds: StateFlow<Set<Int>> = _favoriteIds.asStateFlow()

    private val _favorites = MutableStateFlow<List<Channel>>(emptyList())
    val favorites: StateFlow<List<Channel>> = _favorites.asStateFlow()

    private val _offline = MutableStateFlow(false)
    val offline: StateFlow<Boolean> = _offline.asStateFlow()

    private val _epg = MutableStateFlow<Map<Int, EpgNowNextEntryDto>>(emptyMap())
    val epg: StateFlow<Map<Int, EpgNowNextEntryDto>> = _epg.asStateFlow()
    private val epgRequested = mutableSetOf<Int>()

    init {
        viewModelScope.launch { loadFavorites() }
        viewModelScope.launch {
            _category.collect { cat ->
                if (cat == ChannelCategory.Favorites) loadFavorites() else loadGroups()
            }
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
            if (cat == ChannelCategory.Favorites) return@flatMapLatest flowOf(PagingData.empty())
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
                            cache = cache,
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
            if (_category.value == ChannelCategory.Favorites) loadFavorites() else loadGroups()
            _refreshing.update { false }
        }
    }

    private suspend fun loadFavorites() {
        val pl = repo.getConnected() ?: return
        val token = settings.playerToken.first().orEmpty()
        val base = settings.panelBaseUrl.first().orEmpty()
            .ifBlank { AppConfig.DEFAULT_PANEL_BASE_URL }
        if (token.isBlank()) return

        val key = "favorites|playlistId=${pl.id}"
        try {
            val resp = api.favorites(baseUrl = base, bearerToken = token, playlistId = pl.id)
            applyFavorites(resp)
            cache.put(
                CacheEntryEntity(
                    cacheKey = key,
                    payloadJson = PlayerJson.json.encodeToString(FavoritesResponseDto.serializer(), resp),
                    updatedAt = System.currentTimeMillis(),
                )
            )
            _offline.update { false }
            _error.update { null }
        } catch (e: Exception) {
            val cached = cache.get(key)?.payloadJson
            if (cached != null) {
                runCatching {
                    applyFavorites(PlayerJson.json.decodeFromString(FavoritesResponseDto.serializer(), cached))
                    _offline.update { true }
                    _error.update { null }
                }.onFailure {
                    _error.update { e.message ?: "Failed to load favorites" }
                }
            } else {
                _error.update { e.message ?: "Failed to load favorites" }
            }
        }
    }

    private fun applyFavorites(resp: FavoritesResponseDto) {
        val items = resp.data.map {
            Channel(
                id = it.id,
                externalId = it.externalId,
                name = it.name,
                url = it.url,
                logo = it.logo,
                groupName = it.groupName,
                category = it.category,
            )
        }
        _favorites.update { items }
        _favoriteIds.update { items.map { it.id }.toSet() }
    }

    fun toggleFavorite(channel: Channel) {
        viewModelScope.launch {
            val token = settings.playerToken.first().orEmpty()
            val base = settings.panelBaseUrl.first().orEmpty()
                .ifBlank { AppConfig.DEFAULT_PANEL_BASE_URL }
            if (token.isBlank()) return@launch

            val currentlyOn = _favoriteIds.value.contains(channel.id)
            val nextOn = !currentlyOn
            // Optimistic update — flip locally, roll back on failure.
            _favoriteIds.update { if (nextOn) it + channel.id else it - channel.id }
            if (nextOn) {
                _favorites.update { list ->
                    if (list.any { it.id == channel.id }) list else list + channel
                }
            } else {
                _favorites.update { list -> list.filterNot { it.id == channel.id } }
            }

            try {
                api.toggleFavorite(
                    baseUrl = base,
                    bearerToken = token,
                    channelId = channel.id,
                    on = nextOn,
                )
            } catch (e: Exception) {
                // Roll back on failure.
                _favoriteIds.update { if (currentlyOn) it + channel.id else it - channel.id }
                if (currentlyOn) {
                    _favorites.update { list ->
                        if (list.any { it.id == channel.id }) list else list + channel
                    }
                } else {
                    _favorites.update { list -> list.filterNot { it.id == channel.id } }
                }
                _error.update { e.message ?: "Failed to update favorite" }
            }
        }
    }

    private suspend fun loadGroups() {
        val pl = repo.getConnected() ?: return
        val token = settings.playerToken.first().orEmpty()
        val base = settings.panelBaseUrl.first().orEmpty()
            .ifBlank { AppConfig.DEFAULT_PANEL_BASE_URL }
        if (token.isBlank()) return

        val key = "groups|playlistId=${pl.id}|category=${categoryKey(_category.value).orEmpty()}"
        try {
            val resp = api.channelGroups(
                baseUrl = base,
                bearerToken = token,
                playlistId = pl.id,
                category = categoryKey(_category.value),
            )
            applyGroups(resp)
            cache.put(
                CacheEntryEntity(
                    cacheKey = key,
                    payloadJson = PlayerJson.json.encodeToString(ChannelGroupsResponseDto.serializer(), resp),
                    updatedAt = System.currentTimeMillis(),
                )
            )
            _offline.update { false }
            _error.update { null }
        } catch (e: Exception) {
            val cached = cache.get(key)?.payloadJson
            if (cached != null) {
                runCatching {
                    applyGroups(PlayerJson.json.decodeFromString(ChannelGroupsResponseDto.serializer(), cached))
                    _offline.update { true }
                    _error.update { null }
                }.onFailure {
                    _error.update { e.message ?: "Failed to load groups" }
                }
            } else {
                _error.update { e.message ?: "Failed to load groups" }
            }
        }
    }

    private fun applyGroups(resp: ChannelGroupsResponseDto) {
        _groups.update { resp.data.map { GroupRow(it.groupName, it.count) } }
    }

    fun onCategoryChange(category: ChannelCategory) {
        _category.update { category }
        _selectedGroup.update { null }
        _query.update { "" }
        // EPG entries are tied to the current visible set — clear so that a
        // category switch refetches now/next for the new tiles.
        epgRequested.clear()
        _epg.update { emptyMap() }
    }

    /**
     * Fetch now/next EPG for the given channel ids, skipping any we've already
     * requested. Called as the LazyPagingItems streams new tiles into view.
     */
    fun ensureEpgFor(channelIds: List<Int>) {
        if (channelIds.isEmpty()) return
        val pending = channelIds.filter { epgRequested.add(it) }
        if (pending.isEmpty()) return
        viewModelScope.launch {
            val pl = repo.getConnected() ?: return@launch
            val token = settings.playerToken.first().orEmpty()
            val base = settings.panelBaseUrl.first().orEmpty()
                .ifBlank { AppConfig.DEFAULT_PANEL_BASE_URL }
            if (token.isBlank()) return@launch
            // Batch in chunks of 100 to stay well under the server's 200 cap.
            pending.chunked(100).forEach { batch ->
                runCatching {
                    api.epgNowNext(base, token, pl.id, batch)
                }.onSuccess { resp ->
                    if (resp.data.isNotEmpty()) {
                        _epg.update { current ->
                            current + resp.data.associateBy { it.channelId }
                        }
                    }
                }.onFailure {
                    // Re-allow retry on next attempt — drop these from the
                    // dedup set so a later refresh can pick them up.
                    epgRequested.removeAll(batch.toSet())
                }
            }
        }
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
        ChannelCategory.Favorites -> null
    }
}
