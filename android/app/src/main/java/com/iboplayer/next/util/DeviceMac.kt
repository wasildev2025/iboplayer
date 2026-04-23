package com.iboplayer.next.util

import java.net.NetworkInterface
import java.util.Collections

/**
 * Best-effort hardware-style MAC for display and panel login.
 * May be randomized on some Android versions; emulator often returns a stable value.
 */
object DeviceMac {
    fun current(): String {
        return try {
            Collections.list(NetworkInterface.getNetworkInterfaces()).forEach { intf ->
                val mac = intf.hardwareAddress ?: return@forEach
                if (intf.isLoopback) return@forEach
                val sb = StringBuilder()
                for (b in mac) {
                    sb.append(String.format("%02X:", b))
                }
                if (sb.isNotEmpty()) sb.setLength(sb.length - 1)
                val s = sb.toString()
                if (s.isNotBlank() && s != "02:00:00:00:00:00") return s
            }
            "00:00:00:00:00:00"
        } catch (_: Exception) {
            "00:00:00:00:00:00"
        }
    }
}
