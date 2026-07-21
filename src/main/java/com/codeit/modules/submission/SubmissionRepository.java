package com.codeit.modules.submission;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SubmissionRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public Integer saveSubmission(Submission submission) {
        Integer id = jdbcTemplate.queryForObject(
                """
                        INSERT INTO submissions
                        (
                            user_id,
                            problem_id,
                            language,
                            code,
                            status,
                            runtime,
                            competition_id,
                            memory
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Integer.class,
                submission.getUserId(),
                submission.getProblemId(),
                submission.getLanguage(),
                submission.getCode(),
                submission.getVerdict(),
                submission.getExecutionTime(),
                submission.getCompetitionId(),
                submission.getMemoryUsed());
        if (id == null) {
            throw new IllegalStateException("Failed to persist submission id");
        }
        submission.setId(id);
        return id;
    }

    public Submission getById(Integer id) {
        List<Submission> rows = jdbcTemplate.query(
                "SELECT * FROM submissions WHERE id = ?",
                new SubmissionRowMapper(),
                id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public boolean hasAccepted(Integer userId, Integer problemId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*) FROM submissions
                        WHERE user_id = ? AND problem_id = ? AND status = 'Accepted'
                          AND competition_id IS NULL
                        """,
                Integer.class,
                userId,
                problemId);
        return count != null && count > 0;
    }

    public List<Submission> getUserSubmissions(Integer userId) {
        String sql = """
                    SELECT *
                    FROM submissions
                    WHERE user_id = ?
                    ORDER BY created_at DESC NULLS LAST, id DESC
                """;

        return jdbcTemplate.query(
                sql,
                new SubmissionRowMapper(),
                userId);
    }

    public List<Submission> getProblemSubmissions(Integer problemId) {
        String sql = """
                    SELECT *
                    FROM submissions
                    WHERE problem_id = ?
                    ORDER BY created_at DESC NULLS LAST, id DESC
                """;

        return jdbcTemplate.query(
                sql,
                new SubmissionRowMapper(),
                problemId);
    }

    public List<Submission> getMyProblemSubmissions(Integer userId, Integer problemId) {
        String sql = """
                    SELECT *
                    FROM submissions
                    WHERE user_id = ? AND problem_id = ?
                    ORDER BY created_at DESC NULLS LAST, id DESC
                """;

        return jdbcTemplate.query(
                sql,
                new SubmissionRowMapper(),
                userId,
                problemId);
    }
}
