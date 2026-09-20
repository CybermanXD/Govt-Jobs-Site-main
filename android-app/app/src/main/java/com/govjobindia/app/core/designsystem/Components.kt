package com.govjobindia.app.core.designsystem

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.govjobindia.app.core.model.Job
import com.govjobindia.app.data.mapper.displayDate

@Composable fun JobCard(job: Job, onOpen: () -> Unit, onSave: () -> Unit, modifier: Modifier = Modifier) {
    ElevatedCard(onClick = onOpen, modifier = modifier.fillMaxWidth().widthIn(max = 760.dp)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(job.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, maxLines = 3, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                IconButton(onClick = onSave) { Icon(if (job.saved) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder, if (job.saved) "Remove from Saved" else "Save job") }
            }
            if (job.board.isNotBlank()) Text(job.board, style = MaterialTheme.typography.bodyMedium)
            if (job.qualification.isNotBlank()) Text("Qualification: ${job.qualification}", style = MaterialTheme.typography.bodySmall)
            Text("Last date: ${displayDate(job.lastDate)}", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
            if (!job.active) AssistChip(onClick = {}, label = { Text("No longer in latest listing") })
        }
    }
}

@Composable fun SkeletonCards() {
    val transition = rememberInfiniteTransition(label = "skeleton")
    val alpha by transition.animateFloat(.25f, .65f, infiniteRepeatable(tween(700), RepeatMode.Reverse), label = "alpha")
    Column(Modifier.fillMaxSize().padding(16.dp).semantics { contentDescription = "Loading jobs" }, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        repeat(6) { Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = alpha)).padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { Box(Modifier.fillMaxWidth(.85f).height(18.dp).background(Color.Gray.copy(alpha=.35f))); Box(Modifier.fillMaxWidth(.55f).height(14.dp).background(Color.Gray.copy(alpha=.35f))); Box(Modifier.fillMaxWidth(.4f).height(14.dp).background(Color.Gray.copy(alpha=.35f))) } }
    }
}

@Composable fun EmptyState(title: String, message: String, action: (@Composable () -> Unit)? = null) { Column(Modifier.fillMaxSize().padding(32.dp).semantics { liveRegion = LiveRegionMode.Polite }, verticalArrangement = Arrangement.Center) { Text(title, style = MaterialTheme.typography.headlineSmall); Spacer(Modifier.height(8.dp)); Text(message); if (action != null) { Spacer(Modifier.height(16.dp)); action() } } }
