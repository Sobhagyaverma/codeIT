package com.codeit.modules.competition;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.sql.Timestamp;
import java.time.Instant;

import org.junit.jupiter.api.Test;

class CompetitionStatusTests {

    @Test
    void upcomingWhenBeforeStart() {
        Instant start = Instant.parse("2026-08-08T12:00:00Z");
        Instant end = Instant.parse("2026-08-08T14:00:00Z");
        Instant now = Instant.parse("2026-08-08T11:59:59Z");

        assertEquals(
                CompetitionStatus.UPCOMING,
                CompetitionStatus.fromTimes(Timestamp.from(start), Timestamp.from(end), now));
    }

    @Test
    void activeDuringWindow() {
        Instant start = Instant.parse("2026-08-08T12:00:00Z");
        Instant end = Instant.parse("2026-08-08T14:00:00Z");
        Instant now = Instant.parse("2026-08-08T12:00:00Z");

        assertEquals(
                CompetitionStatus.ACTIVE,
                CompetitionStatus.fromTimes(Timestamp.from(start), Timestamp.from(end), now));
    }

    @Test
    void endedAfterEnd() {
        Instant start = Instant.parse("2026-08-08T12:00:00Z");
        Instant end = Instant.parse("2026-08-08T14:00:00Z");
        Instant now = Instant.parse("2026-08-08T14:00:01Z");

        assertEquals(
                CompetitionStatus.ENDED,
                CompetitionStatus.fromTimes(Timestamp.from(start), Timestamp.from(end), now));
    }

    @Test
    void rejectsNullBounds() {
        assertThrows(
                IllegalArgumentException.class,
                () -> CompetitionStatus.fromTimes(null, Timestamp.from(Instant.now()), Instant.now()));
    }
}
