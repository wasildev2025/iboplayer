package com.iboplayer.next.data

import com.iboplayer.next.data.local.CATEGORY_LIVE
import com.iboplayer.next.data.local.CATEGORY_MOVIES
import com.iboplayer.next.data.local.CATEGORY_SERIES
import com.iboplayer.next.data.local.CATEGORY_SPORTS
import com.iboplayer.next.data.local.ChannelDao
import com.iboplayer.next.data.local.GroupCount
import com.iboplayer.next.data.local.PlaylistDao
import com.iboplayer.next.data.local.PlaylistEntity
import com.iboplayer.next.data.local.toEntity
import com.iboplayer.next.data.local.toExternal
import com.iboplayer.next.data.remote.PlaylistItemDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PlaylistRepository @Inject constructor(
    private val client: OkHttpClient,
    private val channelDao: ChannelDao,
    private val playlistDao: PlaylistDao,
) {

    val channels: Flow<List<Channel>> = channelDao.getAll().map { entities ->
        entities.map { it.toExternal() }
    }

    val groups: Flow<List<String>> = channelDao.getGroups()

    val playlists: Flow<List<PlaylistEntity>> = playlistDao.getAll()

    val connectedPlaylist: Flow<PlaylistEntity?> = playlistDao.getConnectedFlow()

    fun channelsForCategory(category: String): Flow<List<Channel>> {
        return channelDao.getByCategory(category).map { entities ->
            entities.map { it.toExternal() }
        }
    }

    fun groupsForCategory(category: String): Flow<List<GroupCount>> {
        return channelDao.getGroupsByCategory(category)
    }

    fun getChannelsByGroup(group: String): Flow<List<Channel>> {
        return channelDao.getByGroup(group).map { entities ->
            entities.map { it.toExternal() }
        }
    }

    suspend fun playlistCount(): Int = playlistDao.count()

    suspend fun getConnected(): PlaylistEntity? = playlistDao.getConnected()

    suspend fun savePlaylistsFromApi(items: List<PlaylistItemDto>) {
        val mapped = items.map { dto ->
            PlaylistEntity(
                id = dto.id,
                title = dto.title,
                playlistUrl = dto.playlistUrl,
                isProtected = dto.protection,
                pin = dto.pin,
            )
        }
        playlistDao.replaceAll(mapped)
    }

    /** Mark the given playlist as the active one. Caller should refresh channels after. */
    suspend fun setConnected(id: Int) {
        playlistDao.setConnected(id)
    }

    suspend fun refreshPlaylist(url: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val request = Request.Builder().url(url).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    error("HTTP ${response.code} loading playlist")
                }
                val body = response.body ?: error("Empty response body")
                body.charStream().buffered().use { reader ->
                    val remoteChannels = M3uParser.parse(reader)
                    val entities = remoteChannels.map { ch ->
                        ch.toEntity(category = categoryOf(ch.group))
                    }
                    channelDao.deleteAll()
                    // Chunked insert keeps the SQLite transaction & cursor
                    // pressure manageable for huge IPTV playlists (10k+ rows).
                    entities.chunked(500).forEach { batch ->
                        channelDao.insertAll(batch)
                    }
                }
            }
        }
    }

    /**
     * Classify a channel by its group-title using keyword heuristics. The
     * derived category is stored on the row so the UI can query a single
     * category (typically ~25% of the table) instead of loading every channel.
     */
    private fun categoryOf(group: String?): String {
        val g = group?.uppercase().orEmpty()
        return when {
            SPORT_KEYWORDS.any { g.contains(it) } -> CATEGORY_SPORTS
            SERIES_KEYWORDS.any { g.contains(it) } -> CATEGORY_SERIES
            MOVIE_KEYWORDS.any { g.contains(it) } -> CATEGORY_MOVIES
            else -> CATEGORY_LIVE
        }
    }

    private companion object {
        val MOVIE_KEYWORDS = listOf("MOVIE", "FILM", "CINEMA", "VOD")
        val SERIES_KEYWORDS = listOf("SERIES", "SERIE", "TV SHOW", "SEASON", "TELEFILM")
        val SPORT_KEYWORDS = listOf(
            "SPORT", "FOOTBALL", "SOCCER", "NBA", "NFL", "UFC", "CRICKET",
            "TENNIS", "F1", "MOTOR", "RUGBY", "BOXING", "GOLF",
        )
    }

    suspend fun clearChannelCache() {
        channelDao.deleteAll()
    }

    suspend fun hasChannelCache(): Boolean = channelDao.getCount() > 0

    suspend fun toggleFavorite(channelId: String, isFavorite: Boolean) {
        channelDao.updateFavorite(channelId, isFavorite)
    }

    val favorites: Flow<List<Channel>> = channelDao.getFavorites().map { entities ->
        entities.map { it.toExternal() }
    }
}
