package com.iboplayer.next.data

import androidx.paging.PagingSource
import androidx.paging.PagingState
import com.iboplayer.next.data.remote.PlayerApi

/**
 * Paging source that hits the server's paginated channels endpoint. Each
 * `load()` request fetches one page (default 50 channels) — the device only
 * holds a few hundred channels in memory at any time, regardless of total
 * playlist size.
 */
class ChannelPagingSource(
    private val api: PlayerApi,
    private val baseUrl: String,
    private val bearerToken: String,
    private val playlistId: Int,
    private val category: String?,
    private val group: String?,
    private val search: String,
) : PagingSource<Int, Channel>() {

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Channel> {
        val page = params.key ?: 1
        return try {
            val resp = api.channels(
                baseUrl = baseUrl,
                bearerToken = bearerToken,
                playlistId = playlistId,
                category = category,
                group = group,
                search = search,
                page = page,
                pageSize = params.loadSize.coerceAtMost(200),
            )
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
            LoadResult.Page(
                data = items,
                prevKey = if (page <= 1) null else page - 1,
                nextKey = if (page >= resp.totalPages) null else page + 1,
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }

    override fun getRefreshKey(state: PagingState<Int, Channel>): Int? {
        return state.anchorPosition?.let { anchor ->
            val page = state.closestPageToPosition(anchor)
            page?.prevKey?.plus(1) ?: page?.nextKey?.minus(1)
        }
    }
}
