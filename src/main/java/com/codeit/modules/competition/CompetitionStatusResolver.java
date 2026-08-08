package com.codeit.modules.competition;

import java.time.Instant;

public final class CompetitionStatusResolver {

    private CompetitionStatusResolver() {
    }

    public static CompetitionStatus resolve(Competition competition) {
        return CompetitionStatus.fromTimes(
                competition.getStartTime(),
                competition.getEndTime(),
                Instant.now());
    }

    public static Competition applyStatus(Competition competition) {
        competition.setStatus(resolve(competition).name());
        return competition;
    }
}
