package com.govjobindia.app.core.network

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull

@Serializable data class SnapshotDto(val updated_at: String? = null, val count: Int? = null, val jobs: List<JobDto?>? = null, val error: String? = null)
@Serializable data class MetaDto(val updated_at: String? = null, val version: String? = null, val count: Int? = null, val error: String? = null)
@Serializable data class JobDto(
    val id: String? = null, val title: String? = null, val board: String? = null,
    val qualification: String? = null, val lastDate: String? = null, val source: String? = null,
    val url: String? = null, val state: String? = null, val postCount: JsonElement? = null, val location: String? = null,
)
@Serializable data class DetailItemDto(val label: String? = null, val value: String? = null)
@Serializable data class LinkDto(val type: String? = null, val label: String? = null, val display: String? = null, val url: String? = null)
@Serializable data class DetailsDto(
    val error: String? = null, val url: String? = null, val html: String? = null,
    val companyName: String? = null, val postName: String? = null, val noOfPosts: JsonElement? = null,
    val advtNo: String? = null, val salary: String? = null, val qualification: String? = null,
    val ageLimit: JsonElement? = null, val startDate: String? = null, val lastDate: String? = null,
    val officialWebsite: String? = null, val officialWebsites: List<String?>? = null,
    val eligibility: List<JsonElement?>? = null, val desirableSkills: List<JsonElement?>? = null,
    val experience: List<JsonElement?>? = null, val salaryDetails: List<JsonElement?>? = null,
    val importantDates: List<JsonElement?>? = null, val importantDatesTable: List<DetailItemDto?>? = null,
    val selectionProcess: List<JsonElement?>? = null, val generalInstructions: List<JsonElement?>? = null,
    val howToApply: List<JsonElement?>? = null, val importantLinks: List<LinkDto?>? = null,
    val officialNotificationStatus: String? = null,
)

internal fun JsonElement?.text(): String = when (this) {
    is JsonPrimitive -> contentOrNull.orEmpty()
    null -> ""
    else -> toString()
}
