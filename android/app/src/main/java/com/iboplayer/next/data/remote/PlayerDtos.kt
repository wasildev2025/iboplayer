package com.iboplayer.next.data.remote

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class DnsEntryDto(
    val id: Int,
    val title: String,
    val url: String,
)

@Serializable
data class NotificationsDto(
    val messageOne: String = "",
    val messageTwo: String = "",
)

@Serializable
data class BootstrapDto(
    val dns: List<DnsEntryDto> = emptyList(),
    val loginTitle: String = "",
    val loginSubtitle: String = "",
    val notifications: NotificationsDto? = null,
    val macLength: Int = 12,
    val themeNo: String = "",
    val remoteVersion: String = "",
    @SerialName("remoteUpdateUrl") val remoteUpdateUrl: String = "",
)

@Serializable
data class PlaylistItemDto(
    val id: Int,
    val title: String,
    val playlistUrl: String,
    val protection: Boolean = false,
    val pin: String? = null,
)

@Serializable
data class LoginResponseDto(
    val token: String? = null,
    val playlists: List<PlaylistItemDto> = emptyList(),
    val expireAt: String? = null,
    val deviceKey: String? = null,
)

@Serializable
data class ActivateResponseDto(
    val token: String? = null,
    val playlists: List<PlaylistItemDto> = emptyList(),
    val added: PlaylistItemDto? = null,
    val expireAt: String? = null,
    val deviceKey: String? = null,
)

@Serializable
data class ApiErrorDto(val error: String = "Request failed")

@Serializable
data class ChannelDto(
    val id: Int,
    val externalId: String,
    val name: String,
    val url: String,
    val logo: String? = null,
    val groupName: String? = null,
    val category: String,
)

@Serializable
data class ChannelPageDto(
    val data: List<ChannelDto> = emptyList(),
    val page: Int = 1,
    val pageSize: Int = 50,
    val total: Int = 0,
    val totalPages: Int = 1,
)

@Serializable
data class ChannelGroupDto(
    val groupName: String,
    val count: Int,
)

@Serializable
data class ChannelGroupsResponseDto(
    val data: List<ChannelGroupDto> = emptyList(),
)
