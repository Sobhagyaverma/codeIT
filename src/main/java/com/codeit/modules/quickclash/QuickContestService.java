package com.codeit.modules.quickclash;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.auth.SecurityUtils;
import com.codeit.modules.friends.FriendRepository;
import com.codeit.modules.notifications.NotificationService;
import com.codeit.modules.problems.Problem;
import com.codeit.modules.problems.ProblemService;
import com.codeit.modules.submission.TestCaseCacheService;
import com.codeit.modules.submission.TestCaseJudgeService;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.submission.dto.TestCaseDTO;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserRepository;
import com.codeit.security.ratelimit.JudgeExecRateLimiter;
import com.codeit.security.ratelimit.RateLimitProperties;
import com.codeit.security.ratelimit.RateLimitService;

@Service
public class QuickContestService {

    private final QuickContestRepository repository;
    private final FriendRepository friendRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ProblemService problemService;
    private final TestCaseCacheService testCaseCacheService;
    private final TestCaseJudgeService testCaseJudgeService;
    private final JudgeExecRateLimiter judgeExecRateLimiter;
    private final QuickContestEventPublisher eventPublisher;
    private final RateLimitService rateLimitService;
    private final RateLimitProperties rateLimitProperties;

    public QuickContestService(
            QuickContestRepository repository,
            FriendRepository friendRepository,
            NotificationService notificationService,
            UserRepository userRepository,
            ProblemService problemService,
            TestCaseCacheService testCaseCacheService,
            TestCaseJudgeService testCaseJudgeService,
            JudgeExecRateLimiter judgeExecRateLimiter,
            QuickContestEventPublisher eventPublisher,
            RateLimitService rateLimitService,
            RateLimitProperties rateLimitProperties) {
        this.repository = repository;
        this.friendRepository = friendRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.problemService = problemService;
        this.testCaseCacheService = testCaseCacheService;
        this.testCaseJudgeService = testCaseJudgeService;
        this.judgeExecRateLimiter = judgeExecRateLimiter;
        this.eventPublisher = eventPublisher;
        this.rateLimitService = rateLimitService;
        this.rateLimitProperties = rateLimitProperties;
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body) {
        int me = SecurityUtils.currentUserId();
        rateLimitService.checkTieredOrThrow(
                "quick-contest-create", String.valueOf(me), rateLimitProperties.getQuickContestCreate());

        String name = str(body.get("name"), "Quick Clash");
        String description = str(body.get("description"), "");
        String tier = str(body.get("difficultyTier"), "MEDIUM").toUpperCase();
        int duration = intVal(body.get("durationMinutes"), 45);
        int maxPlayers = intVal(body.get("maxPlayers"), 4);

        if (!List.of("EASY", "MEDIUM", "HARD").contains(tier)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid difficultyTier");
        }
        if (duration < 15 || duration > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "durationMinutes must be 15–120");
        }
        if (maxPlayers < 2 || maxPlayers > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "maxPlayers must be 2–10");
        }

        List<Integer> problemIds = selectProblems(tier);
        if (problemIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Not enough problems in the bank for this tier");
        }

        long contestId = repository.createContest(me, name, description, tier, duration, maxPlayers);
        repository.addHostParticipant(contestId, me);
        repository.addProblems(contestId, problemIds);

        return getContest(contestId);
    }

    public Map<String, Object> getContest(long contestId) {
        int me = SecurityUtils.currentUserId();
        Map<String, Object> contest = requireVisible(contestId, me);
        Map<String, Object> body = new HashMap<>(contest);
        // Invite token is host-only (same hygiene as CodeRoom invites)
        Integer hostId = contest.get("host_user_id") instanceof Number n ? n.intValue() : null;
        if (hostId == null || hostId != me) {
            body.remove("invite_token");
        }
        String status = String.valueOf(contest.get("status"));
        // Hide problem set until the host starts (LIVE). Reveal for LIVE/ENDED review.
        if ("LIVE".equals(status) || "ENDED".equals(status)) {
            body.put("problems", repository.listProblems(contestId));
        } else {
            body.put("problems", List.of());
        }
        body.put("participants", repository.listParticipants(contestId));
        body.put("joinedCount", repository.countJoined(contestId));
        body.put("leaderboard", repository.leaderboard(contestId));
        return body;
    }

    public Map<String, Object> invite(long contestId, List<Integer> friendUserIds) {
        int me = SecurityUtils.currentUserId();
        rateLimitService.checkTieredOrThrow(
                "quick-contest-invite", String.valueOf(me), rateLimitProperties.getQuickContestInvite());

        Map<String, Object> contest = requireHostLobby(contestId, me);
        if (friendUserIds == null || friendUserIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "friendUserIds required");
        }

        User host = userRepository.getUserById(me).orElse(null);
        String contestName = String.valueOf(contest.get("name"));
        int invited = 0;
        for (Integer friendId : friendUserIds) {
            if (friendId == null || friendId == me) {
                continue;
            }
            if (!friendRepository.areFriends(me, friendId)) {
                continue;
            }
            repository.inviteUser(contestId, friendId);
            notificationService.notify(
                    friendId,
                    NotificationService.TYPE_QUICK_CONTEST_INVITE,
                    Map.of(
                            "contestId",
                            contestId,
                            "contestName",
                            contestName,
                            "hostName",
                            host != null && host.getName() != null && !host.getName().isBlank()
                                    ? host.getName()
                                    : "Host",
                            "message",
                            "You have been invited to Quick Contest."));
            invited++;
        }
        Map<String, Object> lobby = lobbyPayload(contestId);
        eventPublisher.publishLobby(contestId, lobby);
        return Map.of("invited", invited, "contest", getContest(contestId));
    }

    @Transactional
    public Map<String, Object> join(long contestId) {
        int me = SecurityUtils.currentUserId();
        rateLimitService.checkTieredOrThrow(
                "quick-contest-join", String.valueOf(me), rateLimitProperties.getQuickContestJoin());

        Map<String, Object> contest = repository
                .lockContestForUpdate(contestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contest not found"));
        String status = String.valueOf(contest.get("status"));
        // Lobby join + rejoin after an accidental leave while LIVE.
        if (!"LOBBY".equals(status) && !"LIVE".equals(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Contest is not joinable");
        }
        Map<String, Object> participant = repository
                .findParticipant(contestId, me)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Invite required"));
        String pStatus = String.valueOf(participant.get("status"));
        if ("JOINED".equals(pStatus)) {
            return getContest(contestId);
        }
        if (!"INVITED".equals(pStatus) && !"LEFT".equals(pStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot join this contest");
        }
        // LIVE rejoin is only for people who were already in (LEFT), not brand-new invites mid-contest.
        if ("LIVE".equals(status) && !"LEFT".equals(pStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Contest already started — ask the host to invite you next time");
        }
        int maxPlayers = ((Number) contest.get("max_players")).intValue();
        if (repository.countJoined(contestId) >= maxPlayers) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lobby is full");
        }
        repository.markJoined(contestId, me);
        if ("LOBBY".equals(status)) {
            eventPublisher.publishLobby(contestId, lobbyPayload(contestId));
        } else {
            eventPublisher.publishStatus(
                    contestId, Map.of("status", "LIVE", "event", "participant-rejoined", "userId", me));
            eventPublisher.publishLeaderboard(contestId, repository.leaderboard(contestId));
        }
        return getContest(contestId);
    }

    public Map<String, Object> setReady(long contestId, boolean ready) {
        int me = SecurityUtils.currentUserId();
        requireJoined(contestId, me);
        repository.setReady(contestId, me, ready);
        eventPublisher.publishLobby(contestId, lobbyPayload(contestId));
        return getContest(contestId);
    }

    public Map<String, Object> leave(long contestId) {
        int me = SecurityUtils.currentUserId();
        Map<String, Object> contest = repository
                .findContest(contestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contest not found"));
        repository
                .findParticipant(contestId, me)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant"));
        if (((Number) contest.get("host_user_id")).intValue() == me
                && "LOBBY".equals(String.valueOf(contest.get("status")))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Host must cancel the contest instead of leaving");
        }
        repository.leave(contestId, me);
        eventPublisher.publishLobby(contestId, lobbyPayload(contestId));
        return Map.of("ok", true);
    }

    @Transactional
    public Map<String, Object> start(long contestId) {
        int me = SecurityUtils.currentUserId();
        rateLimitService.checkTieredOrThrow(
                "quick-contest-start", String.valueOf(me), rateLimitProperties.getQuickContestStart());

        Map<String, Object> contest = requireHostLobby(contestId, me);
        // Serialize start against concurrent join/start
        repository.lockContestForUpdate(contestId);
        int joined = repository.countJoined(contestId);
        if (joined < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Need at least 2 joined players");
        }
        int duration = ((Number) contest.get("duration_minutes")).intValue();
        Instant endsAt = Instant.now().plusSeconds(duration * 60L);
        int updated = repository.startContest(contestId, endsAt);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Contest already started");
        }

        for (Map<String, Object> p : repository.listParticipants(contestId)) {
            if ("JOINED".equals(String.valueOf(p.get("status")))) {
                int uid = ((Number) p.get("user_id")).intValue();
                if (uid != me) {
                    notificationService.notify(
                            uid,
                            NotificationService.TYPE_QUICK_CONTEST_STARTING,
                            Map.of(
                                    "contestId",
                                    contestId,
                                    "message",
                                    "Quick Contest is starting now."));
                }
            }
        }

        Map<String, Object> status =
                Map.of("status", "LIVE", "endsAt", endsAt.toString(), "contestId", contestId);
        eventPublisher.publishStatus(contestId, status);
        eventPublisher.publishLobby(contestId, lobbyPayload(contestId));
        return getContest(contestId);
    }

    public Map<String, Object> cancel(long contestId) {
        int me = SecurityUtils.currentUserId();
        requireHostLobby(contestId, me);
        repository.cancelContest(contestId);
        eventPublisher.publishStatus(contestId, Map.of("status", "CANCELLED", "contestId", contestId));
        return Map.of("ok", true, "status", "CANCELLED");
    }

    public JudgeVerdictDTO submit(long contestId, Map<String, Object> body) {
        int me = SecurityUtils.currentUserId();
        Map<String, Object> contest = repository
                .findContest(contestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contest not found"));
        if (!"LIVE".equals(String.valueOf(contest.get("status")))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Contest is not live");
        }
        Object ends = contest.get("ends_at");
        Instant endsAt = toInstant(ends);
        if (endsAt != null && Instant.now().isAfter(endsAt)) {
            finalizeContest(contestId);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Contest has ended");
        }
        requireJoined(contestId, me);

        int problemId = intVal(body.get("problemId"), 0);
        if (!repository.isContestProblem(contestId, problemId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Problem not in this contest");
        }
        String code = str(body.get("code"), "");
        int languageId = intVal(body.get("languageId"), 0);
        String language = str(body.get("language"), "unknown");
        if (code.isBlank() || languageId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "code and languageId required");
        }

        judgeExecRateLimiter.checkSubmit(me);
        Problem problem = problemService.getProblemForJudge(problemId);
        if (problem == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }
        List<TestCaseDTO> testCases =
                testCaseCacheService.get(problemId, problem.getTestCases());
        JudgeVerdictDTO verdict = testCaseJudgeService.judge(code, languageId, testCases);

        repository.saveSubmission(
                contestId,
                me,
                problemId,
                language,
                languageId,
                code,
                verdict.getVerdict(),
                verdict.getTime() == null ? null : verdict.getTime().doubleValue(),
                verdict.getMemory() == null ? null : verdict.getMemory().floatValue());

        List<Map<String, Object>> board = repository.leaderboard(contestId);
        eventPublisher.publishLeaderboard(contestId, board);
        return verdict;
    }

    public List<Map<String, Object>> leaderboard(long contestId) {
        int me = SecurityUtils.currentUserId();
        requireVisible(contestId, me);
        return repository.leaderboard(contestId);
    }

    public Map<String, Object> history() {
        int me = SecurityUtils.currentUserId();
        return Map.of(
                "active", repository.activeForUser(me),
                "history", repository.historyForUser(me),
                "invited", repository.invitedForUser(me));
    }

    @Transactional
    public void finalizeContest(long contestId) {
        repository.endContest(contestId);
        List<Map<String, Object>> board = repository.leaderboard(contestId);
        repository.replaceResults(contestId, board);
        for (Map<String, Object> p : repository.listParticipants(contestId)) {
            if ("JOINED".equals(String.valueOf(p.get("status")))) {
                notificationService.notify(
                        ((Number) p.get("user_id")).intValue(),
                        NotificationService.TYPE_QUICK_CONTEST_ENDED,
                        Map.of("contestId", contestId, "message", "Quick Contest has ended."));
            }
        }
        eventPublisher.publishStatus(contestId, Map.of("status", "ENDED", "contestId", contestId));
        eventPublisher.publishLeaderboard(contestId, board);
    }

    public void finalizeExpired() {
        for (Long id : repository.findExpiredLiveContestIds()) {
            finalizeContest(id);
        }
    }

    private List<Integer> selectProblems(String tier) {
        List<Integer> ids = new ArrayList<>();
        switch (tier) {
            case "EASY" -> ids.addAll(repository.pickRandomProblemIds("EASY", 3, List.of()));
            case "MEDIUM" -> {
                ids.addAll(repository.pickRandomProblemIds("EASY", 1, List.of()));
                ids.addAll(repository.pickRandomProblemIds("MEDIUM", 2, ids));
            }
            case "HARD" -> {
                ids.addAll(repository.pickRandomProblemIds("MEDIUM", 2, List.of()));
                ids.addAll(repository.pickRandomProblemIds("HARD", 2, ids));
            }
            default -> {
            }
        }
        return ids;
    }

    private Map<String, Object> requireVisible(long contestId, int userId) {
        Map<String, Object> contest = repository
                .findContest(contestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contest not found"));
        boolean host = ((Number) contest.get("host_user_id")).intValue() == userId;
        boolean participant = repository.findParticipant(contestId, userId).isPresent();
        if (!host && !participant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Private contest");
        }
        return contest;
    }

    private Map<String, Object> requireHostLobby(long contestId, int userId) {
        Map<String, Object> contest = repository
                .findContest(contestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contest not found"));
        if (((Number) contest.get("host_user_id")).intValue() != userId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Host only");
        }
        if (!"LOBBY".equals(String.valueOf(contest.get("status")))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Contest is not in lobby");
        }
        return contest;
    }

    private void requireJoined(long contestId, int userId) {
        Map<String, Object> p = repository
                .findParticipant(contestId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant"));
        if (!"JOINED".equals(String.valueOf(p.get("status")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Join the lobby first");
        }
    }

    private Map<String, Object> lobbyPayload(long contestId) {
        return Map.of(
                "contestId",
                contestId,
                "participants",
                repository.listParticipants(contestId),
                "joinedCount",
                repository.countJoined(contestId));
    }

    private static String str(Object v, String fallback) {
        if (v == null) {
            return fallback;
        }
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? fallback : s;
    }

    private static int intVal(Object v, int fallback) {
        if (v instanceof Number n) {
            return n.intValue();
        }
        if (v instanceof String s && !s.isBlank()) {
            try {
                return Integer.parseInt(s.trim());
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private static Instant toInstant(Object v) {
        if (v == null) {
            return null;
        }
        if (v instanceof Instant i) {
            return i;
        }
        if (v instanceof java.sql.Timestamp ts) {
            return ts.toInstant();
        }
        if (v instanceof java.util.Date d) {
            return d.toInstant();
        }
        try {
            return Instant.parse(String.valueOf(v));
        } catch (Exception e) {
            return null;
        }
    }
}
