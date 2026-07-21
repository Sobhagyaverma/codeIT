package com.codeit.modules.profile;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.problems.ProblemRepository;
import com.codeit.modules.profile.dto.ChangePasswordRequest;
import com.codeit.modules.profile.dto.ProblemSummaryDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO;
import com.codeit.modules.profile.dto.ProfileSubmissionsPageDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.ActiveContestDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.ActivityBucketDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.ActivityDayDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.ContestHistoryDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.DifficultyDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.FastestAcceptedDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.HardestSolvedDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.IdentityDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.LanguageUsageDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.PersonalBestsDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.StatsDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.TopicProgressDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.TotalAvailableDTO;
import com.codeit.modules.profile.dto.UpdateProfileRequest;
import com.codeit.modules.user.User;
import com.codeit.modules.user.UserRepository;
import com.codeit.modules.user.UserService;

@Service
public class ProfileService {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public ProfileResponseDTO getMyProfile(Integer userId) {
        User user = userService.getUserById(userId);
        return buildProfile(user, true);
    }

    public ProfileResponseDTO getPublicProfile(String username) {
        User user = userService.getUserByUniqueUserId(username);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return buildProfile(user, false);
    }

    public User updateMyProfile(Integer userId, UpdateProfileRequest request) {
        User existing = userService.getUserById(userId);

        String bio = request.getBio();
        String location = request.getLocation();
        String avatarUrl = request.getAvatarUrl();
        boolean showEmail = request.getShowEmail() != null
                ? request.getShowEmail()
                : Boolean.TRUE.equals(existing.getShowEmail());

        int updated = userRepository.updateProfile(
                userId,
                bio,
                location,
                avatarUrl,
                showEmail);

        if (updated <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to update profile");
        }

        return userService.getUserById(userId);
    }

    public void changePassword(Integer userId, ChangePasswordRequest request) {
        User existing = userService.getUserById(userId);

        boolean currentOk = passwordEncoder.matches(
                request.getCurrentPassword(),
                existing.getPassword());

        if (!currentOk) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current password is incorrect");
        }

        String newHash = passwordEncoder.encode(request.getNewPassword());
        int updated = userRepository.updatePassword(userId, newHash);

