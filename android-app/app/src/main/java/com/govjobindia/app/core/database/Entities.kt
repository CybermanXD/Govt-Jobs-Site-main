package com.govjobindia.app.core.database

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "jobs")
data class JobEntity(
    @PrimaryKey val id: String, val title: String, val board: String, val qualification: String,
    val lastDate: String, val source: String, val url: String, val state: String,
    val postCount: String, val location: String, val isActiveInLatestSnapshot: Boolean, val updatedAt: Long,
)
@Entity(tableName = "saved_jobs", foreignKeys = [ForeignKey(entity = JobEntity::class, parentColumns = ["id"], childColumns = ["jobId"], onDelete = ForeignKey.CASCADE)], indices = [Index("jobId")])
data class SavedJobEntity(@PrimaryKey val jobId: String, val savedAt: Long)
@Entity(tableName = "job_details", foreignKeys = [ForeignKey(entity = JobEntity::class, parentColumns = ["id"], childColumns = ["jobId"], onDelete = ForeignKey.CASCADE)], indices = [Index("jobId")])
data class JobDetailsEntity(@PrimaryKey val jobId: String, val payload: String, val fetchedAt: Long)
@Entity(tableName = "sync_metadata")
data class SyncMetadataEntity(@PrimaryKey val key: String = "snapshot", val lastSuccess: Long?, val lastAttempt: Long, val remoteVersion: String?, val error: String?)

data class JobWithSaved(
    val id: String, val title: String, val board: String, val qualification: String,
    val lastDate: String, val source: String, val url: String, val state: String,
    val postCount: String, val location: String, val isActiveInLatestSnapshot: Boolean,
    val savedAt: Long?,
)
