package com.iboplayer.next.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ExitToApp
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.LiveTv
import androidx.compose.material.icons.outlined.MoreVert
import androidx.compose.material.icons.outlined.Movie
import androidx.compose.material.icons.outlined.PlaylistPlay
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.SportsSoccer
import androidx.compose.material.icons.outlined.Tv
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.iboplayer.next.BuildConfig
import com.iboplayer.next.R
import com.iboplayer.next.ui.components.tvFocusable
import com.iboplayer.next.ui.theme.ProtonBackground
import com.iboplayer.next.ui.theme.ProtonGold
import com.iboplayer.next.ui.theme.ProtonOrange
import com.iboplayer.next.ui.theme.ProtonText
import com.iboplayer.next.ui.theme.ProtonTextMuted

enum class HomeAction { Live, Movies, Series, Sports, Favorites, Playlist, Settings, Reload, Exit }

@Composable
fun HomeScreen(
    onAction: (HomeAction) -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    ProtonBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp),
        ) {
            TopBar(
                expiresLabel = state.expiresLabel,
                onMenuAction = onAction,
            )
            Spacer(Modifier.height(24.dp))
            BrandHeader()
            Spacer(Modifier.height(28.dp))
            TileGrid(onAction = onAction)
            Spacer(Modifier.height(24.dp))
            VersionFooter()
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun TopBar(
    expiresLabel: String?,
    onMenuAction: (HomeAction) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (expiresLabel != null) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color(0x66111C2E))
                    .border(1.dp, ProtonGold.copy(alpha = 0.4f), RoundedCornerShape(999.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            ) {
                Text(
                    text = expiresLabel,
                    color = ProtonText,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
        Spacer(Modifier.weight(1f))
        OverflowMenu(onMenuAction = onMenuAction)
    }
}

@Composable
private fun OverflowMenu(onMenuAction: (HomeAction) -> Unit) {
    var open by remember { mutableStateOf(false) }
    Box {
        IconButton(onClick = { open = true }) {
            Icon(
                imageVector = Icons.Outlined.MoreVert,
                contentDescription = "More",
                tint = ProtonText,
            )
        }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            DropdownMenuItem(
                text = { Text("Settings") },
                leadingIcon = { Icon(Icons.Outlined.Settings, null) },
                onClick = { open = false; onMenuAction(HomeAction.Settings) },
            )
            DropdownMenuItem(
                text = { Text("Reload") },
                leadingIcon = { Icon(Icons.Outlined.Refresh, null) },
                onClick = { open = false; onMenuAction(HomeAction.Reload) },
            )
            DropdownMenuItem(
                text = { Text("Exit") },
                leadingIcon = { Icon(Icons.Outlined.ExitToApp, null) },
                onClick = { open = false; onMenuAction(HomeAction.Exit) },
            )
        }
    }
}

@Composable
private fun BrandHeader() {
    val appName = stringResource(R.string.app_name)
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .size(88.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(listOf(ProtonOrange, Color(0xFF7A4912)))
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "IPTV",
                color = Color.White,
                fontWeight = FontWeight.Black,
                fontSize = 22.sp,
            )
        }
        Spacer(Modifier.height(12.dp))
        Text(
            text = appName,
            color = ProtonText,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = "Premium IPTV",
            color = ProtonTextMuted,
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
private fun TileGrid(onAction: (HomeAction) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            HomeTile(
                title = "Live TV",
                icon = Icons.Outlined.Tv,
                modifier = Modifier.weight(1f),
                onClick = { onAction(HomeAction.Live) },
            )
            HomeTile(
                title = "Movies",
                icon = Icons.Outlined.Movie,
                modifier = Modifier.weight(1f),
                onClick = { onAction(HomeAction.Movies) },
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            HomeTile(
                title = "Series",
                icon = Icons.Outlined.LiveTv,
                modifier = Modifier.weight(1f),
                onClick = { onAction(HomeAction.Series) },
            )
            HomeTile(
                title = "Sports",
                icon = Icons.Outlined.SportsSoccer,
                modifier = Modifier.weight(1f),
                onClick = { onAction(HomeAction.Sports) },
            )
        }
        HomeTile(
            title = "Favorites",
            icon = Icons.Outlined.FavoriteBorder,
            modifier = Modifier.fillMaxWidth(),
            onClick = { onAction(HomeAction.Favorites) },
        )
        // Playlist gets a full-width highlight — it's the primary gate to
        // getting started, and the screenshot gives it extra emphasis.
        HomeTileWide(
            title = "Playlist",
            subtitle = "Manage your subscriptions",
            icon = Icons.Outlined.PlaylistPlay,
            onClick = { onAction(HomeAction.Playlist) },
        )
    }
}

@Composable
private fun HomeTile(
    title: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Box(
        modifier = modifier
            .height(140.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0x66111C2E))
            .border(1.dp, ProtonGold.copy(alpha = 0.5f), RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .tvFocusable(cornerRadius = 18),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = ProtonOrange,
                modifier = Modifier.size(44.dp),
            )
            Spacer(Modifier.height(10.dp))
            Text(
                text = title,
                color = ProtonText,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun HomeTileWide(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(88.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(Color(0x66F59E29), Color(0x22111C2E))
                )
            )
            .border(1.dp, ProtonGold.copy(alpha = 0.6f), RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .tvFocusable(cornerRadius = 18)
            .padding(horizontal = 20.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Box(
            modifier = Modifier
                .size(52.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(Color(0x33000000)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = ProtonOrange,
                modifier = Modifier.size(30.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                color = ProtonText,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = subtitle,
                color = ProtonTextMuted,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Composable
private fun VersionFooter() {
    Text(
        text = "v${BuildConfig.VERSION_NAME}",
        color = ProtonTextMuted,
        style = MaterialTheme.typography.labelSmall,
        modifier = Modifier.fillMaxWidth(),
        fontWeight = FontWeight.Medium,
        textAlign = TextAlign.Center,
    )
}
