package com.iboplayer.next.data

import com.iboplayer.next.data.local.PlaylistDao
import com.iboplayer.next.data.local.PlaylistEntity
import com.iboplayer.next.data.remote.PlaylistItemDto
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Local persistence for the device's playlists. Channels are no longer
 * stored client-side — they're served paginated from `/api/player/channels`
 * via the new ChannelPagingSource. So this repo is a thin wrapper around
 * PlaylistDao.
 */
@Singleton
class PlaylistRepository @Inject constructor(
    private val playlistDao: PlaylistDao,
) {

    val playlists: Flow<List<PlaylistEntity>> = playlistDao.getAll()

    val connectedPlaylist: Flow<PlaylistEntity?> = playlistDao.getConnectedFlow()

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

    /** Mark the given playlist as the active one. */
    suspend fun setConnected(id: Int) {
        playlistDao.setConnected(id)
    }
}
