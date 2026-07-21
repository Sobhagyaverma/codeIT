package com.codeit.modules.profile.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponseDTO {

    private IdentityDTO identity;
    private StatsDTO stats;
    private List<TopicProgressDTO> topics = new ArrayList<>();
    private List<LanguageUsageDTO> languages = new ArrayList<>();
    private List<ActivityDayDTO> heatmap = new ArrayList<>();
    private List<ActivityBucketDTO> weeklyActivity = new ArrayList<>();
    private List<ActivityBucketDTO> monthlyActivity = new ArrayList<>();
    private List<SubmissionRowDTO> recentSubmissions = new ArrayList<>();
    private List<ProblemSummaryDTO> recentSolved = new ArrayList<>();
    private List<ContestHistoryDTO> contestHistory = new ArrayList<>();
    private List<ProblemSummaryDTO> bookmarked = new ArrayList<>();
    private List<ProblemSummaryDTO> recentlyViewed = new ArrayList<>();
    private List<Object> achievements = new ArrayList<>();
    private PersonalBestsDTO personalBests;
    private ActiveContestDTO activeContest;
    private ProblemSummaryDTO continueProblem;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IdentityDTO {
        private Integer id;
        private String name;
        private String username;
        private String email;
        private String role;
        private String bio;
        private String location;
        private String avatarUrl;
        private Boolean showEmail;
        private String joinedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsDTO {
        private int totalSolved;
        private int totalSubmissions;
        private double acceptanceRate;
        private double totalRuntimeSeconds;
        private DifficultyDTO difficulty;
        private int currentStreak;
        private int longestStreak;
        private Integer contestBestRank;
        private Integer rating;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DifficultyDTO {
        private int easy;
        private int medium;
        private int hard;
        private TotalAvailableDTO totalAvailable;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TotalAvailableDTO {
        private int easy;
        private int medium;
        private int hard;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopicProgressDTO {
        private String topic;
        private int solved;
        private int total;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LanguageUsageDTO {
        private String language;
        private int count;
        private double percent;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityDayDTO {
        private String date;
        private int count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityBucketDTO {
        private String label;
        private int count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmissionRowDTO {
        private Integer id;
        private Integer problemId;
        private String problemTitle;
        private String difficulty;
        private String verdict;
        private String language;
        private Double runtime;
        private Integer memory;
        private String submittedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContestHistoryDTO {
        private Integer competitionId;
        private String title;
        private Integer rank;
        private int solved;
        private Double score;
        private String date;
        private Integer ratingDelta;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonalBestsDTO {
        private FastestAcceptedDTO fastestAccepted;
        private HardestSolvedDTO hardestSolved;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FastestAcceptedDTO {
        private String problemTitle;
        private Double runtime;
        private String language;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HardestSolvedDTO {
        private String problemTitle;
        private String difficulty;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActiveContestDTO {
        private Integer id;
        private String title;
        private String status;
    }
}