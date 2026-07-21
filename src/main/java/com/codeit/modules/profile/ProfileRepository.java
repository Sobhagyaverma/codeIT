package com.codeit.modules.profile;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.codeit.modules.profile.dto.ProblemSummaryDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.ActivityDayDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.ContestHistoryDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.LanguageUsageDTO;
import com.codeit.modules.profile.dto.ProfileResponseDTO.SubmissionRowDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Repository
public class ProfileRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    public List<ProblemSummaryDTO> getBookmarks(Integer userId) {
        String sql = """
                SELECT p.id, p.title, p.difficulty, p.topics
                FROM user_problem_bookmarks b
                JOIN problems p ON p.id = b.problem_id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> mapProblemSummary(rs), userId);
    }

    public int addBookmark(Integer userId, Integer problemId) {
        String sql = """
                INSERT INTO user_problem_bookmarks (user_id, problem_id)
                VALUES (?, ?)
                ON CONFLICT DO NOTHING
                """;
        return jdbcTemplate.update(sql, userId, problemId);
    }

    public int removeBookmark(Integer userId, Integer problemId) {
        String sql = """
                DELETE FROM user_problem_bookmarks
                WHERE user_id = ?
                  AND problem_id = ?
                """;
        return jdbcTemplate.update(sql, userId, problemId);
    }

    public int upsertRecentView(Integer userId, Integer problemId) {
        String sql = """
                INSERT INTO user_problem_recent_views (
                    user_id, problem_id, last_viewed_at, view_count
                )
                VALUES (?, ?, NOW(), 1)
                ON CONFLICT (user_id, problem_id)
                DO UPDATE SET
                    last_viewed_at = NOW(),
                    view_count = user_problem_recent_views.view_count + 1
                """;
        return jdbcTemplate.update(sql, userId, problemId);
    }

    public List<ProblemSummaryDTO> getRecentViews(Integer userId, int limit) {
        String sql = """
                SELECT p.id, p.title, p.difficulty, p.topics
                FROM user_problem_recent_views v
                JOIN problems p ON p.id = v.problem_id
                WHERE v.user_id = ?
                ORDER BY v.last_viewed_at DESC
                LIMIT ?
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> mapProblemSummary(rs), userId, limit);
    }

    public int countSubmissions(Integer userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM submissions WHERE user_id = ?",
                Integer.class,
                userId);
        return count != null ? count : 0;
    }

    public int countAcceptedSubmissions(Integer userId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM submissions
                WHERE user_id = ?
                  AND status = 'Accepted'
                """,
                Integer.class,
                userId);
        return count != null ? count : 0;
    }

    public int countDistinctSolved(Integer userId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(DISTINCT problem_id)
                FROM submissions
                WHERE user_id = ?
                  AND status = 'Accepted'
                """,
                Integer.class,
                userId);
        return count != null ? count : 0;
    }

    public double sumRuntimeSeconds(Integer userId) {
        Double sum = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(SUM(runtime), 0)
                FROM submissions
                WHERE user_id = ?
                  AND runtime IS NOT NULL
                """,
                Double.class,
                userId);
        return sum != null ? sum : 0.0;
    }

    public Map<String, Integer> countSolvedByDifficulty(Integer userId) {
        String sql = """
                SELECT UPPER(p.difficulty) AS difficulty, COUNT(DISTINCT s.problem_id) AS solved
                FROM submissions s
                JOIN problems p ON p.id = s.problem_id
                WHERE s.user_id = ?
                  AND s.status = 'Accepted'
                GROUP BY UPPER(p.difficulty)
                """;

        Map<String, Integer> result = new HashMap<>();
        jdbcTemplate.query(sql, rs -> {
            result.put(rs.getString("difficulty"), rs.getInt("solved"));
        }, userId);
        return result;
    }

    public Map<String, Integer> countProblemsByDifficulty() {
        String sql = """
                SELECT UPPER(difficulty) AS difficulty, COUNT(*) AS total
                FROM problems
                GROUP BY UPPER(difficulty)
                """;

        Map<String, Integer> result = new HashMap<>();
        jdbcTemplate.query(sql, rs -> {
            result.put(rs.getString("difficulty"), rs.getInt("total"));
        });
        return result;
    }

    public List<LanguageUsageDTO> getLanguageUsage(Integer userId) {
        String sql = """
                SELECT language, COUNT(*) AS count
                FROM submissions
                WHERE user_id = ?
                GROUP BY language
                ORDER BY count DESC, language ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            LanguageUsageDTO dto = new LanguageUsageDTO();
            dto.setLanguage(rs.getString("language"));
            dto.setCount(rs.getInt("count"));
            dto.setPercent(0);
            return dto;
        }, userId);
    }

    public List<ActivityDayDTO> getHeatmap(Integer userId) {
        String sql = """
                SELECT TO_CHAR(
                           created_at AT TIME ZONE current_setting('TIMEZONE')
                                      AT TIME ZONE 'UTC',
                           'YYYY-MM-DD'
                       ) AS day,
                       COUNT(*) AS count
                FROM submissions
                WHERE user_id = ?
                  AND created_at IS NOT NULL
                GROUP BY day
                ORDER BY day ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            ActivityDayDTO dto = new ActivityDayDTO();
            dto.setDate(rs.getString("day"));
            dto.setCount(rs.getInt("count"));
            return dto;
        }, userId);
    }

    public List<LocalDate> getSubmissionDaysUtc(Integer userId) {
        String sql = """
                SELECT DISTINCT
                       (created_at AT TIME ZONE current_setting('TIMEZONE')
                                   AT TIME ZONE 'UTC')::date AS day
                FROM submissions
                WHERE user_id = ?
                  AND created_at IS NOT NULL
                ORDER BY day DESC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> rs.getObject("day", LocalDate.class),
                userId);
    }

    public List<SubmissionRowDTO> getRecentSubmissionRows(Integer userId, int limit) {
        String sql = """
                SELECT s.id,
                       s.problem_id,
                       p.title,
                       p.difficulty,
                       s.status,
                       s.language,
                       s.runtime,
                       s.memory,
                       s.created_at
                FROM submissions s
                JOIN problems p ON p.id = s.problem_id
                WHERE s.user_id = ?
                ORDER BY s.created_at DESC NULLS LAST, s.id DESC
                LIMIT ?
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> mapSubmissionRow(rs), userId, limit);
    }

    public List<SubmissionRowDTO> getSubmissionPage(
            Integer userId,
            int limit,
            Integer cursor) {
        String sql = """
                SELECT s.id,
                       s.problem_id,
                       p.title,
                       p.difficulty,
                       s.status,
                       s.language,
                       s.runtime,
                       s.memory,
                       s.created_at
                FROM submissions s
                JOIN problems p ON p.id = s.problem_id
                WHERE s.user_id = ?
                  AND (?::integer IS NULL OR s.id < ?)
                ORDER BY s.id DESC
                LIMIT ?
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapSubmissionRow(rs),
                userId,
                cursor,
                cursor,
                limit);
    }

    public List<ProblemSummaryDTO> getRecentSolved(Integer userId, int limit) {
        String sql = """
                SELECT p.id, p.title, p.difficulty, p.topics
                FROM (
                    SELECT problem_id, MAX(created_at) AS solved_at
                    FROM submissions
                    WHERE user_id = ?
                      AND status = 'Accepted'
                    GROUP BY problem_id
                ) solved
                JOIN problems p ON p.id = solved.problem_id
                ORDER BY solved.solved_at DESC NULLS LAST
                LIMIT ?
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> mapProblemSummary(rs), userId, limit);
    }

    public List<Map<String, Object>> getAcceptedProblemTopics(Integer userId) {
        String sql = """
                SELECT DISTINCT p.id, p.topics
                FROM submissions s
                JOIN problems p ON p.id = s.problem_id
                WHERE s.user_id = ?
                  AND s.status = 'Accepted'
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", rs.getInt("id"));
            row.put("topics", rs.getString("topics"));
            return row;
        }, userId);
    }

    public List<Map<String, Object>> getAllProblemTopics() {
        String sql = "SELECT id, topics FROM problems";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", rs.getInt("id"));
            row.put("topics", rs.getString("topics"));
            return row;
        });
    }

    public Map<String, Object> getFastestAccepted(Integer userId) {
        String sql = """
                SELECT p.title, s.runtime, s.language
                FROM submissions s
                JOIN problems p ON p.id = s.problem_id
                WHERE s.user_id = ?
                  AND s.status = 'Accepted'
                  AND s.runtime IS NOT NULL
                ORDER BY s.runtime ASC, s.id ASC
                LIMIT 1
                """;

        List<Map<String, Object>> rows = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("title", rs.getString("title"));
            row.put("runtime", rs.getObject("runtime"));
            row.put("language", rs.getString("language"));
            return row;
        }, userId);

        return rows.isEmpty() ? null : rows.get(0);
    }

    public Map<String, Object> getHardestSolved(Integer userId) {
        String sql = """
                SELECT p.title, UPPER(p.difficulty) AS difficulty
                FROM submissions s
                JOIN problems p ON p.id = s.problem_id
                WHERE s.user_id = ?
                  AND s.status = 'Accepted'
                ORDER BY
                    CASE UPPER(p.difficulty)
                        WHEN 'HARD' THEN 3
                        WHEN 'MEDIUM' THEN 2
                        WHEN 'EASY' THEN 1
                        ELSE 0
                    END DESC,
                    s.created_at DESC NULLS LAST
                LIMIT 1
                """;

        List<Map<String, Object>> rows = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("title", rs.getString("title"));
            row.put("difficulty", rs.getString("difficulty"));
            return row;
        }, userId);

        return rows.isEmpty() ? null : rows.get(0);
    }

    public List<ContestHistoryDTO> getContestHistory(Integer userId) {
        String sql = """
                SELECT
                    c.id AS competition_id,
                    c.title,
                    c.end_time,
                    COALESCE(solved.solved_count, 0) AS solved,
                    solved.total_time AS score
                FROM competition_participants cp
                JOIN competitions c ON c.id = cp.competition_id
                LEFT JOIN (
                    SELECT competition_id,
                           COUNT(DISTINCT problem_id) AS solved_count,
                           COALESCE(SUM(runtime), 0) AS total_time
                    FROM submissions
                    WHERE user_id = ?
                      AND status = 'Accepted'
                      AND competition_id IS NOT NULL
                    GROUP BY competition_id
                ) solved ON solved.competition_id = c.id
                WHERE cp.user_id = ?
                ORDER BY c.end_time DESC NULLS LAST, c.id DESC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            ContestHistoryDTO dto = new ContestHistoryDTO();
            dto.setCompetitionId(rs.getInt("competition_id"));
            dto.setTitle(rs.getString("title"));
            dto.setSolved(rs.getInt("solved"));

            Object score = rs.getObject("score");
            dto.setScore(score == null ? null : ((Number) score).doubleValue());

            Timestamp endTime = rs.getTimestamp("end_time");
            dto.setDate(endTime != null ? endTime.toInstant().toString() : null);

            // Rank is filled later in ProfileService from live leaderboard.
            dto.setRank(null);
            dto.setRatingDelta(null);
            return dto;
        }, userId, userId);
    }

    public Integer findLeaderboardRank(Integer competitionId, Integer userId) {
        String sql = """
                SELECT ranked.rank
                FROM (
                    SELECT
                        cp.user_id,
                        RANK() OVER (
                            ORDER BY COUNT(DISTINCT s.problem_id) DESC,
                                     COALESCE(SUM(s.runtime), 0) ASC
                        ) AS rank
                    FROM competition_participants cp
                    LEFT JOIN submissions s
                      ON s.competition_id = cp.competition_id
                     AND s.user_id = cp.user_id
                     AND s.status = 'Accepted'
                    WHERE cp.competition_id = ?
                    GROUP BY cp.user_id
                ) ranked
                WHERE ranked.user_id = ?
                """;

        List<Integer> ranks = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> rs.getInt("rank"),
                competitionId,
                userId);

        return ranks.isEmpty() ? null : ranks.get(0);
    }

    public Map<String, Object> getActiveContestForUser(Integer userId) {
        String sql = """
                SELECT c.id, c.title, c.status
                FROM competition_participants cp
                JOIN competitions c ON c.id = cp.competition_id
                WHERE cp.user_id = ?
                  AND c.status = 'ACTIVE'
                ORDER BY c.start_time DESC NULLS LAST, c.id DESC
                LIMIT 1
                """;

        List<Map<String, Object>> rows = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", rs.getInt("id"));
            row.put("title", rs.getString("title"));
            row.put("status", rs.getString("status"));
            return row;
        }, userId);

        return rows.isEmpty() ? null : rows.get(0);
    }

    private SubmissionRowDTO mapSubmissionRow(ResultSet rs) throws SQLException {
        SubmissionRowDTO dto = new SubmissionRowDTO();
        dto.setId(rs.getInt("id"));
        dto.setProblemId(rs.getInt("problem_id"));
        dto.setProblemTitle(rs.getString("title"));
        dto.setDifficulty(rs.getString("difficulty"));
        dto.setVerdict(rs.getString("status"));
        dto.setLanguage(rs.getString("language"));

        Object runtime = rs.getObject("runtime");
        dto.setRuntime(runtime == null ? null : ((Number) runtime).doubleValue());

        Object memory = rs.getObject("memory");
        dto.setMemory(memory == null ? null : ((Number) memory).intValue());

        Timestamp createdAt = rs.getTimestamp("created_at");
        dto.setSubmittedAt(createdAt != null ? createdAt.toInstant().toString() : null);
        return dto;
    }

    private ProblemSummaryDTO mapProblemSummary(ResultSet rs) throws SQLException {
        ProblemSummaryDTO dto = new ProblemSummaryDTO();
        dto.setId(rs.getInt("id"));
        dto.setTitle(rs.getString("title"));
        dto.setDifficulty(rs.getString("difficulty"));
        dto.setTopics(parseTopics(rs.getString("topics")));
        return dto;
    }

    public List<String> parseTopicsPublic(String topicsJson) {
        return parseTopics(topicsJson);
    }

    private List<String> parseTopics(String topicsJson) {
        if (topicsJson == null || topicsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(topicsJson, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }
}