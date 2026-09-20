package com.govjobindia.app.core.database

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [JobEntity::class, SavedJobEntity::class, JobDetailsEntity::class, SyncMetadataEntity::class], version = 1, exportSchema = true)
abstract class GovJobDatabase : RoomDatabase() { abstract fun jobDao(): JobDao }
