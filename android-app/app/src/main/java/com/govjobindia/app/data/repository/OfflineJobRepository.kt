package com.govjobindia.app.data.repository

import androidx.room.withTransaction
import com.govjobindia.app.core.database.*
import com.govjobindia.app.core.model.*
import com.govjobindia.app.core.network.GovJobApi
import com.govjobindia.app.data.mapper.*
import com.govjobindia.app.domain.repository.JobRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OfflineJobRepository @Inject constructor(
    private val db: GovJobDatabase, private val api: GovJobApi, private val json: Json,
) : JobRepository {
    private val dao = db.jobDao()
    private val refreshMutex = Mutex()
    private val detailLocks = mutableMapOf<String, Mutex>()
    override val jobs = dao.observeJobs().map { list -> list.map(JobWithSaved::toDomain) }
    override val savedJobs = dao.observeSaved().map { list -> list.map(JobWithSaved::toDomain) }
    override val sync = dao.observeSync()
    override fun details(id: String) = dao.observeDetails(id).map { it?.payload?.let { payload -> runCatching { json.decodeFromString<JobDetails>(payload) }.getOrNull() } }
    override fun isSaved(id: String) = dao.observeIsSaved(id)

    override suspend fun refresh(): Result<Unit> = refreshMutex.withLock {
        val attempted = System.currentTimeMillis()
        runCatching {
            val snapshot = api.snapshot()
            require(snapshot.error.isNullOrBlank()) { snapshot.error!! }
            val entities = snapshot.jobs.orEmpty().filterNotNull().mapNotNull { it.toEntity(attempted) }.distinctBy { it.id }
            val meta = runCatching { api.meta() }.getOrNull()
            db.withTransaction {
                dao.markAllInactive(); dao.upsertJobs(entities); dao.deleteInactiveUnsaved()
                dao.syncMetadata(SyncMetadataEntity(lastSuccess = System.currentTimeMillis(), lastAttempt = attempted, remoteVersion = meta?.version, error = null))
            }
        }.onFailure { error -> dao.syncMetadata(SyncMetadataEntity(lastSuccess = null, lastAttempt = attempted, remoteVersion = null, error = error.javaClass.simpleName)) }
    }

    override suspend fun refreshDetails(id: String): Result<Unit> = synchronized(detailLocks) { detailLocks.getOrPut(id) { Mutex() } }.withLock {
        runCatching {
            val remote = api.details(id)
            require(remote.error.isNullOrBlank()) { remote.error!! }
            val model = remote.toDomain(id)
            dao.upsertDetails(JobDetailsEntity(id, json.encodeToString(model), System.currentTimeMillis()))
        }
    }
    override suspend fun toggleSaved(id: String) { if (dao.isSaved(id)) dao.unsave(id) else dao.save(SavedJobEntity(id, System.currentTimeMillis())) }
}
