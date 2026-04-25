package com.iboplayer.next.ui.browse

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.LiveTv
import androidx.compose.material.icons.outlined.Movie
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material.icons.outlined.FilterList
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.SportsSoccer
import androidx.compose.material.icons.outlined.Tv
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.iboplayer.next.data.Channel
import com.iboplayer.next.ui.channels.ChannelCategory
import com.iboplayer.next.ui.theme.ProtonBackground
import com.iboplayer.next.ui.theme.ProtonGold
import com.iboplayer.next.ui.theme.ProtonOrange
import com.iboplayer.next.ui.theme.ProtonText
import com.iboplayer.next.ui.theme.ProtonTextMuted

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BrowseScreen(
    onPlay: (Channel) -> Unit,
    onHome: () -> Unit,
    viewModel: BrowseViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val refreshing by viewModel.refreshing.collectAsState()
    var searchOpen by remember { mutableStateOf(false) }

    ProtonBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding(),
        ) {
            AppBar(
                title = categoryTitle(state.category),
                icon = categoryIcon(state.category),
                searchOpen = searchOpen,
                query = state.query,
                onToggleSearch = { searchOpen = !searchOpen },
                onQueryChange = viewModel::onQueryChange,
                onBack = onHome,
                sort = state.sort,
                onSortChange = viewModel::onSortChange,
            )

            if (state.groups.isNotEmpty()) {
                CategoryChipsRow(
                    groups = state.groups,
                    selected = state.selectedGroup,
                    onSelect = viewModel::onGroupSelected,
                )
            }

            SectionHeader(
                selectedGroup = state.selectedGroup,
                count = state.items.size,
            )

            PullToRefreshBox(
                isRefreshing = refreshing,
                onRefresh = viewModel::refresh,
                modifier = Modifier.fillMaxSize(),
            ) {
                when {
                    state.items.isEmpty() && refreshing -> LoadingState()
                    state.items.isEmpty() -> EmptyState()
                    else -> PosterGrid(
                        items = state.items,
                        onPlay = onPlay,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            }
        }
    }
}

@Composable
private fun LoadingState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = ProtonOrange, strokeWidth = 3.dp)
            Spacer(Modifier.height(12.dp))
            Text(
                "Loading channels…",
                color = ProtonTextMuted,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
private fun EmptyState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "No items here yet.",
                color = ProtonText,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Pull down to refresh.",
                color = ProtonTextMuted,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Composable
private fun AppBar(
    title: String,
    icon: ImageVector,
    searchOpen: Boolean,
    query: String,
    onToggleSearch: () -> Unit,
    onQueryChange: (String) -> Unit,
    onBack: () -> Unit,
    sort: SortOrder,
    onSortChange: (SortOrder) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .padding(horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onBack) {
            Icon(
                imageVector = Icons.AutoMirrored.Outlined.ArrowBack,
                contentDescription = "Back",
                tint = ProtonText,
            )
        }

        if (searchOpen) {
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                singleLine = true,
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 4.dp),
                placeholder = { Text("Search", color = ProtonTextMuted) },
                colors = searchFieldColors(),
                shape = RoundedCornerShape(999.dp),
            )
        } else {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = ProtonOrange,
                modifier = Modifier.size(24.dp),
            )
            Spacer(Modifier.width(10.dp))
            Text(
                text = title,
                color = ProtonText,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f),
            )
        }

        IconButton(onClick = onToggleSearch) {
            Icon(
                imageVector = Icons.Outlined.Search,
                contentDescription = "Search",
                tint = ProtonText,
            )
        }
        SortMenu(sort = sort, onSortChange = onSortChange)
    }
}

