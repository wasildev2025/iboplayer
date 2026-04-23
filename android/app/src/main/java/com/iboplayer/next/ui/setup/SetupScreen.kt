package com.iboplayer.next.ui.setup

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.iboplayer.next.ui.theme.AccentGold
import com.iboplayer.next.ui.theme.AccentGoldDim
import com.iboplayer.next.ui.theme.AccentOrange

private val BgTop = Color(0xFF0A0A1A)
private val BgMid = Color(0xFF14081F)
private val BgBottom = Color(0xFF0A1528)
private val GlassFill = Color(0xCC0D0D18)
private val GlassBorder = Color(0x40FFFFFF)
private val TextMuted = Color(0xFF9CA3AF)

/**
 * Activation / panel login — dark stadium-style layout aligned with PROTON-style IPTV flow:
 * full-bleed dusk gradient, glass card, gold accents, MAC callout.
 */
@Composable
fun SetupScreen(
    onLoaded: () -> Unit,
    viewModel: SetupViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    colors = listOf(BgTop, BgMid, BgBottom),
                    start = Offset(0f, 0f),
                    end = Offset(1000f, 1400f),
                ),
            ),
    ) {
        // Soft light orbs (stadium lights mood)
        Box(
            Modifier
                .size(220.dp)
                .align(Alignment.TopStart)
                .offset(x = (-40).dp, y = 40.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(AccentOrange.copy(alpha = 0.18f), Color.Transparent),
                    ),
                    shape = CircleShape,
                ),
        )
        Box(
            Modifier
                .size(180.dp)
                .align(Alignment.BottomEnd)
                .offset(x = (-32).dp, y = (-100).dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(Color(0xFF6366F1).copy(alpha = 0.12f), Color.Transparent),
                    ),
                    shape = CircleShape,
                ),
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(top = 48.dp, bottom = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(AccentOrange, Color(0xFFEA580C)),
                            ),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = "IBO",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                    )
                }
                Column(Modifier.padding(start = 12.dp)) {
                    Text(
                        text = "IBO Player",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                    )
                    Text(
                        text = "Panel activation",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted,
                    )
                }
            }

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        width = 1.dp,
                        brush = Brush.linearGradient(
                            colors = listOf(AccentGoldDim, GlassBorder, AccentGoldDim),
                        ),
                        shape = RoundedCornerShape(20.dp),
                    ),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = GlassFill),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Text(
                        text = state.loginTitle.ifBlank { "Enter Your Activation Code" },
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center,
                    )
                    if (state.loginSubtitle.isNotBlank()) {
                        Text(
                            text = state.loginSubtitle,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextMuted,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }

                    fieldColors().let { fieldColors ->
                        OutlinedTextField(
                            value = state.panelBaseUrl,
                            onValueChange = viewModel::onPanelUrlChange,
                            label = { Text("Panel base URL") },
                            placeholder = { Text("http://10.0.2.2:3001") },
                            leadingIcon = {
                                Icon(
                                    Icons.Outlined.Language,
                                    contentDescription = null,
                                    tint = AccentGold,
                                )
                            },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !state.loading,
                            shape = RoundedCornerShape(12.dp),
                            colors = fieldColors,
                        )
                        OutlinedTextField(
                            value = state.activationCode,
                            onValueChange = viewModel::onActivationChange,
                            label = { Text("Activation code (optional)") },
                            leadingIcon = {
                                Icon(
                                    Icons.Outlined.Verified,
                                    contentDescription = null,
                                    tint = AccentGold,
                                )
                            },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !state.loading,
                            shape = RoundedCornerShape(12.dp),
                            colors = fieldColors,
                        )
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.Black.copy(alpha = 0.35f))
                            .border(1.dp, AccentGold.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                    ) {
                        Text(
                            text = "DEVICE MAC",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMuted,
                            letterSpacing = 0.6.sp,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = state.macAddress,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = AccentGold,
                        )
                        Text(
                            text = "Use this MAC in the admin panel (MAC users).",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMuted,
                            modifier = Modifier.padding(top = 6.dp),
                        )
                    }

                    Button(
                        onClick = { viewModel.loginWithPanel(onLoaded) },
                        enabled = !state.loading && state.panelBaseUrl.isNotBlank(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AccentOrange,
                            disabledContainerColor = Color.White.copy(alpha = 0.12f),
                            contentColor = Color.White,
                            disabledContentColor = Color.White.copy(alpha = 0.35f),
                        ),
                        elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp),
                    ) {
                        if (state.loading) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center,
                            ) {
                                CircularProgressIndicator(
                                    strokeWidth = 2.dp,
                                    modifier = Modifier.size(22.dp),
                                    color = Color.White,
                                )
                                Spacer(Modifier.padding(horizontal = 10.dp))
                                Text("Signing in…", fontWeight = FontWeight.SemiBold)
                            }
                        } else {
                            Text("Login with panel", fontWeight = FontWeight.SemiBold)
                        }
                    }

                    state.error?.let { err ->
                        Text(
                            text = err,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 4.dp),
                color = Color.White.copy(alpha = 0.12f),
            )

            TextButton(onClick = { viewModel.setShowManual(!state.showManualM3u) }) {
                Text(
                    text = if (state.showManualM3u) "Hide direct M3U" else "Or load M3U directly (advanced)",
                    color = AccentGold,
                    fontWeight = FontWeight.Medium,
                )
            }

            if (state.showManualM3u) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = GlassFill.copy(alpha = 0.9f)),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Column(
                        Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        OutlinedTextField(
                            value = state.manualM3uUrl,
                            onValueChange = viewModel::onManualUrlChange,
                            label = { Text("M3U / M3U8 URL") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !state.loading,
                            shape = RoundedCornerShape(12.dp),
                            colors = fieldColors(),
                        )
                        Button(
                            onClick = { viewModel.loadManualM3u(onLoaded) },
                            enabled = !state.loading && state.manualM3uUrl.isNotBlank(),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color.White.copy(alpha = 0.14f),
                                contentColor = Color.White,
                            ),
                        ) {
                            Text("Load playlist")
                        }
                    }
                }
            }

            Text(
                text = "Register this MAC and playlist in the admin panel (DNS / MAC users / activation codes).",
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 8.dp),
            )
        }
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White.copy(alpha = 0.92f),
    disabledTextColor = Color.White.copy(alpha = 0.45f),
    focusedBorderColor = AccentGold,
    unfocusedBorderColor = Color.White.copy(alpha = 0.22f),
    disabledBorderColor = Color.White.copy(alpha = 0.12f),
    focusedLabelColor = AccentGold,
    unfocusedLabelColor = TextMuted,
    cursorColor = AccentGold,
    focusedLeadingIconColor = AccentGold,
    unfocusedLeadingIconColor = AccentGold.copy(alpha = 0.85f),
    focusedContainerColor = Color.Black.copy(alpha = 0.25f),
    unfocusedContainerColor = Color.Black.copy(alpha = 0.18f),
)
