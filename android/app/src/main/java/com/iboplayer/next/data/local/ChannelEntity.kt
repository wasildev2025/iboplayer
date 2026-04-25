package com.iboplayer.next.data.local

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.iboplayer.next.data.Channel

/**
 * Channel categories are derived from the M3U group-title at insert time and
 * stored as an indexed column so the UI can query a single category without
 * loading every channel in the database. With large IPTV playlists (10k+
 * channels), category-scoped queries are the difference between a fast list
 * and a SQLite cursor-window OOM.
 */
const val CATEGORY_LIVE = "live"
const val CATEGORY_MOVIES = "movies"
const val CATEGORY_SERIES = "series"
const val CATEGORY_SPORTS = "sports"

@Entity(
    tableName = "channels",
    indices = [
        Index(value = ["category"]),
        Index(value = ["category", "groupName"]),
    ],
)
data class ChannelEntity(
    @PrimaryKey val id: String,
    val name: String,
    val url: String,
    val logo: String? = null,
    val groupName: String? = null,
    val tvgId: String? = null,
    val isFavorite: Boolean = false,
    @ColumnInfo(defaultValue = CATEGORY_LIVE) val category: String = CATEGORY_LIVE,
)

fun ChannelEntity.toExternal() = Channel(
    id = id,
    name = name,
    url = url,
    logo = logo,
    group = groupName,
    tvgId = tvgId,
    isFavorite = isFavorite,
)

fun Channel.toEntity(category: String = CATEGORY_LIVE) = ChannelEntity(
    id = id,
    name = name,
    url = url,
    logo = logo,
    groupName = group,
    tvgId = tvgId,
    isFavorite = isFavorite,
    category = category,
)
