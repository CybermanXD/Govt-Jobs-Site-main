package com.govjobindia.app.core.network

import retrofit2.http.GET
import retrofit2.http.Query

interface GovJobApi {
    @GET("api/snapshot") suspend fun snapshot(): SnapshotDto
    @GET("api/job_details") suspend fun details(@Query("id") id: String): DetailsDto
    @GET("api/meta") suspend fun meta(): MetaDto
}
