package com.iboplayer.next.ui.playlist

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.iboplayer.next.data.local.PlaylistEntity
import com.iboplayer.next.ui.theme.ProtonBackground
import com.iboplayer.next.ui.theme.ProtonGold
import com.iboplayer.next.ui.theme.ProtonOrange
import com.iboplayer.next.ui.theme.ProtonText
import com.iboplayer.next.ui.theme.ProtonTextMuted

@Composable
fun PlaylistScreen(
    onConnected: () -> Unit,
    onBack: () -> Unit,
    viewModel: PlaylistViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    ProtonBackground {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
        ) {
            val isWide = maxWidth > 720.dp
            if (isWide) {
                Row(
                    modifier = Modifier.fillMaxSize(),
                    horizontalArrangement = Arrangement.spacedBy(20.dp),
                ) {
                    PlaylistGridSection(
                        state = state,
                        onTile = { viewModel.onPlaylistTapped(it, onConnected) },
                        onAdd = viewModel::openAddDialog,
                        onBack = onBack,
                        modifier = Modifier.weight(1f).fillMaxHeight(),
                    )
                    DeviceInfoPanel(
                        state = state,
                        modifier = Modifier.width(300.dp).fillMaxHeight(),
                    )
                }
            } else {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(20.dp),
                ) {
                    PlaylistGridSection(
                        state = state,
                        onTile = { viewModel.onPlaylistTapped(it, onConnected) },
                        onAdd = viewModel::openAddDialog,
                        onBack = onBack,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    DeviceInfoPanel(
                        state = state,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
    }

    if (state.addDialogOpen) {
        AddPlaylistDialog(
            code = state.activationCode,
            loading = state.adding,
            error = state.addError,
            onCodeChange = viewModel::onActivationCodeChange,
            onConfirm = viewModel::submitActivationCode,
            onDismiss = viewModel::closeAddDialog,
        )
    }

    state.pinDialogFor?.let { target ->
        PinDialog(
            title = target.title,
            pin = state.pinInput,
            error = state.pinError,
            onPinChange = viewModel::onPinChange,
            onConfirm = { viewModel.submitPin(onConnected) },
            onDismiss = viewModel::cancelPinDialog,
        )
    }
}

@Composable
private fun PlaylistGridSection(
    state: PlaylistViewModel.UiState,
    onTile: (PlaylistEntity) -> Unit,
    onAdd: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(ProtonOrange),
                contentAlignment = Alignment.Center,
            ) {
                Text("IBO", color = Color.White, fontWeight = FontWeight.Black, fontSize = 12.sp)
            }
            Text(
                text = "Playlist",
                color = ProtonText,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.weight(1f))
            TextButton(onClick = onBack) {
                Text("Back", color = ProtonGold)
            }
        }
        Spacer(Modifier.height(20.dp))

        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 180.dp),
            contentPadding = PaddingValues(bottom = 8.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            modifier = Modifier.fillMaxSize(),
        ) {
            items(state.playlists, key = { it.id }) { playlist ->
                PlaylistTile(
                    playlist = playlist,
                    connected = state.connectedId == playlist.id,
                    onClick = { onTile(playlist) },
                )
            }
            item { AddPlaylistTile(onClick = onAdd) }
        }
    }
}

