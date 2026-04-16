package com.iboplayer.next

import android.app.Application
import com.iboplayer.next.data.PlaylistRepository
import com.iboplayer.next.data.SettingsStore

class IboApp : Application() {

    val settingsStore by lazy { SettingsStore(this) }
    val playlistRepository by lazy { PlaylistRepository() }
}
