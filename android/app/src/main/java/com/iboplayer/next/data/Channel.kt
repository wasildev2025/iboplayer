package com.iboplayer.next.data

import kotlinx.serialization.Serializable

/**
 * Server-side channel DTO. Matches the shape returned by
 * `GET /api/player/channels`. The Android app does not cache channels —
 * each Browse page is a fresh paginated server request.
 */
@Serializable
data class Channel(
    val id: Int,
    val externalId: String,
    val name: String,
    val url: String,
    val logo: String? = null,
    val groupName: String? = null,
    val category: String,
)

@Serializable
data class ChannelGroup(
    val groupName: String,
    val count: Int,
)
