package com.codeit.modules.competition;

import java.time.Instant;
import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.codeit.modules.competition.dto.ContestSessionEvent;
import com.codeit.modules.competition.dto.ContestStatusEvent;
import com.codeit.modules.competition.dto.LeaderboardEntry;

@Service
public class CompetitionEventPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public CompetitionEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishLeaderboard(Integer competitionId, List<LeaderboardEntry> leaderboard) {
        messagingTemplate.convertAndSend("/topic/competitions/" + competitionId + "/leaderboard", leaderboard);
    }

    public void publishStatus(Integer competitionId, ContestStatusEvent event) {
        messagingTemplate.convertAndSend(
                "/topic/competitions/" + competitionId + "/status",
                event);
    }

    public void publishSession(Integer competitionId, Integer userId, ContestSessionEvent event) {
        messagingTemplate.convertAndSend(
                "/topic/competitions/" + competitionId + "/users/" + userId + "/session",
                event);
    }

    public static ContestStatusEvent buildStatusEvent(Competition competition) {
        ContestStatusEvent event = new ContestStatusEvent();
        event.setCompetitionId(competition.getId());
        event.setStatus(CompetitionStatusResolver.resolve(competition).name());
        event.setStartTime(competition.getStartTime().toInstant().toString());
        event.setEndTime(competition.getEndTime().toInstant().toString());
        event.setServerTime(Instant.now().toString());
        return event;
    }

    public static ContestSessionEvent buildSessionEvent(Competition competition, CompetitionParticipant participant) {
        Instant now = Instant.now();
        ContestSessionEvent event = new ContestSessionEvent();
        event.setCompetitionId(competition.getId());
        event.setUserId(participant.getUserId());
        event.setSessionStatus(participant.getSessionStatus());
        event.setServerTime(now.toString());

        if (participant.getStartedAt() != null) {
            event.setStartedAt(participant.getStartedAt().toInstant().toString());
            Instant deadline = computeDeadline(competition, participant.getStartedAt().toInstant());
            event.setDeadlineAt(deadline.toString());

            if (CompetitionSessionStatus.ENDED.name().equals(participant.getSessionStatus())) {
                event.setRemainingSeconds(0L);
            } else {
                long remaining = deadline.getEpochSecond() - now.getEpochSecond();
                event.setRemainingSeconds(Math.max(0L, remaining));
            }
        }

        return event;
    }

    public static Instant computeDeadline(Competition competition, Instant startedAt) {
        int durationMinutes = competition.getDurationMinutes() != null
                ? competition.getDurationMinutes()
                : 120;
        Instant personalDeadline = startedAt.plusSeconds(durationMinutes * 60L);
        Instant globalEnd = competition.getEndTime().toInstant();
        return personalDeadline.isBefore(globalEnd) ? personalDeadline : globalEnd;
    }
}