        if (updated <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to update password");
        }
    }

    public List<ProblemSummaryDTO> getMyBookmarks(Integer userId) {
        return profileRepository.getBookmarks(userId);
    }

    public void addBookmark(Integer userId, Integer problemId) {
        requireProblemExists(problemId);
        profileRepository.addBookmark(userId, problemId);
    }

    public void removeBookmark(Integer userId, Integer problemId) {
        profileRepository.removeBookmark(userId, problemId);
    }

    public void recordRecentView(Integer userId, Integer problemId) {
        requireProblemExists(problemId);
        profileRepository.upsertRecentView(userId, problemId);
    }

    public List<ProblemSummaryDTO> getMyRecentViews(Integer userId) {
        return profileRepository.getRecentViews(userId, 20);
    }

    public ProfileSubmissionsPageDTO getMySubmissions(
            Integer userId,
            int requestedLimit,
            Integer cursor) {
        int limit = Math.max(1, Math.min(requestedLimit, 100));
        List<ProfileResponseDTO.SubmissionRowDTO> rows =
                profileRepository.getSubmissionPage(userId, limit + 1, cursor);

        boolean hasMore = rows.size() > limit;
        if (hasMore) {
            rows = new ArrayList<>(rows.subList(0, limit));
        }

        Integer nextCursor = hasMore && !rows.isEmpty()
                ? rows.get(rows.size() - 1).getId()
                : null;
        return new ProfileSubmissionsPageDTO(rows, nextCursor);
    }

    public List<ContestHistoryDTO> getMyContests(Integer userId) {
        return buildContestHistory(userId);
    }

    private ProfileResponseDTO buildProfile(User user, boolean includePrivate) {
        Integer userId = Integer.parseInt(user.getId());

        ProfileResponseDTO response = new ProfileResponseDTO();
        response.setIdentity(toIdentity(user, includePrivate));
        response.setStats(buildStats(userId));
        response.setTopics(buildTopics(userId));
        response.setLanguages(buildLanguages(userId));
        response.setHeatmap(profileRepository.getHeatmap(userId));
        response.setWeeklyActivity(buildWeeklyActivity(response.getHeatmap()));
        response.setMonthlyActivity(buildMonthlyActivity(response.getHeatmap()));
        response.setRecentSubmissions(profileRepository.getRecentSubmissionRows(userId, 20));
        response.setRecentSolved(profileRepository.getRecentSolved(userId, 10));
        response.setContestHistory(buildContestHistory(userId));
        response.setAchievements(List.of());
        response.setPersonalBests(buildPersonalBests(userId));
        response.setActiveContest(buildActiveContest(userId));
        response.setContinueProblem(buildContinueProblem(userId));

        if (includePrivate) {
            response.setBookmarked(profileRepository.getBookmarks(userId));
            response.setRecentlyViewed(profileRepository.getRecentViews(userId, 20));
        } else {
            response.setBookmarked(List.of());
            response.setRecentlyViewed(List.of());
        }

        return response;
    }

    private IdentityDTO toIdentity(User user, boolean includePrivate) {
        IdentityDTO identity = new IdentityDTO();
        identity.setId(Integer.parseInt(user.getId()));
        identity.setName(user.getName());
        identity.setUsername(user.getUniqueUserId());
        identity.setRole(user.getRole());
        identity.setBio(user.getBio());
        identity.setLocation(user.getLocation());
        identity.setAvatarUrl(user.getAvatarUrl());
        identity.setShowEmail(Boolean.TRUE.equals(user.getShowEmail()));
        identity.setJoinedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);

        boolean showEmail = includePrivate || Boolean.TRUE.equals(user.getShowEmail());
        identity.setEmail(showEmail ? user.getEmail() : null);
        return identity;
    }

    private StatsDTO buildStats(Integer userId) {
        int totalSubmissions = profileRepository.countSubmissions(userId);
        int accepted = profileRepository.countAcceptedSubmissions(userId);
        int totalSolved = profileRepository.countDistinctSolved(userId);
        double acceptanceRate = totalSubmissions == 0
                ? 0.0
                : (accepted * 100.0) / totalSubmissions;

        Map<String, Integer> solvedByDiff = profileRepository.countSolvedByDifficulty(userId);
        Map<String, Integer> availableByDiff = profileRepository.countProblemsByDifficulty();

        DifficultyDTO difficulty = new DifficultyDTO(
                solvedByDiff.getOrDefault("EASY", 0),
                solvedByDiff.getOrDefault("MEDIUM", 0),
                solvedByDiff.getOrDefault("HARD", 0),
                new TotalAvailableDTO(
                        availableByDiff.getOrDefault("EASY", 0),
                        availableByDiff.getOrDefault("MEDIUM", 0),
                        availableByDiff.getOrDefault("HARD", 0)));

        int[] streaks = computeStreaks(profileRepository.getSubmissionDaysUtc(userId));

        List<ContestHistoryDTO> contests = buildContestHistory(userId);
        Integer bestRank = contests.stream()
                .map(ContestHistoryDTO::getRank)
                .filter(r -> r != null)
                .min(Integer::compareTo)
                .orElse(null);

        StatsDTO stats = new StatsDTO();
        stats.setTotalSolved(totalSolved);
        stats.setTotalSubmissions(totalSubmissions);
        stats.setAcceptanceRate(Math.round(acceptanceRate * 100.0) / 100.0);
        stats.setTotalRuntimeSeconds(profileRepository.sumRuntimeSeconds(userId));
        stats.setDifficulty(difficulty);
        stats.setCurrentStreak(streaks[0]);
        stats.setLongestStreak(streaks[1]);
        stats.setContestBestRank(bestRank);
        stats.setRating(null);
        return stats;
    }

    private int[] computeStreaks(List<LocalDate> submissionDays) {
        Set<LocalDate> days = submissionDays.stream()
                .filter(d -> d != null)
                .collect(Collectors.toCollection(TreeSet::new));

        if (days.isEmpty()) {
            return new int[] { 0, 0 };
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate cursor = days.contains(today) ? today : today.minusDays(1);

        int current = 0;
        if (days.contains(cursor)) {
            while (days.contains(cursor)) {
                current++;
                cursor = cursor.minusDays(1);
            }
        }

        int longest = 0;
        int run = 0;
        LocalDate prev = null;
        for (LocalDate day : days) {
            if (prev != null && day.equals(prev.plusDays(1))) {
                run++;
            } else {
                run = 1;
            }
            longest = Math.max(longest, run);
            prev = day;
        }

        return new int[] { current, longest };
    }

    private List<TopicProgressDTO> buildTopics(Integer userId) {
        Map<String, Integer> solved = new HashMap<>();
        for (Map<String, Object> row : profileRepository.getAcceptedProblemTopics(userId)) {
            for (String topic : profileRepository.parseTopicsPublic((String) row.get("topics"))) {
                solved.merge(topic, 1, Integer::sum);
            }
        }

        Map<String, Integer> totals = new HashMap<>();
        for (Map<String, Object> row : profileRepository.getAllProblemTopics()) {
            for (String topic : profileRepository.parseTopicsPublic((String) row.get("topics"))) {
                totals.merge(topic, 1, Integer::sum);
            }
        }

        List<TopicProgressDTO> result = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : totals.entrySet()) {
            result.add(new TopicProgressDTO(
                    entry.getKey(),
                    solved.getOrDefault(entry.getKey(), 0),
                    entry.getValue()));
        }

        result.sort(Comparator
                .comparingInt(TopicProgressDTO::getSolved).reversed()
                .thenComparing(TopicProgressDTO::getTopic));
        return result;
    }

    private List<LanguageUsageDTO> buildLanguages(Integer userId) {
        List<LanguageUsageDTO> languages = profileRepository.getLanguageUsage(userId);
        int total = languages.stream().mapToInt(LanguageUsageDTO::getCount).sum();
        for (LanguageUsageDTO language : languages) {
            double percent = total == 0 ? 0.0 : (language.getCount() * 100.0) / total;
            language.setPercent(Math.round(percent * 100.0) / 100.0);
        }
        return languages;
    }

    private List<ActivityBucketDTO> buildWeeklyActivity(List<ActivityDayDTO> heatmap) {
        Map<String, Integer> buckets = new LinkedHashMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d");

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            buckets.put(day.format(fmt), 0);
        }

        for (ActivityDayDTO day : heatmap) {
            LocalDate date = LocalDate.parse(day.getDate());
            String label = date.format(fmt);
            if (buckets.containsKey(label)) {
                buckets.put(label, buckets.get(label) + day.getCount());
            }
        }

        List<ActivityBucketDTO> result = new ArrayList<>();
        buckets.forEach((label, count) -> result.add(new ActivityBucketDTO(label, count)));
        return result;
    }

    private List<ActivityBucketDTO> buildMonthlyActivity(List<ActivityDayDTO> heatmap) {
        Map<String, Integer> buckets = new LinkedHashMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM");

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (int i = 5; i >= 0; i--) {
            LocalDate month = today.minusMonths(i).withDayOfMonth(1);
            buckets.put(month.format(fmt), 0);
        }

        for (ActivityDayDTO day : heatmap) {
            LocalDate date = LocalDate.parse(day.getDate());
            String label = date.format(fmt);
            if (buckets.containsKey(label)) {
                buckets.put(label, buckets.get(label) + day.getCount());
            }
        }

        List<ActivityBucketDTO> result = new ArrayList<>();
        buckets.forEach((label, count) -> result.add(new ActivityBucketDTO(label, count)));
        return result;
    }

    private List<ContestHistoryDTO> buildContestHistory(Integer userId) {
        List<ContestHistoryDTO> history = profileRepository.getContestHistory(userId);
        for (ContestHistoryDTO row : history) {
            Integer rank = profileRepository.findLeaderboardRank(row.getCompetitionId(), userId);
            row.setRank(rank);
        }
        return history;
    }

    private PersonalBestsDTO buildPersonalBests(Integer userId) {
        Map<String, Object> fastest = profileRepository.getFastestAccepted(userId);
        Map<String, Object> hardest = profileRepository.getHardestSolved(userId);

        FastestAcceptedDTO fastestDto = null;
        if (fastest != null) {
            Object runtime = fastest.get("runtime");
            fastestDto = new FastestAcceptedDTO(
                    (String) fastest.get("title"),
                    runtime == null ? null : ((Number) runtime).doubleValue(),
                    (String) fastest.get("language"));
        }

        HardestSolvedDTO hardestDto = null;
        if (hardest != null) {
            hardestDto = new HardestSolvedDTO(
                    (String) hardest.get("title"),
                    (String) hardest.get("difficulty"));
        }

        return new PersonalBestsDTO(fastestDto, hardestDto);
    }

    private ActiveContestDTO buildActiveContest(Integer userId) {
        Map<String, Object> row = profileRepository.getActiveContestForUser(userId);
        if (row == null) {
            return null;
        }
        return new ActiveContestDTO(
                (Integer) row.get("id"),
                (String) row.get("title"),
                (String) row.get("status"));
    }

    private ProblemSummaryDTO buildContinueProblem(Integer userId) {
        List<ProblemSummaryDTO> recentViews = profileRepository.getRecentViews(userId, 1);
        if (!recentViews.isEmpty()) {
            return recentViews.get(0);
        }
        List<ProblemSummaryDTO> recentSolved = profileRepository.getRecentSolved(userId, 1);
        return recentSolved.isEmpty() ? null : recentSolved.get(0);
    }

    private void requireProblemExists(Integer problemId) {
        if (!problemRepository.existsById(problemId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }
    }

}