@Composable
private fun PlaylistTile(
    playlist: PlaylistEntity,
    connected: Boolean,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .height(130.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0x66111C2E))
            .border(
                1.dp,
                if (connected) ProtonOrange else ProtonGold.copy(alpha = 0.5f),
                RoundedCornerShape(16.dp),
            )
            .clickable(onClick = onClick)
            .padding(14.dp),
    ) {
        Column(Modifier.fillMaxSize()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = playlist.title,
                    color = ProtonText,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                if (playlist.isProtected) {
                    Icon(
                        imageVector = Icons.Outlined.Lock,
                        contentDescription = "Protected",
                        tint = ProtonGold,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
            if (playlist.isProtected) {
                Text(
                    text = "Protected",
                    color = ProtonTextMuted,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Spacer(Modifier.weight(1f))
            if (connected) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(Color(0xFF2563EB))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                ) {
                    Text(
                        "Connected",
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
        }
    }
}

@Composable
private fun AddPlaylistTile(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .height(130.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0x33111C2E))
            .border(1.dp, ProtonGold.copy(alpha = 0.45f), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = Icons.Outlined.Add,
                contentDescription = "Add playlist",
                tint = ProtonOrange,
                modifier = Modifier.size(36.dp),
            )
            Spacer(Modifier.height(6.dp))
            Text(
                "Add Playlist",
                color = ProtonText,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun DeviceInfoPanel(
    state: PlaylistViewModel.UiState,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0x55111C2E))
            .border(1.dp, ProtonGold.copy(alpha = 0.4f), RoundedCornerShape(18.dp))
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            "Your MAC is Activated.",
            color = ProtonText,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(6.dp))
        Text(
            "PROTON TEAM",
            color = ProtonOrange,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(16.dp))
        Text(
            "To add/manage the playlists, use following values on website:",
            color = ProtonTextMuted,
            style = MaterialTheme.typography.bodySmall,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(12.dp))
        InfoBlock(label = "Mac Address", value = state.macAddress.formatMacForDisplay())
        Spacer(Modifier.height(10.dp))
        InfoBlock(label = "Device Key", value = state.deviceKey)
        if (state.panelBaseUrl.isNotBlank()) {
            Spacer(Modifier.height(16.dp))
            Text(
                state.panelBaseUrl,
                color = ProtonTextMuted,
                style = MaterialTheme.typography.labelSmall,
            )
        }
    }
}

@Composable
private fun InfoBlock(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, color = ProtonTextMuted, style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(2.dp))
        Text(
            text = value.ifBlank { "—" },
            color = ProtonOrange,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun AddPlaylistDialog(
    code: String,
    loading: Boolean,
    error: String?,
    onCodeChange: (String) -> Unit,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = { if (!loading) onDismiss() },
        title = {
            Text("Enter Your Activation Code", fontWeight = FontWeight.SemiBold)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = code,
                    onValueChange = onCodeChange,
                    singleLine = true,
                    enabled = !loading,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Activation code") },
                    colors = dialogFieldColors(),
                )
                error?.let {
                    Text(
                        it,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !loading,
                colors = ButtonDefaults.buttonColors(containerColor = ProtonOrange),
            ) {
                if (loading) {
                    CircularProgressIndicator(
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(18.dp),
                        color = Color.White,
                    )
                } else {
                    Text("Login", fontWeight = FontWeight.SemiBold)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !loading) {
                Text("Cancel", color = ProtonGold)
            }
        },
        containerColor = Color(0xFF0D1626),
        titleContentColor = ProtonText,
        textContentColor = ProtonText,
    )
}

@Composable
private fun PinDialog(
    title: String,
    pin: String,
    error: String?,
    onPinChange: (String) -> Unit,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Enter PIN for $title", fontWeight = FontWeight.SemiBold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = pin,
                    onValueChange = onPinChange,
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("PIN") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                    colors = dialogFieldColors(),
                )
                error?.let {
                    Text(
                        it,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = ProtonOrange),
            ) {
                Text("Unlock", fontWeight = FontWeight.SemiBold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = ProtonGold)
            }
        },
        containerColor = Color(0xFF0D1626),
        titleContentColor = ProtonText,
        textContentColor = ProtonText,
    )
}

@Composable
private fun dialogFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White.copy(alpha = 0.92f),
    focusedBorderColor = ProtonGold,
    unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
    cursorColor = ProtonGold,
    focusedLabelColor = ProtonGold,
    unfocusedLabelColor = ProtonTextMuted,
    focusedContainerColor = Color.Black.copy(alpha = 0.25f),
    unfocusedContainerColor = Color.Black.copy(alpha = 0.18f),
)

/** 17:40:69:7A:20:34 → 17:40:69:7a:20:34 (lowercase hex with colon separators). */
private fun String.formatMacForDisplay(): String {
    val hex = this.filter { it.isLetterOrDigit() }.lowercase()
    if (hex.length != 12) return this
    return hex.chunked(2).joinToString(":")
}
