package com.codeit.modules.competition;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.codeit.modules.auth.SecurityUtils;
import com.codeit.modules.competition.dto.ContestSessionEvent;
import com.codeit.modules.competition.dto.ContestSubmissionRequest;
import com.codeit.modules.competition.dto.LeaderboardEntry;
import com.codeit.modules.competition.dto.UpdateCompetitionTimesRequest;
import com.codeit.modules.problems.ProblemRepository;
import com.codeit.modules.submission.Submission;
import com.codeit.modules.submission.SubmissionService;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserRepository;

@Service
public class CompetitionService {
    @Autowired
    private CompetitionRepository competitionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProblemRepository problemRepository;
    @Autowired
    private SubmissionService submissionService;
    @Autowired
    private CompetitionEventPublisher competitionEventPublisher;
    @Autowired
    private LeaderboardCacheService leaderboardCacheService;
    @Autowired
    private CompetitionCacheService competitionCacheService;

    public Competition createCompetition(Competition competition) {
        if (competition.getStartTime() == null || competition.getEndTime() == null) {
            throw new RuntimeException("startTime and endTime are required");
        }
        if (!competition.getStartTime().before(competition.getEndTime())) {
            throw new RuntimeException("startTime must be before endTime");
        }
        if (competition.getDurationMinutes() == null) {
            competition.setDurationMinutes(120);
        }
        competition.setCreatedBy(SecurityUtils.currentUserId());
        CompetitionStatusResolver.applyStatus(competition);
        Competition created = competitionRepository.createCompetition(competition);
        competitionCacheService.invalidateAll();
        return created;
    }

    public List<Competition> getAllCompetitions() {
        return competitionCacheService.getAll()
                .map(competitions -> competitions.stream()
                        .map(CompetitionStatusResolver::applyStatus)
                        .toList())
                .orElseGet(() -> {
                    List<Competition> competitions = competitionRepository.getAllCompetitions().stream()
                            .map(CompetitionStatusResolver::applyStatus)
                            .toList();
                    competitionCacheService.putAll(competitions);
                    return competitions;
                });
    }

    public Competition getCompetitionById(Integer id) {
        Competition competition = competitionCacheService.getById(id)
                .orElseGet(() -> {
                    Competition fromDb = competitionRepository.getCompetitionById(id);
                    if (fromDb != null) {
                        CompetitionStatusResolver.applyStatus(fromDb);
                        competitionCacheService.putById(id, fromDb);
                    }
                    return fromDb;
                });
        if (competition == null) {
            return null;
        }
        return CompetitionStatusResolver.applyStatus(competition);
    }

    public String addProblems(Integer competitionId, List<Integer> problemIds) {
        if (getCompetitionById(competitionId) == null) {
            return "Competition not found";
        }

        for (Integer problemId : problemIds) {
            if (!problemRepository.existsById(problemId)) {
                return "Problem not found: " + problemId;
            }
        }

        for (Integer problemId : problemIds) {
            competitionRepository.addProblemsToCompetitions(competitionId, problemId);
        }
        competitionCacheService.invalidate(competitionId);
        return "Problems added successfully";
    }

    public List<Integer> getCompetitionProblems(Integer competitionId) {
        if (getCompetitionById(competitionId) == null) {
            throw new RuntimeException("Competition not found");
        }
        return competitionRepository.getCompetitionProblems(competitionId);
    }

    public String joinCompetition(Integer competitionId, Integer userID) {
        Competition competition = getCompetitionById(competitionId);
        if (competition == null) {
            return "Competition not found";
        }

        if (CompetitionStatusResolver.resolve(competition) == CompetitionStatus.ENDED) {
            return "Competition has ended";
        }

        User user = userRepository.getUserById(userID).orElse(null);
        if (user == null) {
            return "User not found";
        }

        Integer count = competitionRepository.alreadyJoined(competitionId, userID);
        if (count > 0) {
            return "User already joined";
        }
        competitionRepository.joinCompetition(competitionId, userID);
        return "joined successfully";
    }

    public List<Integer> getParticipants(Integer competitionId) {
        if (getCompetitionById(competitionId) == null) {
            throw new RuntimeException("Competition not found");
        }
        return competitionRepository.getParticipants(competitionId);
    }

    public ContestSessionEvent startCompetitionSession(Integer competitionId, Integer userId) {
        Competition competition = getCompetitionById(competitionId);
        if (competition == null) {
            throw new RuntimeException("Competition not found");
        }

        CompetitionStatus globalStatus = CompetitionStatusResolver.resolve(competition);
        if (globalStatus == CompetitionStatus.ENDED) {
            throw new RuntimeException("Competition has ended");
        }

        CompetitionParticipant participant = competitionRepository.getParticipantSession(competitionId, userId);
        if (participant == null) {
            throw new RuntimeException("User has not joined this competition");
        }

        if (CompetitionSessionStatus.ENDED.name().equals(participant.getSessionStatus())) {
            throw new RuntimeException("Session already ended");
        }

        if (CompetitionSessionStatus.IN_PROGRESS.name().equals(participant.getSessionStatus())) {
            throw new RuntimeException("Session already started");
        }

        int updated = competitionRepository.startSession(competitionId, userId);
        if (updated == 0) {
            throw new RuntimeException("Unable to start session");
        }

        participant = competitionRepository.getParticipantSession(competitionId, userId);
        ContestSessionEvent event = CompetitionEventPublisher.buildSessionEvent(competition, participant);
        competitionEventPublisher.publishSession(competitionId, userId, event);
        return event;
    }

