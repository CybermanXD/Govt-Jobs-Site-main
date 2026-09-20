package com.govjobindia.app.data.mapper

import com.govjobindia.app.core.model.*
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate

class MappersTest {
    private val jobs = listOf(Job("1","Clerk","Board B","Graduate","2027-01-05",state="Delhi"),Job("2","Engineer","Board A","B.Tech","2026-12-01",state="Kerala"))
    @Test fun searchNormalizesAndFiltersAllFields(){assertEquals("2",filterJobs(jobs,JobFilters(query="b tech"),LocalDate.of(2026,9,1)).single().id);assertEquals("1",filterJobs(jobs,JobFilters(state="Delhi"),LocalDate.of(2026,9,1)).single().id)}
    @Test fun sortsNearestAndFarthest(){assertEquals(listOf("2","1"),filterJobs(jobs,JobFilters(),LocalDate.of(2026,9,1)).map{it.id});assertEquals(listOf("1","2"),filterJobs(jobs,JobFilters(sort=SortOrder.FARTHEST),LocalDate.of(2026,9,1)).map{it.id})}
    @Test fun validatesSafeLinks(){assertTrue(safeHttpUrl("https://example.com/a"));assertFalse(safeHttpUrl("javascript:alert(1)"));assertFalse(safeHttpUrl("file:///secret"))}
    @Test fun parsesApiDates(){assertEquals(LocalDate.of(2026,9,20),parseDate("2026-09-20T18:30:00.000Z"));assertNull(parseDate("unknown"))}
    @Test fun deduplicatesDates(){val d=JobDetails("id",lastDate="2026-09-20",importantDates=listOf("Last Date: 2026-09-20","Interview: 22 September 2026"));assertEquals(2,uniqueDates(d,"").size)}
}
