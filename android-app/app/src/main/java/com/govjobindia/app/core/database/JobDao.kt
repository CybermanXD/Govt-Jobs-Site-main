package com.govjobindia.app.core.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface JobDao {
    @Query("SELECT j.id,j.title,j.board,j.qualification,j.lastDate,j.source,j.url,j.state,j.postCount,j.location,j.isActiveInLatestSnapshot,s.savedAt FROM jobs j LEFT JOIN saved_jobs s ON j.id=s.jobId WHERE j.isActiveInLatestSnapshot=1 OR s.jobId IS NOT NULL ORDER BY j.lastDate")
    fun observeJobs(): Flow<List<JobWithSaved>>
    @Query("SELECT j.id,j.title,j.board,j.qualification,j.lastDate,j.source,j.url,j.state,j.postCount,j.location,j.isActiveInLatestSnapshot,s.savedAt FROM jobs j INNER JOIN saved_jobs s ON j.id=s.jobId ORDER BY s.savedAt DESC")
    fun observeSaved(): Flow<List<JobWithSaved>>
    @Query("SELECT * FROM job_details WHERE jobId=:id") fun observeDetails(id: String): Flow<JobDetailsEntity?>
    @Query("SELECT * FROM job_details WHERE jobId=:id") suspend fun details(id: String): JobDetailsEntity?
    @Query("SELECT EXISTS(SELECT 1 FROM saved_jobs WHERE jobId=:id)") fun observeIsSaved(id: String): Flow<Boolean>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsertJobs(jobs: List<JobEntity>)
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsertDetails(details: JobDetailsEntity)
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun save(saved: SavedJobEntity)
    @Query("DELETE FROM saved_jobs WHERE jobId=:id") suspend fun unsave(id: String)
    @Query("UPDATE jobs SET isActiveInLatestSnapshot=0") suspend fun markAllInactive()
    @Query("DELETE FROM jobs WHERE isActiveInLatestSnapshot=0 AND id NOT IN (SELECT jobId FROM saved_jobs)") suspend fun deleteInactiveUnsaved()
    @Query("SELECT EXISTS(SELECT 1 FROM saved_jobs WHERE jobId=:id)") suspend fun isSaved(id: String): Boolean
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun syncMetadata(metadata: SyncMetadataEntity)
    @Query("SELECT * FROM sync_metadata WHERE `key`='snapshot'") fun observeSync(): Flow<SyncMetadataEntity?>
}