@Composable
private fun SortMenu(sort: SortOrder, onSortChange: (SortOrder) -> Unit) {
    var open by remember { mutableStateOf(false) }
    Box {
        IconButton(onClick = { open = true }) {
            Icon(
                imageVector = Icons.Outlined.FilterList,
                contentDescription = "Sort",
                tint = ProtonText,
            )
        }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            DropdownMenuItem(
                text = { Text("Order by Added") },
                onClick = { onSortChange(SortOrder.Added); open = false },
            )
            DropdownMenuItem(
                text = { Text("Name A → Z") },
                onClick = { onSortChange(SortOrder.NameAsc); open = false },
            )
            DropdownMenuItem(
                text = { Text("Name Z → A") },
                onClick = { onSortChange(SortOrder.NameDesc); open = false },
            )
            // Visual indicator of current selection
            DropdownMenuItem(
                text = {
                    Text(
                        "Current: ${sortLabel(sort)}",
                        color = ProtonTextMuted,
                        style = MaterialTheme.typography.labelSmall,
                    )
                },
                onClick = { open = false },
                enabled = false,
            )
        }
    }
}

@Composable
private fun CategoryChipsRow(
    groups: List<GroupRow>,
    selected: String?,
    onSelect: (String) -> Unit,
) {
    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(groups, key = { it.title }) { group ->
            CategoryChip(
                label = group.title,
                count = group.count,
                selected = group.title == selected,
                onClick = { onSelect(group.title) },
            )
        }
    }
}

@Composable
private fun CategoryChip(
    label: String,
    count: Int,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(if (selected) ProtonOrange else Color(0x55111C2E))
            .border(
                width = 1.dp,
                color = if (selected) ProtonOrange else ProtonGold.copy(alpha = 0.3f),
                shape = RoundedCornerShape(999.dp),
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = label,
            color = if (selected) Color.White else ProtonText,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
            maxLines = 1,
        )
        Text(
            text = "($count)",
            color = if (selected) Color.White.copy(alpha = 0.85f) else ProtonTextMuted,
            style = MaterialTheme.typography.labelSmall,
        )
    }
}

@Composable
private fun SectionHeader(selectedGroup: String?, count: Int) {
    if (selectedGroup == null) return
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = selectedGroup,
            color = ProtonText,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = "$count",
            color = ProtonOrange,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun PosterGrid(
    items: List<Channel>,
    onPlay: (Channel) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 130.dp),
        contentPadding = PaddingValues(14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        modifier = modifier,
    ) {
        items(items, key = { it.id }) { channel ->
            PosterTile(channel = channel, onClick = { onPlay(channel) })
        }
    }
}

@Composable
private fun PosterTile(channel: Channel, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(2f / 3f)
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFF0D1626))
                .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            if (!channel.logo.isNullOrBlank()) {
                AsyncImage(
                    model = channel.logo,
                    contentDescription = channel.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            } else {
                Icon(
                    imageVector = Icons.Outlined.PlayArrow,
                    contentDescription = null,
                    tint = ProtonOrange,
                    modifier = Modifier.size(36.dp),
                )
            }
        }
        Spacer(Modifier.height(6.dp))
        Text(
            text = channel.name,
            color = ProtonText,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(horizontal = 2.dp),
        )
    }
}

@Composable
private fun searchFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White.copy(alpha = 0.9f),
    focusedBorderColor = ProtonGold.copy(alpha = 0.7f),
    unfocusedBorderColor = Color.White.copy(alpha = 0.15f),
    cursorColor = ProtonGold,
    focusedContainerColor = Color(0x55111C2E),
    unfocusedContainerColor = Color(0x33111C2E),
)

private fun categoryTitle(category: ChannelCategory): String = when (category) {
    ChannelCategory.Live -> "Live TV"
    ChannelCategory.Movies -> "Movies"
    ChannelCategory.Series -> "Series"
    ChannelCategory.Sports -> "Sports"
    ChannelCategory.All -> "All Channels"
}

private fun categoryIcon(category: ChannelCategory): ImageVector = when (category) {
    ChannelCategory.Live -> Icons.Outlined.Tv
    ChannelCategory.Movies -> Icons.Outlined.Movie
    ChannelCategory.Series -> Icons.Outlined.LiveTv
    ChannelCategory.Sports -> Icons.Outlined.SportsSoccer
    ChannelCategory.All -> Icons.Outlined.Tv
}

private fun sortLabel(sort: SortOrder): String = when (sort) {
    SortOrder.Added -> "Order by Added"
    SortOrder.NameAsc -> "Name A → Z"
    SortOrder.NameDesc -> "Name Z → A"
}
