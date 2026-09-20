package com.govjobindia.app.feature.details

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.govjobindia.app.core.designsystem.SkeletonCards
import com.govjobindia.app.core.model.Job
import com.govjobindia.app.data.mapper.safeHttpUrl
import com.govjobindia.app.data.mapper.uniqueDates

@OptIn(ExperimentalMaterial3Api::class)
@Composable fun DetailsScreen(job: Job?, onBack: () -> Unit, vm: DetailsViewModel = hiltViewModel()) {
    val state by vm.uiState.collectAsState(); val details = state.details; val context = LocalContext.current
    fun open(url: String) { if (safeHttpUrl(url)) context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
    Scaffold(topBar = { TopAppBar(title={Text("Job details")},navigationIcon={IconButton(onClick=onBack){Icon(Icons.AutoMirrored.Filled.ArrowBack,"Back")}},actions={IconButton(onClick=vm::toggleSaved){Icon(if(state.saved) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,if(state.saved)"Remove from Saved" else "Save job")}}) }) { padding ->
        when { state.loading && details == null -> Box(Modifier.padding(padding)){SkeletonCards()}; details == null -> Column(Modifier.padding(padding).padding(24.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){Text(job?.title ?: "Job details",style=MaterialTheme.typography.headlineSmall);Text(state.error ?: "Details are not cached.");Button(onClick=vm::refresh){Text("Retry")};if(job!=null&&safeHttpUrl(job.url))OutlinedButton(onClick={open(job.url)}){Text("Open source")}}
            else -> LazyColumn(Modifier.padding(padding),contentPadding=PaddingValues(16.dp),verticalArrangement=Arrangement.spacedBy(16.dp)){item{Column(Modifier.fillMaxWidth().widthIn(max=760.dp),verticalArrangement=Arrangement.spacedBy(8.dp)){Text(details.postName.ifBlank{job?.title.orEmpty()},style=MaterialTheme.typography.headlineSmall);Value("Company / Board",details.companyName.ifBlank{job?.board.orEmpty()});Value("Vacancies",details.noOfPosts.ifBlank{job?.postCount.orEmpty()});Value("Advertisement number",details.advtNo);Value("Salary",details.salary);Value("Qualification",details.qualification.ifBlank{job?.qualification.orEmpty()});Value("Location",job?.location.orEmpty());Value("Age limit",details.ageLimit.joinToString());Section("Important dates",uniqueDates(details,job?.lastDate.orEmpty()));Section("Salary / stipend",details.salaryDetails);Section("Eligibility",details.eligibility);Section("Essential requirements",details.desirableSkills);Section("Experience",details.experience);Section("Selection process",details.selectionProcess);Section("General instructions",details.generalInstructions);Section("How to apply",details.howToApply,true);if(details.importantLinks.isNotEmpty()){Text("Important links",style=MaterialTheme.typography.titleLarge);details.importantLinks.forEach{link->OutlinedButton(onClick={open(link.url)},modifier=Modifier.fillMaxWidth()){Text(link.label.ifBlank{link.display.ifBlank{"Open official link"}})}}}else if(details.officialNotificationStatus.isNotBlank())Text(details.officialNotificationStatus);val source=details.url.ifBlank{job?.url.orEmpty()};if(safeHttpUrl(source))Button(onClick={open(source)},modifier=Modifier.fillMaxWidth()){Text("View job posting source")};state.error?.let { Text(it,color=MaterialTheme.colorScheme.error) }}}}}
    }
}
@Composable private fun Value(label:String,value:String){if(value.isNotBlank())Column{Text(label,style=MaterialTheme.typography.labelLarge,color=MaterialTheme.colorScheme.primary);Text(value)}}
@Composable private fun Section(title:String,values:List<String>,ordered:Boolean=false){if(values.isNotEmpty())Column(verticalArrangement=Arrangement.spacedBy(6.dp)){Text(title,style=MaterialTheme.typography.titleLarge);values.forEachIndexed{i,v->Text(if(ordered)"${i+1}. $v" else "• $v")}}}
