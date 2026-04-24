package com.iboplayer.next.ui.playlist

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.PlaylistAdd
import androidx.compose.material.icons.outlined.QrCode2
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.iboplayer.next.AppConfig
import com.iboplayer.next.BuildConfig
import com.iboplayer.next.data.local.PlaylistEntity
import com.iboplayer.next.ui.components.QrCode
import com.iboplayer.next.ui.theme.ProtonBackground
import com.iboplayer.next.ui.theme.ProtonGold
import com.iboplayer.next.ui.theme.ProtonOrange
import com.iboplayer.next.ui.theme.ProtonText
import com.iboplayer.next.ui.theme.ProtonTextMuted

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlaylistScreen(
    onConnected: () -> Unit,
    onBack: () -> Unit,
    viewModel: PlaylistViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()

    ProtonBackground {
        Scaffold(
            modifier = Modifier
                .fillMaxSize()
                .nestedScroll(scrollBehavior.nestedScrollConnection),
            containerColor = Color.Transparent,
            topBar = {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            "Playlists",
                            color = ProtonText,
                            fontWeight = FontWeight.SemiBold,
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(
                                Icons.AutoMirrored.Outlined.ArrowBack,
                                contentDescription = "Back",
                                tint = ProtonText,
                            )
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = Color.Transparent,
                        scrolledContainerColor = Color(0xDD0B1220),
                    ),
                    scrollBehavior = scrollBehavior,
                )
            },
            floatingActionButton = {
                ExtendedFloatingActionButton(
                    onClick = viewModel::openAddDialog,
                    icon = { Icon(Icons.Outlined.Add, contentDescription = null) },
                    text = { Text("Add Playlist", fontWeight = FontWeight.SemiBold) },
                    containerColor = ProtonOrange,
                    contentColor = Color.White,
                )
            },
        ) { inner ->
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    start = 16.dp,
                    end = 16.dp,
                    top = inner.calculateTopPadding() + 8.dp,
                    bottom = inner.calculateBottomPadding() + 96.dp,
                ),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item {
                    SectionLabel(
                        title = "Your Playlists",
                        trailing = if (state.playlists.isNotEmpty()) "${state.playlists.size}" else null,
                    )
                }

                if (state.playlists.isEmpty()) {
                    item {
                        EmptyPlaylistsCard(onAdd = viewModel::openAddDialog)
                    }
                } else {
                    items(state.playlists, key = { it.id }) { playlist ->
                        PlaylistCard(
                            playlist = playlist,
                            connected = state.connectedId == playlist.id,
                            onClick = { viewModel.onPlaylistTapped(playlist, onConnected) },
                        )
                    }
                }

                item { Spacer(Modifier.height(12.dp)) }
                item { SectionLabel(title = "Device") }
                item {
                    DeviceInfoCard(
                        mac = state.macAddress,
                        deviceKey = state.deviceKey,
                        panelBaseUrl = state.panelBaseUrl,
                    )
                }
                item { VersionFooter() }
            }
        }
    }

    if (state.addDialogOpen) {
        AddPlaylistDialog(
            code = state.activationCode,
            loading = state.adding,
            error = state.addError,
            onCodeChange = viewModel::onActivationCodeChange,
            onConfirm = { viewModel.submitActivationCode(onConnected) },
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
private fun SectionLabel(title: String, trailing: String? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title.uppercase(),
            color = ProtonTextMuted,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.weight(1f),
        )
        if (trailing != null) {
            Text(
                text = trailing,
                color = ProtonOrange,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun PlaylistCard(
    playlist: PlaylistEntity,
    connected: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0x88111C2E))
            .border(
                width = if (connected) 1.5.dp else 1.dp,
                color = if (connected) ProtonOrange else ProtonGold.copy(alpha = 0.35f),
                shape = RoundedCornerShape(16.dp),
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(
                    if (connected) ProtonOrange else Color(0x33F59E29)
                ),
            contentAlignment = Alignment.Center,
        ) {
            if (connected) {
                Icon(
                    Icons.Outlined.CheckCircle,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(24.dp),
                )
            } else {
                Text(
                    text = playlist.title.firstOrNull()?.uppercase() ?: "P",
                    color = ProtonOrange,
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                )
            }
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = playlist.title.ifBlank { "Playlist" },
                color = ProtonText,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(top = 2.dp),
            ) {
                if (connected) {
                    StatusPill(text = "Connected", filled = true)
                }
                if (playlist.isProtected) {
                    StatusPill(text = "Protected", filled = false, leading = {
                        Icon(
                            Icons.Outlined.Lock,
                            contentDescription = null,
                            tint = ProtonGold,
                            modifier = Modifier.size(12.dp),
                        )
                    })
                }
                if (!connected && !playlist.isProtected) {
                    Text(
                        text = "Tap to connect",
                        color = ProtonTextMuted,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }

        Icon(
            Icons.AutoMirrored.Outlined.ChevronRight,
            contentDescription = null,
            tint = ProtonTextMuted,
        )
    }
}

@Composable
private fun StatusPill(
    text: String,
    filled: Boolean,
    leading: (@Composable () -> Unit)? = null,
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(
                if (filled) ProtonOrange else Color(0x33F59E29)
            )
            .padding(horizontal = 8.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        leading?.invoke()
        Text(
            text = text,
            color = if (filled) Color.White else ProtonGold,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun EmptyPlaylistsCard(onAdd: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color(0x66111C2E))
            .border(1.dp, ProtonGold.copy(alpha = 0.25f), RoundedCornerShape(20.dp))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(Color(0x33F59E29)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                Icons.Outlined.PlaylistAdd,
                contentDescription = null,
                tint = ProtonOrange,
                modifier = Modifier.size(32.dp),
            )
        }
        Spacer(Modifier.height(14.dp))
        Text(
            "No playlists yet",
            color = ProtonText,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "Enter an activation code to add your first playlist.",
            color = ProtonTextMuted,
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(16.dp))
        Button(
            onClick = onAdd,
            colors = ButtonDefaults.buttonColors(containerColor = ProtonOrange),
        ) {
            Icon(Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Add Playlist", fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun DeviceInfoCard(
    mac: String,
    deviceKey: String,
    panelBaseUrl: String,
) {
    val subscribePayload = remember(panelBaseUrl, mac, deviceKey) {
        buildSubscribePayload(panelBaseUrl, mac, deviceKey)
    }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color(0x66111C2E))
            .border(1.dp, ProtonGold.copy(alpha = 0.25f), RoundedCornerShape(20.dp))
            .padding(20.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color.White)
                    .padding(8.dp),
                contentAlignment = Alignment.Center,
            ) {
                if (subscribePayload.isNotBlank()) {
                    QrCode(content = subscribePayload, size = 104.dp)
                } else {
                    Icon(
                        Icons.Outlined.QrCode2,
                        contentDescription = null,
                        tint = Color.Gray,
                        modifier = Modifier.size(48.dp),
                    )
                }
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "Subscribe or Renew",
                    color = ProtonOrange,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "Scan this QR code on your phone to open the panel with your device pre-filled.",
                    color = ProtonTextMuted,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }

        Spacer(Modifier.height(16.dp))
        InfoRow(label = "MAC Address", value = mac.formatMacForDisplay())
        Spacer(Modifier.height(10.dp))
        InfoRow(label = "Device Key", value = deviceKey)
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            color = ProtonTextMuted,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = value.ifBlank { "—" },
            color = ProtonText,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun VersionFooter() {
    val currentYear = remember { java.util.Calendar.getInstance().get(java.util.Calendar.YEAR) }
    val copyrightRange = if (currentYear > AppConfig.COPYRIGHT_START_YEAR) {
        "${AppConfig.COPYRIGHT_START_YEAR}-$currentYear"
    } else {
        AppConfig.COPYRIGHT_START_YEAR.toString()
    }
    Text(
        text = "v${BuildConfig.VERSION_NAME}  •  © $copyrightRange",
        color = ProtonTextMuted,
        style = MaterialTheme.typography.labelSmall,
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        textAlign = TextAlign.Center,
    )
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
        title = { Text("Enter Activation Code", fontWeight = FontWeight.SemiBold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = code,
                    onValueChange = onCodeChange,
                    singleLine = true,
                    enabled = !loading,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Activation code") },
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
                    Text("Activate", fontWeight = FontWeight.SemiBold)
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

private fun String.formatMacForDisplay(): String {
    val hex = this.filter { it.isLetterOrDigit() }.lowercase()
    if (hex.length != 12) return this
    return hex.chunked(2).joinToString(":")
}

private fun buildSubscribePayload(panelBaseUrl: String, mac: String, deviceKey: String): String {
    if (panelBaseUrl.isBlank()) return ""
    val base = panelBaseUrl.trimEnd('/')
    if (mac.isBlank()) return base
    return buildString {
        append(base)
        append("/subscribe?mac=")
        append(mac)
        if (deviceKey.isNotBlank()) {
            append("&key=")
            append(deviceKey)
        }
    }
}