    public ContestSessionEvent getCompetitionSession(Integer competitionId, Integer userId) {
        Competition competition = getCompetitionById(competitionId);
        if (competition == null) {
            throw new RuntimeException("Competition not found");
        }

        CompetitionParticipant participant = competitionRepository.getParticipantSession(competitionId, userId);
        if (participant == null) {
            throw new RuntimeException("User has not joined this competition");
        }

        if (CompetitionSessionStatus.IN_PROGRESS.name().equals(participant.getSessionStatus())
                && isSessionExpired(competition, participant)) {
            competitionRepository.endSession(competitionId, userId);
            participant = competitionRepository.getParticipantSession(competitionId, userId);
        }

        return CompetitionEventPublisher.buildSessionEvent(competition, participant);
    }

    public ContestSessionEvent endCompetitionSession(Integer competitionId, Integer userId) {
        Competition competition = getCompetitionById(competitionId);
        if (competition == null) {
            throw new RuntimeException("Competition not found");
        }

        CompetitionParticipant participant = competitionRepository.getParticipantSession(competitionId, userId);
        if (participant == null) {
            throw new RuntimeException("User has not joined this competition");
        }

        if (CompetitionSessionStatus.ENDED.name().equals(participant.getSessionStatus())) {
            return CompetitionEventPublisher.buildSessionEvent(competition, participant);
        }

        if (!CompetitionSessionStatus.IN_PROGRESS.name().equals(participant.getSessionStatus())) {
            throw new RuntimeException("Start the competition before ending it");
        }

        int updated = competitionRepository.endSession(competitionId, userId);
        if (updated == 0) {
            throw new RuntimeException("Unable to end session");
        }

        participant = competitionRepository.getParticipantSession(competitionId, userId);
        ContestSessionEvent event = CompetitionEventPublisher.buildSessionEvent(competition, participant);
        competitionEventPublisher.publishSession(competitionId, userId, event);
        return event;
    }

    public JudgeVerdictDTO submitCompetitionSolution(Integer competitionId, ContestSubmissionRequest request) {
        Integer userId = SecurityUtils.currentUserId();

        Competition competition = getCompetitionById(competitionId);
        if (competition == null) {
            throw new RuntimeException("Competition not found");
        }

        Integer count = competitionRepository.alreadyJoined(competitionId, userId);
        if (count == 0) {
            throw new RuntimeException("user not joined this Competition");
        }

        CompetitionStatus status = CompetitionStatusResolver.resolve(competition);
        if (status != CompetitionStatus.ACTIVE) {
            throw new RuntimeException(
                    status == CompetitionStatus.UPCOMING
                            ? "Competition has not started"
                            : "Competition has ended");
        }

        CompetitionParticipant participant = competitionRepository.getParticipantSession(competitionId, userId);
        if (participant == null) {
            throw new RuntimeException("User has not joined this competition");
        }

        if (!CompetitionSessionStatus.IN_PROGRESS.name().equals(participant.getSessionStatus())) {
            if (CompetitionSessionStatus.ENDED.name().equals(participant.getSessionStatus())) {
                throw new RuntimeException("Session already ended");
            }
            throw new RuntimeException("Start the competition first");
        }

        if (isSessionExpired(competition, participant)) {
            competitionRepository.endSession(competitionId, userId);
            throw new RuntimeException("Your competition time has ended");
        }

        Submission submission = new Submission();
        submission.setUserId(userId);
        submission.setProblemId(request.getProblemId());
        submission.setCompetitionId(competitionId);
        submission.setLanguage(request.getLanguage());
        submission.setLanguageId(request.getLanguageId());
        submission.setCode(request.getCode());

        JudgeVerdictDTO verdict = submissionService.submit(submission);

        if ("Accepted".equals(verdict.getVerdict())) {
            List<LeaderboardEntry> leaderboard = leaderboardCacheService.refresh(competitionId);
            competitionEventPublisher.publishLeaderboard(competitionId, leaderboard);
        }

        return verdict;
    }

    public List<LeaderboardEntry> getLeaderboard(Integer competitionId) {
        if (getCompetitionById(competitionId) == null) {
            throw new RuntimeException("Competition not found");
        }
        return leaderboardCacheService.get(competitionId)
                .orElseGet(() -> {
                    List<LeaderboardEntry> entries = competitionRepository.getLeaderboard(competitionId);
                    leaderboardCacheService.put(competitionId, entries);
                    return entries;
                });
    }

    public Competition updateCompetitionTimes(Integer competitionId, UpdateCompetitionTimesRequest request) {
        if (getCompetitionById(competitionId) == null) {
            throw new RuntimeException("Competition not found");
        }

        if (!request.getStartTime().before(request.getEndTime())) {
            throw new RuntimeException("startTime must be before endTime");
        }

        String status = CompetitionStatus.fromTimes(
                request.getStartTime(),
                request.getEndTime(),
                LocalDateTime.now()).name();

        competitionRepository.updateCompetitionTimes(
                competitionId,
                request.getStartTime(),
                request.getEndTime(),
                status);

        competitionCacheService.invalidate(competitionId);

        Competition updated = getCompetitionById(competitionId);
        competitionEventPublisher.publishStatus(
                competitionId,
                CompetitionEventPublisher.buildStatusEvent(updated));
        return updated;
    }

    private boolean isSessionExpired(Competition competition, CompetitionParticipant participant) {
        if (participant.getStartedAt() == null) {
            return false;
        }
        Instant deadline = CompetitionEventPublisher.computeDeadline(
                competition,
                participant.getStartedAt().toInstant());
        return !Instant.now().isBefore(deadline);
    }
}
