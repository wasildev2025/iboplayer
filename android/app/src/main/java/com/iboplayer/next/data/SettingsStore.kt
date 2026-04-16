package com.iboplayer.next.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "ibo_settings")

class SettingsStore(private val context: Context) {

    val playlistUrl: Flow<String?> = context.dataStore.data.map { it[KEY_URL] }

    suspend fun savePlaylistUrl(url: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_URL] = url
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }

    companion object {
        private val KEY_URL = stringPreferencesKey("playlist_url")
    }
}
