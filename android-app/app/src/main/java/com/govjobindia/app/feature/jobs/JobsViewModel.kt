package com.govjobindia.app.feature.jobs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.govjobindia.app.core.database.SyncMetadataEntity
import com.govjobindia.app.core.model.Job
import com.govjobindia.app.domain.repository.JobRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class JobsUiState(val jobs: List<Job> = emptyList(), val saved: List<Job> = emptyList(), val sync: SyncMetadataEntity? = null, val loading: Boolean = true, val refreshing: Boolean = false, val error: String? = null)
@HiltViewModel class JobsViewModel @Inject constructor(private val repo: JobRepository) : ViewModel() {
    private val status = MutableStateFlow(Triple(true, false, null as String?))
    val uiState = combine(repo.jobs, repo.savedJobs, repo.sync, status) { jobs, saved, sync, s -> JobsUiState(jobs, saved, sync, s.first, s.second, s.third) }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), JobsUiState())
    init { refresh() }
    fun refresh() { if (status.value.second) return; viewModelScope.launch { status.value = Triple(uiState.value.jobs.isEmpty(), true, null); val result = repo.refresh(); status.value = Triple(false, false, result.exceptionOrNull()?.let { "Unable to refresh. Cached jobs remain available." }) } }
    fun toggleSaved(id: String) = viewModelScope.launch { repo.toggleSaved(id) }
    fun dismissError() { status.value = status.value.copy(third = null) }
}
