package com.codeit.modules.competition;

import java.sql.Timestamp;
import java.time.LocalDateTime;

public enum CompetitionStatus {
    UPCOMING, ACTIVE, ENDED;

    public static CompetitionStatus fromTimes(Timestamp start, Timestamp end, LocalDateTime now) {
        LocalDateTime startDt = start.toLocalDateTime();
        LocalDateTime endDt = end.toLocalDateTime();
        if (now.isBefore(startDt)) {
            return UPCOMING;
        }
        if (now.isAfter(endDt)) {
            return ENDED;
        }
        return ACTIVE;
    }
}
