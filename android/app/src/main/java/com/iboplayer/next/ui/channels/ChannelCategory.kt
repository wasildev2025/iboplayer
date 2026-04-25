package com.iboplayer.next.ui.channels

enum class ChannelCategory {
    All, Live, Movies, Series, Sports, Favorites;

    companion object {
        fun fromKey(key: String?): ChannelCategory = when (key?.lowercase()) {
            "live" -> Live
            "movies" -> Movies
            "series" -> Series
            "sports" -> Sports
            "favorites" -> Favorites
            else -> All
        }
    }
}
