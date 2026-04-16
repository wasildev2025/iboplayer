package com.iboplayer.next.data

object ChannelHolder {
    @Volatile var channels: List<Channel> = emptyList()
}
