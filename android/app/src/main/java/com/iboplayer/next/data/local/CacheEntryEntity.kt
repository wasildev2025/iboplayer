package com.iboplayer.next.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Generic key/value response cache. The `cacheKey` is a stringified request
 * signature (e.g. "channels|playlistId=1|category=live|page=1") and the
 * payload is the raw JSON of the response. Lets the app render the last-known
 * state when the panel is unreachable.
 */
@Entity(tableName = "cache_entries")
data class CacheEntryEntity(
    @PrimaryKey val cacheKey: String,
    val payloadJson: String,
    val updatedAt: Long,
)
