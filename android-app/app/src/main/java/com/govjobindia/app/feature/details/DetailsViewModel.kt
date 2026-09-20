package com.govjobindia.app.feature.details

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.govjobindia.app.core.model.JobDetails
import com.govjobindia.app.domain.repository.JobRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DetailsUiState(val details: JobDetails? = null, val saved: Boolean = false, val loading: Boolean = true, val refreshing: Boolean = false, val error: String? = null)
@HiltViewModel class DetailsViewModel @Inject constructor(savedStateHandle: SavedStateHandle, private val repo: JobRepository) : ViewModel() {
    val id: String = requireNotNull(savedStateHandle["id"])
    private val status = MutableStateFlow(Triple(true, false, null as String?))
    val uiState = combine(repo.details(id), repo.isSaved(id), status) { details, saved, s -> DetailsUiState(details, saved, s.first && details == null, s.second, s.third) }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), DetailsUiState())
    init { refresh() }
    fun refresh() { if (status.value.second) return; viewModelScope.launch { status.value = Triple(uiState.value.details == null, true, null); val result = repo.refreshDetails(id); status.value = Triple(false, false, result.exceptionOrNull()?.let { "Details are temporarily unavailable." }) } }
    fun toggleSaved() = viewModelScope.launch { repo.toggleSaved(id) }
}
