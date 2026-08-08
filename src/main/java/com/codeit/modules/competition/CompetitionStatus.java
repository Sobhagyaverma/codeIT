package com.codeit.modules.competition;

import java.sql.Timestamp;
import java.time.Instant;

public enum CompetitionStatus {
    UPCOMING, ACTIVE, ENDED;

    /**
     * Compare contest bounds as absolute instants (timezone-safe).
     * Null start/end are treated as missing → ACTIVE is not assumed; callers should validate.
     */
    public static CompetitionStatus fromTimes(Timestamp start, Timestamp end, Instant now) {
        if (start == null || end == null || now == null) {
            throw new IllegalArgumentException("start, end, and now are required");
        }
        Instant startInstant = start.toInstant();
        Instant endInstant = end.toInstant();
        if (now.isBefore(startInstant)) {
            return UPCOMING;
        }
        if (now.isAfter(endInstant)) {
            return ENDED;
        }
        return ACTIVE;
    }
}
