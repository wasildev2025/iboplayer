package com.iboplayer.next.di

import android.content.Context
import androidx.room.Room
import com.iboplayer.next.data.local.AppDatabase
import com.iboplayer.next.data.local.ChannelDao
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
        // Channels are a refreshable cache (next reload re-pulls them from the
        // panel), so destructive migration is safe and avoids hand-written
        // migrations every time the channel schema evolves.
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "ibo_player.db"
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    fun provideChannelDao(database: AppDatabase): ChannelDao {
        return database.channelDao()
    }

    @Provides
    fun providePlaylistDao(database: AppDatabase): PlaylistDao {
        return database.playlistDao()
    }
}
