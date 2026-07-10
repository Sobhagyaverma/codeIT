package com.codeit.modules.competition;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.codeit.modules.competition.dto.ContestSessionEvent;

@Component
public class CompetitionStatusScheduler {

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private CompetitionEventPublisher competitionEventPublisher;

    @Autowired
    private CompetitionCacheService competitionCacheService;

    private final Map<Integer, CompetitionStatus> lastKnownStatus = new ConcurrentHashMap<>();

    @Scheduled(fixedRate = 60_000)
    public void syncStatuses() {
        List<Competition> competitions = competitionRepository.getAllCompetitions();
        boolean statusChanged = false;

        for (Competition competition : competitions) {
            CompetitionStatus current = CompetitionStatusResolver.resolve(competition);
            CompetitionStatus previous = lastKnownStatus.get(competition.getId());

            if (previous != null && previous != current) {
                statusChanged = true;
                competitionEventPublisher.publishStatus(
                        competition.getId(),
                        CompetitionEventPublisher.buildStatusEvent(competition));
            }
            lastKnownStatus.put(competition.getId(), current);
        }

        if (statusChanged) {
            competitionCacheService.invalidateAll();
        }

        competitionRepository.syncAllCompetitionStatuses();
        expireSessions();
    }

    private void expireSessions() {
        List<CompetitionParticipant> expired = competitionRepository.findExpiredInProgressSessions();

        for (CompetitionParticipant participant : expired) {
            int updated = competitionRepository.endSession(
                    participant.getCompetitionId(),
                    participant.getUserId());
            if (updated == 0) {
                continue;
            }

            Competition competition = competitionRepository.getCompetitionById(participant.getCompetitionId());
            if (competition == null) {
                continue;
            }

            participant.setSessionStatus(CompetitionSessionStatus.ENDED.name());
            ContestSessionEvent event = CompetitionEventPublisher.buildSessionEvent(competition, participant);
            competitionEventPublisher.publishSession(
                    participant.getCompetitionId(),
                    participant.getUserId(),
                    event);
        }
    }
}
