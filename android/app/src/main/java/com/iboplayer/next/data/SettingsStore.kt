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

    val panelBaseUrl: Flow<String?> = context.dataStore.data.map { it[KEY_PANEL] }
    val playerToken: Flow<String?> = context.dataStore.data.map { it[KEY_TOKEN] }
    val expireAt: Flow<String?> = context.dataStore.data.map { it[KEY_EXPIRE] }
    val deviceKey: Flow<String?> = context.dataStore.data.map { it[KEY_DEVICE_KEY] }
    val macAddress: Flow<String?> = context.dataStore.data.map { it[KEY_MAC] }

    /** Admin-chosen theme key, e.g. "theme_0". Updated from /api/player/bootstrap. */
    val themeNo: Flow<String?> = context.dataStore.data.map { it[KEY_THEME] }

    suspend fun saveThemeNo(value: String) {
        context.dataStore.edit { prefs -> prefs[KEY_THEME] = value }
    }

    suspend fun savePanelSession(
        baseUrl: String,
        token: String,
        macAddress: String,
        expireAtIso: String?,
        deviceKeyValue: String?,
    ) {
        context.dataStore.edit { prefs ->
            prefs[KEY_PANEL] = baseUrl.trim().trimEnd('/')
            prefs[KEY_TOKEN] = token
            prefs[KEY_MAC] = macAddress
            if (expireAtIso != null) prefs[KEY_EXPIRE] = expireAtIso else prefs.remove(KEY_EXPIRE)
            if (deviceKeyValue != null) prefs[KEY_DEVICE_KEY] = deviceKeyValue
            else prefs.remove(KEY_DEVICE_KEY)
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }

    companion object {
        private val KEY_PANEL = stringPreferencesKey("panel_base_url")
        private val KEY_TOKEN = stringPreferencesKey("player_token")
        private val KEY_EXPIRE = stringPreferencesKey("expire_at")
        private val KEY_DEVICE_KEY = stringPreferencesKey("device_key")
        private val KEY_MAC = stringPreferencesKey("mac_address")
        private val KEY_THEME = stringPreferencesKey("theme_no")
    }
}
