package com.iboplayer.next.util

import android.os.Build

/**
 * Human-readable device name derived from Build.MANUFACTURER + Build.MODEL.
 * Sent to the panel on first activation so the admin sees something like
 * "Samsung Galaxy S21" or "Android C85 Pro" instead of "Device AA:BB:CC:…".
 *
 * Examples:
 *   Samsung + SM-G991B    → "Samsung SM-G991B"
 *   Google  + Pixel 7     → "Google Pixel 7"
 *   Android + C85 Pro     → "Android C85 Pro"   (generic Android TV box)
 *   OnePlus + 9 Pro       → "OnePlus 9 Pro"
 *   (empty + empty)       → "Android Device"
 */
object DeviceName {
    val display: String by lazy { resolve() }

    private fun resolve(): String {
        val mfr = Build.MANUFACTURER?.trim().orEmpty()
        val model = Build.MODEL?.trim().orEmpty()
        val mfrTitle = mfr.replaceFirstChar { c ->
            if (c.isLowerCase()) c.titlecase() else c.toString()
        }
        return when {
            mfr.isEmpty() && model.isEmpty() -> "Android Device"
            mfr.isEmpty() -> model
            model.isEmpty() -> mfrTitle
            // Avoid "Samsung Samsung Galaxy S21" when MODEL already includes
            // the manufacturer name as a prefix.
            model.lowercase().startsWith(mfr.lowercase()) -> model
            else -> "$mfrTitle $model"
        }
    }
}
