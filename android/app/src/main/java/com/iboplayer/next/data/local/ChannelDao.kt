package com.iboplayer.next.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ChannelDao {
    @Query("SELECT * FROM channels")
    fun getAll(): Flow<List<ChannelEntity>>

    @Query("SELECT * FROM channels WHERE groupName = :group")
    fun getByGroup(group: String): Flow<List<ChannelEntity>>

    @Query("SELECT DISTINCT groupName FROM channels WHERE groupName IS NOT NULL")
    fun getGroups(): Flow<List<String>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(channels: List<ChannelEntity>)

    @Query("DELETE FROM channels")
    suspend fun deleteAll()

    @Query("SELECT COUNT(*) FROM channels")
    suspend fun getCount(): Int

    @Query("UPDATE channels SET isFavorite = :isFavorite WHERE id = :channelId")
    suspend fun updateFavorite(channelId: String, isFavorite: Boolean)

    @Query("SELECT * FROM channels WHERE isFavorite = 1")
    fun getFavorites(): Flow<List<ChannelEntity>>
}
