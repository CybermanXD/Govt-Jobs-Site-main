package com.govjobindia.app.core.model

import kotlinx.serialization.Serializable

data class Job(
    val id: String,
    val title: String,
    val board: String = "",
    val qualification: String = "",
    val lastDate: String = "",
    val source: String = "",
    val url: String = "",
    val state: String = "",
    val postCount: String = "",
    val location: String = "",
    val saved: Boolean = false,
    val active: Boolean = true,
)

@Serializable data class DetailItem(val label: String = "", val value: String = "")
@Serializable data class ImportantLink(val type: String = "", val label: String = "", val display: String = "", val url: String = "")

@Serializable
data class JobDetails(
    val jobId: String,
    val url: String = "",
    val companyName: String = "",
    val postName: String = "",
    val noOfPosts: String = "",
    val advtNo: String = "",
    val salary: String = "",
    val qualification: String = "",
    val ageLimit: List<String> = emptyList(),
    val startDate: String = "",
    val lastDate: String = "",
    val officialWebsite: String = "",
    val officialWebsites: List<String> = emptyList(),
    val eligibility: List<String> = emptyList(),
    val desirableSkills: List<String> = emptyList(),
    val experience: List<String> = emptyList(),
    val salaryDetails: List<String> = emptyList(),
    val importantDates: List<String> = emptyList(),
    val importantDatesTable: List<DetailItem> = emptyList(),
    val selectionProcess: List<String> = emptyList(),
    val generalInstructions: List<String> = emptyList(),
    val howToApply: List<String> = emptyList(),
    val importantLinks: List<ImportantLink> = emptyList(),
    val officialNotificationStatus: String = "",
)

enum class SortOrder { NEAREST, FARTHEST }
enum class ClosingMonth { ANY, THIS, NEXT, LATER }
data class JobFilters(
    val query: String = "",
    val state: String = "",
    val qualification: String = "",
    val board: String = "",
    val month: ClosingMonth = ClosingMonth.ANY,
    val sort: SortOrder = SortOrder.NEAREST,
) {
    val activeCount get() = listOf(query, state, qualification, board).count { it.isNotBlank() } + (if (month != ClosingMonth.ANY) 1 else 0)
}
