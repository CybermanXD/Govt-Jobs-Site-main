package com.govjobindia.app.di

import android.content.Context
import androidx.room.Room
import com.govjobindia.app.core.database.GovJobDatabase
import com.govjobindia.app.core.network.GovJobApi
import com.govjobindia.app.data.repository.OfflineJobRepository
import com.govjobindia.app.domain.repository.JobRepository
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module @InstallIn(SingletonComponent::class)
object AppModule {
    @Provides @Singleton fun json() = Json { ignoreUnknownKeys = true; isLenient = true; explicitNulls = false }
    @Provides @Singleton fun database(@ApplicationContext context: Context) = Room.databaseBuilder(context, GovJobDatabase::class.java, "govjob.db").build()
    @Provides @Singleton fun api(json: Json): GovJobApi {
        val client = OkHttpClient.Builder().connectTimeout(15, TimeUnit.SECONDS).readTimeout(30, TimeUnit.SECONDS).callTimeout(45, TimeUnit.SECONDS).build()
        return Retrofit.Builder().baseUrl("https://govjob-india.pages.dev/").client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType())).build().create(GovJobApi::class.java)
    }
}
@Module @InstallIn(SingletonComponent::class)
abstract class RepositoryModule { @Binds @Singleton abstract fun repository(impl: OfflineJobRepository): JobRepository }
