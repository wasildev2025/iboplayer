package com.iboplayer.next.ui.components

import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.iboplayer.next.ui.theme.ProtonOrange

/**
 * D-pad focus ring + subtle scale-up. Compose's `clickable` already exposes
 * focus to remote/keyboard navigation; this just makes the focus state
 * visible on TV so users can tell which tile is currently selected.
 */
fun Modifier.tvFocusable(cornerRadius: Int = 12): Modifier = composed {
    var focused by remember { mutableStateOf(false) }
    this
        .onFocusChanged { focused = it.isFocused }
        .scale(if (focused) 1.04f else 1f)
        .border(
            width = if (focused) 2.dp else 0.dp,
            color = if (focused) ProtonOrange else Color.Transparent,
            shape = RoundedCornerShape(cornerRadius.dp),
        )
}
