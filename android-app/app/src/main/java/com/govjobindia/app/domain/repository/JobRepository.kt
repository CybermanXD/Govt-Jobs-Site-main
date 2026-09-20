package com.govjobindia.app.domain.repository

import com.govjobindia.app.core.database.SyncMetadataEntity
import com.govjobindia.app.core.model.Job
import com.govjobindia.app.core.model.JobDetails
import kotlinx.coroutines.flow.Flow

interface JobRepository {
    val jobs: Flow<List<Job>>
    val savedJobs: Flow<List<Job>>
    val sync: Flow<SyncMetadataEntity?>
    fun details(id: String): Flow<JobDetails?>
    fun isSaved(id: String): Flow<Boolean>
    suspend fun refresh(): Result<Unit>
    suspend fun refreshDetails(id: String): Result<Unit>
    suspend fun toggleSaved(id: String)
}
