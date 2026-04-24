package com.iboplayer.next.util

import android.content.Context
import android.provider.Settings
import dagger.hilt.android.qualifiers.ApplicationContext
import java.net.NetworkInterface
import java.security.MessageDigest
import java.util.Collections
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Device identity shown as a MAC-formatted string and sent to the panel for login.
 *
 * Strategy:
 *   1. Try the real hardware MAC (pre-Android 6 / some rooted / TV builds still expose it).
 *   2. Fall back to a stable hash of ANDROID_ID rendered as 12 hex nibbles (AA:BB:…:FF).
 *
 * The fallback is device-unique, persistent across app restarts, and only resets on
 * factory reset or app uninstall + clear — which matches typical IPTV MAC-login UX.
 */
@Singleton
class DeviceMac @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    fun current(): String = realHardwareMac() ?: androidIdDerivedMac()

    private fun realHardwareMac(): String? {
        return try {
            Collections.list(NetworkInterface.getNetworkInterfaces())
                .asSequence()
                .filterNot { it.isLoopback }
                .mapNotNull { intf ->
                    val bytes = intf.hardwareAddress ?: return@mapNotNull null
                    if (bytes.isEmpty()) return@mapNotNull null
                    val hex = bytes.joinToString(":") { "%02X".format(it) }
                    hex.takeIf { it.isNotBlank() && it != ZERO_MAC && it != RANDOM_MAC }
                }
                .firstOrNull()
        } catch (_: Exception) {
            null
        }
    }

    private fun androidIdDerivedMac(): String {
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            ?.takeIf { it.isNotBlank() }
            ?: "ibo-fallback"
        val digest = MessageDigest.getInstance("SHA-256").digest(androidId.toByteArray())
        return digest.take(6).joinToString(":") { "%02X".format(it) }
    }

    companion object {
        private const val ZERO_MAC = "00:00:00:00:00:00"
        private const val RANDOM_MAC = "02:00:00:00:00:00"
    }
}
