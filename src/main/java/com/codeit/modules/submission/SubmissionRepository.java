package com.codeit.modules.submission;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SubmissionRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public int saveSubmission(
            Submission submission) {

        String sql = """
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
                    VALUES (?, ?, ?, ?, ?, ?, ?,?)
                """;

        return jdbcTemplate.update(
                sql,
                submission.getUserId(),
                submission.getProblemId(),
                submission.getLanguage(),
                submission.getCode(),
                submission.getVerdict(),
                submission.getExecutionTime(),
                submission.getCompetitionId(),
                submission.getMemoryUsed());
    }

    public List<Submission> getUserSubmissions(Integer userId) {

        String sql = """
                    SELECT *
                    FROM submissions
                    WHERE user_id = ?
                    ORDER BY id DESC
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
                    ORDER BY id DESC
                """;

        return jdbcTemplate.query(
                sql,
                new SubmissionRowMapper(),
                problemId);
    }
}