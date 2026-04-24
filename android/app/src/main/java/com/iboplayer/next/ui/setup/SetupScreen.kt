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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.iboplayer.next.ui.theme.ProtonBackground
import com.iboplayer.next.ui.theme.ProtonGold
import com.iboplayer.next.ui.theme.ProtonOrange
import com.iboplayer.next.ui.theme.ProtonTextMuted

@Composable
fun SetupScreen(
    onLoaded: () -> Unit,
    viewModel: SetupViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    ProtonBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            Brush.linearGradient(listOf(ProtonOrange, Color(0xFFEA580C)))
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
                        text = "Connect to your panel",
                        style = MaterialTheme.typography.bodySmall,
                        color = ProtonTextMuted,
                    )
                }
            }

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, ProtonGold.copy(alpha = 0.4f), RoundedCornerShape(20.dp)),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xCC0D0D18)),
            ) {
                Column(
                    Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Text(
                        text = state.loginTitle,
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
                            color = ProtonTextMuted,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }

                    OutlinedTextField(
                        value = state.panelBaseUrl,
                        onValueChange = viewModel::onPanelUrlChange,
                        label = { Text("Panel base URL") },
                        placeholder = { Text("http://10.0.2.2:3001") },
                        leadingIcon = {
                            Icon(Icons.Outlined.Language, contentDescription = null, tint = ProtonGold)
                        },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.loading,
                        shape = RoundedCornerShape(12.dp),
                        colors = fieldColors(),
                    )
                    OutlinedTextField(
                        value = state.activationCode,
                        onValueChange = viewModel::onActivationChange,
                        label = { Text("Activation code (optional)") },
                        leadingIcon = {
                            Icon(Icons.Outlined.Verified, contentDescription = null, tint = ProtonGold)
                        },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.loading,
                        shape = RoundedCornerShape(12.dp),
                        colors = fieldColors(),
                    )

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.Black.copy(alpha = 0.35f))
                            .border(1.dp, ProtonGold.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                    ) {
                        Text(
                            text = "DEVICE MAC",
                            style = MaterialTheme.typography.labelSmall,
                            color = ProtonTextMuted,
                            letterSpacing = 0.6.sp,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = state.macAddress,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = ProtonGold,
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
                            containerColor = ProtonOrange,
                            disabledContainerColor = Color.White.copy(alpha = 0.12f),
                            contentColor = Color.White,
                            disabledContentColor = Color.White.copy(alpha = 0.35f),
                        ),
                    ) {
                        if (state.loading) {
                            CircularProgressIndicator(
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(22.dp),
                                color = Color.White,
                            )
                        } else {
                            Text("Login", fontWeight = FontWeight.SemiBold)
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
        }
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White.copy(alpha = 0.92f),
    disabledTextColor = Color.White.copy(alpha = 0.45f),
    focusedBorderColor = ProtonGold,
    unfocusedBorderColor = Color.White.copy(alpha = 0.22f),
    disabledBorderColor = Color.White.copy(alpha = 0.12f),
    focusedLabelColor = ProtonGold,
    unfocusedLabelColor = ProtonTextMuted,
    cursorColor = ProtonGold,
    focusedLeadingIconColor = ProtonGold,
    unfocusedLeadingIconColor = ProtonGold.copy(alpha = 0.85f),
    focusedContainerColor = Color.Black.copy(alpha = 0.25f),
    unfocusedContainerColor = Color.Black.copy(alpha = 0.18f),
)
