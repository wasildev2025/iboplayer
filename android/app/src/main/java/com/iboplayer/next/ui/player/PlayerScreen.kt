package com.iboplayer.next.ui.player

import android.view.ContextThemeWrapper
import android.view.ViewGroup
import com.iboplayer.next.R
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.media3.ui.PlayerView
import androidx.mediarouter.app.MediaRouteButton
import com.google.android.gms.cast.framework.CastButtonFactory
import com.iboplayer.next.data.remote.EpgProgrammeDto
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerScreen(
    title: String,
    streamUrl: String,
    channelId: Int,
    onBack: () -> Unit,
    viewModel: PlayerViewModel = hiltViewModel()
) {
    LaunchedEffect(streamUrl) {
        viewModel.play(streamUrl)
    }
    LaunchedEffect(channelId) {
        viewModel.loadProgrammes(channelId)
    }

    val programmes by viewModel.programmes.collectAsState()
    val currentPlayer by viewModel.currentPlayer.collectAsState()
    var showEpgSheet by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color.Black,
        topBar = {
            TopAppBar(
                title = { Text(title, maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                actions = {
                    if (viewModel.castAvailable) {
                        AndroidView(
                            factory = { ctx ->
                                // MediaRouteButton's init reads the AppCompat
                                // `colorPrimary` and computes a contrast ratio
                                // against it. Our activity theme inherits from
                                // the framework Material theme (no AppCompat
                                // attr), so colorPrimary resolves to #0 and
                                // the contrast check crashes. We wrap with our
                                // dedicated MediaRouter theme that explicitly
                                // sets a solid colorPrimary + windowBackground.
                                val themed = ContextThemeWrapper(
                                    ctx,
                                    R.style.Theme_IboPlayerNext_MediaRouter,
                                )
                                MediaRouteButton(themed).also { button ->
                                    runCatching {
                                        CastButtonFactory.setUpMediaRouteButton(ctx, button)
                                    }
                                }
                            },
                            modifier = Modifier.padding(end = 4.dp),
                        )
                    }
                    if (channelId > 0) {
                        IconButton(onClick = { showEpgSheet = true }) {
                            Icon(
                                Icons.Outlined.CalendarMonth,
                                contentDescription = "Programme guide",
                                tint = Color.White,
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Black.copy(alpha = 0.6f),
                    titleContentColor = Color.White,
                )
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
                .padding(padding),
            contentAlignment = Alignment.Center,
        ) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    PlayerView(ctx).apply {
                        useController = true
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT,
                        )
                    }
                },
                update = { view -> view.player = currentPlayer },
            )
        }
    }

    if (showEpgSheet) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { showEpgSheet = false },
            sheetState = sheetState,
            containerColor = Color(0xFF111C2E),
        ) {
            EpgList(programmes = programmes)
        }
    }
}

@Composable
private fun EpgList(programmes: List<EpgProgrammeDto>) {
    if (programmes.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxWidth().padding(32.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                "No programme data",
                color = Color.White.copy(alpha = 0.7f),
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        return
    }
    LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(programmes, key = { it.startUtc + it.title }) { p ->
            ProgrammeRow(p)
        }
    }
}

@Composable
private fun ProgrammeRow(p: EpgProgrammeDto) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top,
    ) {
        Text(
            text = formatLocalTime(p.startUtc),
            color = Color(0xFFF59E29),
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(end = 12.dp),
        )
        Column(modifier = Modifier.fillMaxWidth()) {
            Text(
                text = p.title,
                color = Color.White,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
            )
            if (!p.description.isNullOrBlank()) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = p.description,
                    color = Color.White.copy(alpha = 0.7f),
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 3,
                )
            }
        }
    }
}

private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private fun formatLocalTime(iso: String): String = runCatching {
    val instant = Instant.parse(iso)
    instant.atZone(ZoneId.systemDefault()).format(timeFormatter)
}.getOrDefault("")
