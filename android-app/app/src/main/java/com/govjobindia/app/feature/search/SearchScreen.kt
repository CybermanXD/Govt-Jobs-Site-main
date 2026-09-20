package com.govjobindia.app.feature.search

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.govjobindia.app.core.designsystem.EmptyState
import com.govjobindia.app.core.designsystem.JobCard
import com.govjobindia.app.core.model.*
import com.govjobindia.app.data.mapper.filterJobs

@OptIn(ExperimentalMaterial3Api::class)
@Composable fun SearchScreen(jobs: List<Job>, onOpen: (String) -> Unit, onSave: (String) -> Unit) {
    var query by rememberSaveable { mutableStateOf("") }; var state by rememberSaveable { mutableStateOf("") }; var board by rememberSaveable { mutableStateOf("") }; var qualification by rememberSaveable { mutableStateOf("") }
    var month by rememberSaveable { mutableStateOf(ClosingMonth.ANY) }; var sort by rememberSaveable { mutableStateOf(SortOrder.NEAREST) }; var filtersOpen by rememberSaveable { mutableStateOf(false) }
    val filters = JobFilters(query, state, qualification, board, month, sort)
    val results = remember(jobs, filters) { filterJobs(jobs, filters) }
    Scaffold(topBar = { TopAppBar(title = { Text("Search") }) }) { padding -> Column(Modifier.fillMaxSize().padding(padding)) {
        Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) { OutlinedTextField(query, { query = it }, label = { Text("Title, keyword or board") }, singleLine = true, modifier = Modifier.weight(1f)); Spacer(Modifier.width(8.dp)); BadgedBox(badge = { if (filters.activeCount > 0) Badge { Text(filters.activeCount.toString()) } }) { FilledTonalIconButton(onClick = { filtersOpen = true }) { Icon(Icons.Default.FilterList, "Open filters") } } }
        Text("${results.size} results", Modifier.padding(horizontal = 16.dp), style = MaterialTheme.typography.labelLarge)
        if (jobs.isEmpty()) EmptyState("No cached jobs", "Connect to the internet and refresh Home first.") else if (results.isEmpty()) EmptyState("No matches", "Try fewer words or clear one or more filters.") { TextButton(onClick = { query=""; state=""; board=""; qualification=""; month=ClosingMonth.ANY; sort=SortOrder.NEAREST }) { Text("Clear all") } } else LazyColumn(contentPadding = PaddingValues(16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) { items(results, key={it.id}) { JobCard(it, { onOpen(it.id) }, { onSave(it.id) }) } }
    } }
    if (filtersOpen) ModalBottomSheet(onDismissRequest = { filtersOpen = false }) { FilterControls(jobs, state, {state=it}, board, {board=it}, qualification, {qualification=it}, month, {month=it}, sort, {sort=it}, { state="";board="";qualification="";month=ClosingMonth.ANY;sort=SortOrder.NEAREST }, Modifier.navigationBarsPadding().padding(16.dp)) }
}

@Composable private fun FilterControls(jobs: List<Job>, state: String, onState:(String)->Unit, board:String,onBoard:(String)->Unit,qualification:String,onQualification:(String)->Unit,month:ClosingMonth,onMonth:(ClosingMonth)->Unit,sort:SortOrder,onSort:(SortOrder)->Unit,onClear:()->Unit,modifier:Modifier=Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) { Text("Filters and sorting", style=MaterialTheme.typography.titleLarge); SelectMenu("State", state, jobs.map{it.state}.filter(String::isNotBlank).distinct().sorted(), onState); SelectMenu("Recruitment board",board,jobs.map{it.board}.filter(String::isNotBlank).distinct().sorted(),onBoard); SelectMenu("Qualification",qualification,jobs.map{it.qualification}.filter(String::isNotBlank).distinct().sorted(),onQualification)
        Text("Closing month"); SingleChoiceSegmentedButtonRow { ClosingMonth.entries.forEachIndexed { i, value -> SegmentedButton(selected=month==value,onClick={onMonth(value)},shape=SegmentedButtonDefaults.itemShape(i,ClosingMonth.entries.size)){Text(when(value){ClosingMonth.ANY->"Any";ClosingMonth.THIS->"This";ClosingMonth.NEXT->"Next";ClosingMonth.LATER->"Later"})} } }
        Text("Deadline order"); Row { FilterChip(sort==SortOrder.NEAREST,{onSort(SortOrder.NEAREST)},{Text("Nearest")}); Spacer(Modifier.width(8.dp)); FilterChip(sort==SortOrder.FARTHEST,{onSort(SortOrder.FARTHEST)},{Text("Farthest")}) }; TextButton(onClick=onClear){Text("Clear all filters")}; Spacer(Modifier.height(8.dp)) }
}
@OptIn(ExperimentalMaterial3Api::class) @Composable private fun SelectMenu(label:String,value:String,options:List<String>,onValue:(String)->Unit){var open by remember{mutableStateOf(false)};ExposedDropdownMenuBox(open,{open=it}){OutlinedTextField(value.ifBlank{"All"},{},readOnly=true,label={Text(label)},modifier=Modifier.menuAnchor().fillMaxWidth());ExposedDropdownMenu(open,{open=false}){DropdownMenuItem({Text("All")},{onValue("");open=false});options.forEach{v->DropdownMenuItem({Text(v)},{onValue(v);open=false})}}}}
