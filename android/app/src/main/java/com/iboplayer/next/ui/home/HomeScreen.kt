package com.iboplayer.next.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ExitToApp
import androidx.compose.material.icons.outlined.LiveTv
import androidx.compose.material.icons.outlined.Movie
import androidx.compose.material.icons.outlined.PlaylistPlay
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.SportsSoccer
import androidx.compose.material.icons.outlined.Tv
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.iboplayer.next.ui.theme.ProtonBackground
import com.iboplayer.next.ui.theme.ProtonGold
import com.iboplayer.next.ui.theme.ProtonOrange
import com.iboplayer.next.ui.theme.ProtonText
import com.iboplayer.next.ui.theme.ProtonTextMuted

enum class HomeAction { Live, Movies, Series, Sports, Playlist, Settings, Reload, Exit }

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
                .padding(horizontal = 28.dp, vertical = 24.dp),
        ) {
            HomeTopBar(
                expiresLabel = state.expiresLabel,
                version = state.appVersion,
            )
            Spacer(Modifier.height(12.dp))
            BrandLogo()
            Spacer(Modifier.height(24.dp))

            BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                val isWide = maxWidth > 720.dp
                if (isWide) {
                    Row(
                        modifier = Modifier.fillMaxSize(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
                        TileGrid(onAction, modifier = Modifier.weight(1f).fillMaxHeight())
                        SideColumn(onAction, modifier = Modifier.width(220.dp).fillMaxHeight())
                    }
                } else {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
                        TileGrid(onAction)
                        SideColumn(onAction, modifier = Modifier.fillMaxWidth())
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeTopBar(expiresLabel: String?, version: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text = "v$version", color = ProtonTextMuted, fontSize = 12.sp)
        if (expiresLabel != null) {
            Text(
                text = expiresLabel,
                color = ProtonText,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun BrandLogo() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(ProtonOrange, Color(0xFF7A4912)),
                    )
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "IBO",
                color = Color.White,
                fontWeight = FontWeight.Black,
                fontSize = 18.sp,
            )
        }
    }
}

@Composable
private fun TileGrid(
    onAction: (HomeAction) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            HomeTile(
                title = "Live",
                icon = Icons.Outlined.Tv,
                modifier = Modifier.weight(2f).height(220.dp),
                onClick = { onAction(HomeAction.Live) },
            )
            Column(
                modifier = Modifier.weight(2f),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    HomeTile(
                        title = "Movies",
                        icon = Icons.Outlined.Movie,
                        modifier = Modifier.weight(1f).height(102.dp),
                        onClick = { onAction(HomeAction.Movies) },
                    )
                    HomeTile(
                        title = "Series",
                        icon = Icons.Outlined.LiveTv,
                        modifier = Modifier.weight(1f).height(102.dp),
                        onClick = { onAction(HomeAction.Series) },
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    HomeTile(
                        title = "Sports",
                        icon = Icons.Outlined.SportsSoccer,
                        modifier = Modifier.weight(1f).height(102.dp),
                        onClick = { onAction(HomeAction.Sports) },
                    )
                    HomeTile(
                        title = "Playlist",
                        icon = Icons.Outlined.PlaylistPlay,
                        modifier = Modifier.weight(1f).height(102.dp),
                        onClick = { onAction(HomeAction.Playlist) },
                    )
                }
            }
        }
    }
}

@Composable
private fun SideColumn(
    onAction: (HomeAction) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        SideButton(
            title = "Settings",
            icon = Icons.Outlined.Settings,
            onClick = { onAction(HomeAction.Settings) },
        )
        SideButton(
            title = "Reload",
            icon = Icons.Outlined.Refresh,
            onClick = { onAction(HomeAction.Reload) },
        )
        SideButton(
            title = "EXIT",
            icon = Icons.Outlined.ExitToApp,
            onClick = { onAction(HomeAction.Exit) },
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
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0x66111C2E))
            .border(1.dp, ProtonGold.copy(alpha = 0.55f), RoundedCornerShape(18.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = ProtonOrange,
                modifier = Modifier.size(56.dp),
            )
            Spacer(Modifier.height(8.dp))
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
private fun SideButton(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(64.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0x44111C2E))
            .border(1.dp, ProtonGold.copy(alpha = 0.45f), RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(imageVector = icon, contentDescription = title, tint = ProtonOrange)
        Text(
            text = title,
            color = ProtonText,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
    }
}
