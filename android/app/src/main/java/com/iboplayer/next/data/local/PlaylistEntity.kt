package com.iboplayer.next.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "playlists")
data class PlaylistEntity(
    @PrimaryKey val id: Int,
    val title: String,
    val playlistUrl: String,
    val isProtected: Boolean,
    val pin: String?,
    val isConnected: Boolean = false,
)
