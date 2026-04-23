package com.iboplayer.next.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "ibo_settings")

@Singleton
class SettingsStore @Inject constructor(@ApplicationContext private val context: Context) {

    val playlistUrl: Flow<String?> = context.dataStore.data.map { it[KEY_URL] }
    val panelBaseUrl: Flow<String?> = context.dataStore.data.map { it[KEY_PANEL] }
    val playerToken: Flow<String?> = context.dataStore.data.map { it[KEY_TOKEN] }
    val expireAt: Flow<String?> = context.dataStore.data.map { it[KEY_EXPIRE] }
    val deviceKey: Flow<String?> = context.dataStore.data.map { it[KEY_DEVICE_KEY] }

    suspend fun savePlaylistUrl(url: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_URL] = url
        }
    }

    suspend fun savePanelSession(
        baseUrl: String,
        token: String,
        playlistUrl: String,
        expireAtIso: String?,
        deviceKeyValue: String?,
    ) {
        context.dataStore.edit { prefs ->
            prefs[KEY_PANEL] = baseUrl.trim().trimEnd('/')
            prefs[KEY_TOKEN] = token
            prefs[KEY_URL] = playlistUrl
            if (expireAtIso != null) prefs[KEY_EXPIRE] = expireAtIso else prefs.remove(KEY_EXPIRE)
            if (deviceKeyValue != null) prefs[KEY_DEVICE_KEY] = deviceKeyValue
            else prefs.remove(KEY_DEVICE_KEY)
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }

    companion object {
        private val KEY_URL = stringPreferencesKey("playlist_url")
        private val KEY_PANEL = stringPreferencesKey("panel_base_url")
        private val KEY_TOKEN = stringPreferencesKey("player_token")
        private val KEY_EXPIRE = stringPreferencesKey("expire_at")
        private val KEY_DEVICE_KEY = stringPreferencesKey("device_key")
    }
}
