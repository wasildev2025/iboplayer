package com.iboplayer.next.di

import android.content.Context
import androidx.room.Room
import com.iboplayer.next.data.local.AppDatabase
import com.iboplayer.next.data.local.CacheDao
import com.iboplayer.next.data.local.PlaylistDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DataModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        // Only Playlist rows live in Room now — channels come from the server
        // paginated. Destructive migration is safe because everything in here
        // is recoverable from the panel.
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "ibo_player.db"
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    fun providePlaylistDao(database: AppDatabase): PlaylistDao {
        return database.playlistDao()
    }

    @Provides
    fun provideCacheDao(database: AppDatabase): CacheDao {
        return database.cacheDao()
    }
}
