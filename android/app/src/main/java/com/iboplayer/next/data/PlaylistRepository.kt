package com.iboplayer.next.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

class PlaylistRepository(
    private val client: OkHttpClient = defaultClient,
) {

    suspend fun load(url: String): Result<List<Channel>> = withContext(Dispatchers.IO) {
        runCatching {
            val request = Request.Builder().url(url).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    error("HTTP ${response.code} loading playlist")
                }
                val body = response.body ?: error("Empty response body")
                body.charStream().buffered().use { reader ->
                    M3uParser.parse(reader)
                }
            }
        }
    }

    companion object {
        private val defaultClient = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build()
    }
}
