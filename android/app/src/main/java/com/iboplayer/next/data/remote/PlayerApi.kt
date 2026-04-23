package com.iboplayer.next.data.remote

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

object PlayerJson {
    val json = kotlinx.serialization.json.Json {
        ignoreUnknownKeys = true
        isLenient = true
    }
}

@Singleton
class PlayerApi @Inject constructor(
    private val client: OkHttpClient,
) {
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    suspend fun bootstrap(baseUrl: String): BootstrapDto = withContext(Dispatchers.IO) {
        val url = joinBase(baseUrl, "/api/player/bootstrap")
        val req = Request.Builder().url(url).get().build()
        client.newCall(req).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                throw PlayerApiException(parseError(body, response.code))
            }
            PlayerJson.json.decodeFromString<BootstrapDto>(body)
        }
    }

    suspend fun login(
        baseUrl: String,
        macAddress: String,
        activationCode: String?,
    ): LoginResponseDto = withContext(Dispatchers.IO) {
        val url = joinBase(baseUrl, "/api/player/login")
        val payload = buildJsonObject {
            put("macAddress", JsonPrimitive(macAddress))
            if (!activationCode.isNullOrBlank()) {
                put("activationCode", JsonPrimitive(activationCode.trim()))
            }
        }
        val req = Request.Builder()
            .url(url)
            .post(payload.toString().toRequestBody(jsonMedia))
            .build()
        client.newCall(req).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                throw PlayerApiException(parseError(body, response.code))
            }
            PlayerJson.json.decodeFromString<LoginResponseDto>(body)
        }
    }

    suspend fun playlists(baseUrl: String, bearerToken: String): LoginResponseDto =
        withContext(Dispatchers.IO) {
            val url = joinBase(baseUrl, "/api/player/playlists")
            val req = Request.Builder()
                .url(url)
                .header("Authorization", "Bearer $bearerToken")
                .get()
                .build()
            client.newCall(req).execute().use { response ->
                val body = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    throw PlayerApiException(parseError(body, response.code))
                }
                PlayerJson.json.decodeFromString<LoginResponseDto>(body)
            }
        }

    private fun parseError(body: String, code: Int): String {
        return try {
            val err = PlayerJson.json.decodeFromString<ApiErrorDto>(body)
            err.error.ifBlank { "HTTP $code" }
        } catch (_: Exception) {
            body.ifBlank { "HTTP $code" }
        }
    }

    private fun joinBase(baseUrl: String, path: String): String {
        val b = baseUrl.trim().trimEnd('/')
        val p = if (path.startsWith("/")) path else "/$path"
        return "$b$p"
    }
}

class PlayerApiException(message: String) : Exception(message)
