package com.iboplayer.next.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.iboplayer.next.data.Channel

@Entity(tableName = "channels")
data class ChannelEntity(
    @PrimaryKey val id: String,
    val name: String,
    val url: String,
    val logo: String? = null,
    val groupName: String? = null,
    val tvgId: String? = null,
    val isFavorite: Boolean = false,
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

fun Channel.toEntity() = ChannelEntity(
    id = id,
    name = name,
    url = url,
    logo = logo,
    groupName = group,
    tvgId = tvgId,
    isFavorite = isFavorite,
)
