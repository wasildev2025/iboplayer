package com.iboplayer.next.data

import androidx.paging.PagingSource
import androidx.paging.PagingState
import com.iboplayer.next.data.local.CacheDao
import com.iboplayer.next.data.local.CacheEntryEntity
import com.iboplayer.next.data.remote.ChannelPageDto
import com.iboplayer.next.data.remote.PlayerApi
import com.iboplayer.next.data.remote.PlayerJson

/**
 * Paging source that hits the server's paginated channels endpoint. Each
 * `load()` request fetches one page (default 50 channels) and is cached to
 * Room as a JSON blob keyed by request signature — when the network is
 * unreachable the device can still render whatever pages the user already
 * loaded recently.
 */
class ChannelPagingSource(
    private val api: PlayerApi,
    private val cache: CacheDao?,
    private val baseUrl: String,
    private val bearerToken: String,
    private val playlistId: Int,
    private val category: String?,
    private val group: String?,
    private val search: String,
) : PagingSource<Int, Channel>() {

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Channel> {
        val page = params.key ?: 1
        val pageSize = params.loadSize.coerceAtMost(200)
        val key = cacheKey(page, pageSize)
        return try {
            val resp = api.channels(
                baseUrl = baseUrl,
                bearerToken = bearerToken,
                playlistId = playlistId,
                category = category,
                group = group,
                search = search,
                page = page,
                pageSize = pageSize,
            )
            cache?.put(
                CacheEntryEntity(
                    cacheKey = key,
                    payloadJson = PlayerJson.json.encodeToString(ChannelPageDto.serializer(), resp),
                    updatedAt = System.currentTimeMillis(),
                )
            )
            toPage(resp, page)
        } catch (e: Exception) {
            // Network failed — fall back to the cached page if we have one.
            val cached = cache?.get(key)?.payloadJson
            if (cached != null) {
                try {
                    toPage(PlayerJson.json.decodeFromString(ChannelPageDto.serializer(), cached), page)
                } catch (_: Exception) {
                    LoadResult.Error(e)
                }
            } else {
                LoadResult.Error(e)
            }
        }
    }

    override fun getRefreshKey(state: PagingState<Int, Channel>): Int? {
        return state.anchorPosition?.let { anchor ->
            val page = state.closestPageToPosition(anchor)
            page?.prevKey?.plus(1) ?: page?.nextKey?.minus(1)
        }
    }

    private fun toPage(resp: ChannelPageDto, page: Int): LoadResult.Page<Int, Channel> {
        val items = resp.data.map {
            Channel(
                id = it.id,
                externalId = it.externalId,
                name = it.name,
                url = it.url,
                logo = it.logo,
                groupName = it.groupName,
                category = it.category,
            )
        }
        return LoadResult.Page(
            data = items,
            prevKey = if (page <= 1) null else page - 1,
            nextKey = if (page >= resp.totalPages) null else page + 1,
        )
    }

    private fun cacheKey(page: Int, pageSize: Int): String {
        return buildString {
            append("channels|playlistId=").append(playlistId)
            append("|category=").append(category.orEmpty())
            append("|group=").append(group.orEmpty())
            append("|search=").append(search)
            append("|page=").append(page)
            append("|pageSize=").append(pageSize)
        }
    }
}
