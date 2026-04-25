package com.iboplayer.next.cast

import android.content.Context
import com.google.android.gms.cast.framework.CastOptions
import com.google.android.gms.cast.framework.OptionsProvider
import com.google.android.gms.cast.framework.SessionProvider
import com.google.android.gms.cast.framework.media.CastMediaOptions
import com.google.android.gms.cast.framework.media.MediaIntentReceiver
import com.google.android.gms.cast.framework.media.NotificationOptions

/**
 * Cast SDK init hook. The framework auto-discovers this class via the
 * `com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME`
 * meta-data entry in AndroidManifest.xml — no explicit init call needed.
 *
 * Uses the Default Media Receiver (no custom Cast app needed) which plays
 * any HLS/DASH/MP4 stream out of the box. Good enough for IPTV channels.
 */
class CastOptionsProvider : OptionsProvider {
    override fun getCastOptions(context: Context): CastOptions {
        val notificationOptions = NotificationOptions.Builder()
            .setActions(
                listOf(
                    MediaIntentReceiver.ACTION_TOGGLE_PLAYBACK,
                    MediaIntentReceiver.ACTION_STOP_CASTING,
                ),
                intArrayOf(0, 1),
            )
            .build()
        val mediaOptions = CastMediaOptions.Builder()
            .setNotificationOptions(notificationOptions)
            .build()
        return CastOptions.Builder()
            // Default Media Receiver — Google's prebuilt receiver app id.
            .setReceiverApplicationId("CC1AD845")
            .setCastMediaOptions(mediaOptions)
            .setStopReceiverApplicationWhenEndingSession(true)
            .build()
    }

    override fun getAdditionalSessionProviders(context: Context): List<SessionProvider>? = null
}
