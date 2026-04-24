package com.iboplayer.next.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface PlaylistDao {
    @Query("SELECT * FROM playlists ORDER BY id ASC")
    fun getAll(): Flow<List<PlaylistEntity>>

    @Query("SELECT * FROM playlists WHERE isConnected = 1 LIMIT 1")
    fun getConnectedFlow(): Flow<PlaylistEntity?>

    @Query("SELECT * FROM playlists WHERE isConnected = 1 LIMIT 1")
    suspend fun getConnected(): PlaylistEntity?

    @Query("SELECT * FROM playlists WHERE id = :id LIMIT 1")
    suspend fun getById(id: Int): PlaylistEntity?

    @Query("SELECT COUNT(*) FROM playlists")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(items: List<PlaylistEntity>)

    @Query("DELETE FROM playlists")
    suspend fun deleteAll()

    @Query("UPDATE playlists SET isConnected = 0")
    suspend fun clearConnected()

    @Query("UPDATE playlists SET isConnected = CASE WHEN id = :id THEN 1 ELSE 0 END")
    suspend fun setConnected(id: Int)

    /**
     * Replace the full playlist set, preserving the previously-connected id when
     * still present in the new set.
     */
    @Transaction
    suspend fun replaceAll(items: List<PlaylistEntity>) {
        val previousConnectedId = getConnected()?.id
        deleteAll()
        upsertAll(items)
        if (previousConnectedId != null && items.any { it.id == previousConnectedId }) {
            setConnected(previousConnectedId)
        }
    }
}
