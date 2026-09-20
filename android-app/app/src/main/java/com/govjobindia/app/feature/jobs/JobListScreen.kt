package com.govjobindia.app.feature.jobs

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.govjobindia.app.core.designsystem.*
import com.govjobindia.app.core.model.Job
import java.text.DateFormat
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable fun JobListScreen(title: String, jobs: List<Job>, loading: Boolean, refreshing: Boolean, lastUpdated: Long?, error: String?, onRefresh: () -> Unit, onOpen: (String) -> Unit, onSave: (String) -> Unit, emptyMessage: String) {
    Scaffold(topBar = { TopAppBar(title = { Column { Text(title); if (lastUpdated != null) Text("Updated ${DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT).format(Date(lastUpdated))}", style = MaterialTheme.typography.labelSmall) } }, actions = { IconButton(onClick = onRefresh, enabled = !refreshing) { Icon(Icons.Default.Refresh, "Refresh jobs") } }) }, snackbarHost = { if (error != null) Snackbar(Modifier.padding(12.dp), action = { TextButton(onClick = onRefresh) { Text("Retry") } }) { Text(error) } }) { padding ->
        PullToRefreshBox(isRefreshing = refreshing, onRefresh = onRefresh, modifier = Modifier.fillMaxSize().padding(padding)) {
            when { loading && jobs.isEmpty() -> SkeletonCards(); jobs.isEmpty() -> EmptyState("No jobs available", emptyMessage) { Button(onClick = onRefresh) { Text("Try again") } }; else -> LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) { item { Text("${jobs.size} jobs", modifier = Modifier.fillMaxWidth().widthIn(max = 760.dp), style = MaterialTheme.typography.labelLarge) }; items(jobs, key = { it.id }) { JobCard(it, { onOpen(it.id) }, { onSave(it.id) }) } } }
        }
    }
}
