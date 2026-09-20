package com.govjobindia.app.data.mapper

import com.govjobindia.app.core.database.JobEntity
import com.govjobindia.app.core.database.JobWithSaved
import com.govjobindia.app.core.model.*
import com.govjobindia.app.core.network.*
import kotlinx.serialization.json.JsonElement
import java.net.URI
import java.text.Normalizer
import java.time.*
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.util.Locale

fun JobDto.toEntity(now: Long) = id?.trim()?.takeIf { it.isNotEmpty() }?.let { key ->
    JobEntity(key, title.orEmpty().trim().ifEmpty { "Untitled job" }, board.orEmpty().trim(), qualification.orEmpty().trim(),
        lastDate.orEmpty().trim(), source.orEmpty().trim(), url.orEmpty().trim(), state.orEmpty().trim(),
        postCount.text().trim(), location.orEmpty().trim(), true, now)
}
fun JobWithSaved.toDomain() = Job(id, title, board, qualification, lastDate, source, url, state, postCount, location, savedAt != null, isActiveInLatestSnapshot)

private fun List<JsonElement?>?.strings() = orEmpty().map { it.text().trim() }.filter { it.isNotEmpty() }.distinct()
fun DetailsDto.toDomain(id: String) = JobDetails(
    id, url.orEmpty(), companyName.orEmpty(), postName.orEmpty(), noOfPosts.text(), advtNo.orEmpty(), salary.orEmpty(),
    qualification.orEmpty(), when (ageLimit) { null -> emptyList(); else -> listOf(ageLimit.text()).filter(String::isNotBlank) },
    startDate.orEmpty(), lastDate.orEmpty(), officialWebsite.orEmpty(), officialWebsites.orEmpty().filterNotNull().filter(String::isNotBlank).distinct(),
    eligibility.strings(), desirableSkills.strings(), experience.strings(), salaryDetails.strings(), importantDates.strings(),
    importantDatesTable.orEmpty().filterNotNull().map { DetailItem(it.label.orEmpty(), it.value.orEmpty()) }.filter { it.label.isNotBlank() || it.value.isNotBlank() }.distinct(),
    selectionProcess.strings(), generalInstructions.strings(), howToApply.strings(),
    importantLinks.orEmpty().filterNotNull().map { ImportantLink(it.type.orEmpty(), it.label.orEmpty(), it.display.orEmpty(), it.url.orEmpty()) }.filter { safeHttpUrl(it.url) && it.type in setOf("applyOnline", "officialNotification", "officialWebsite") }.distinctBy { it.type to it.url },
    officialNotificationStatus.orEmpty(),
)

fun normalize(value: String): String = Normalizer.normalize(value.lowercase(Locale.ROOT), Normalizer.Form.NFKD).replace(Regex("[^a-z0-9]+"), " ").trim()
fun safeHttpUrl(value: String): Boolean = try { URI(value).scheme?.lowercase() in setOf("http", "https") && !URI(value).host.isNullOrBlank() } catch (_: Exception) { false }
fun parseDate(value: String): LocalDate? {
    if (value.isBlank()) return null
    return try { OffsetDateTime.parse(value).toLocalDate() } catch (_: DateTimeParseException) {
        try { LocalDate.parse(value.take(10)) } catch (_: DateTimeParseException) {
            listOf("d MMMM uuuu", "d MMM uuuu").firstNotNullOfOrNull { pattern -> runCatching { LocalDate.parse(value, DateTimeFormatter.ofPattern(pattern, Locale.ENGLISH)) }.getOrNull() }
        }
    }
}
fun displayDate(value: String): String = parseDate(value)?.format(DateTimeFormatter.ofPattern("d MMM uuuu", Locale.ENGLISH)) ?: value.ifBlank { "Not specified" }
fun filterJobs(jobs: List<Job>, filters: JobFilters, today: LocalDate = LocalDate.now()): List<Job> {
    val query = normalize(filters.query)
    val target = when (filters.month) { ClosingMonth.THIS -> YearMonth.from(today); ClosingMonth.NEXT -> YearMonth.from(today).plusMonths(1); ClosingMonth.LATER -> YearMonth.from(today).plusMonths(2); else -> null }
    return jobs.filter { job ->
        val blob = normalize(listOf(job.title, job.board, job.qualification, job.state, job.location, job.source, job.postCount).joinToString(" "))
        (query.isBlank() || blob.contains(query)) && (filters.state.isBlank() || job.state == filters.state) &&
            (filters.qualification.isBlank() || job.qualification == filters.qualification) && (filters.board.isBlank() || job.board == filters.board) &&
            (target == null || parseDate(job.lastDate)?.let(YearMonth::from) == target)
    }.sortedWith(compareBy<Job> { parseDate(it.lastDate) ?: LocalDate.MAX }.let { if (filters.sort == SortOrder.FARTHEST) it.reversed() else it })
}

fun uniqueDates(details: JobDetails, fallbackLastDate: String): List<String> {
    val candidates = buildList {
        if (details.startDate.isNotBlank()) add("Start Date to Apply: ${displayDate(details.startDate)}")
        val last = details.lastDate.ifBlank { fallbackLastDate }
        if (last.isNotBlank()) add("Last Date to Apply: ${displayDate(last)}")
        addAll(details.importantDates)
        addAll(details.importantDatesTable.map { "${it.label}: ${it.value}".trim(':', ' ') })
    }
    val seen = mutableSetOf<String>()
    return candidates.filter { text ->
        val rawDate = Regex("\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\s+[A-Za-z]+\\s+\\d{4}").find(text)?.value
        val key = rawDate?.let { parseDate(it)?.toString() ?: normalize(it) } ?: normalize(text)
        seen.add(key)
    }
}
