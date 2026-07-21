package com.codeit.modules.submission;

import java.sql.Timestamp;
import java.time.Instant;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.codeit.modules.submission.dto.JudgeVerdictDTO;

@Repository
public class SubmissionDiagnosticRepository {

    private final JdbcTemplate jdbcTemplate;

    public SubmissionDiagnosticRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(Integer submissionId, JudgeVerdictDTO verdict, String compileOutput, String stderrSummary) {
        jdbcTemplate.update(
                """
                INSERT INTO submission_diagnostics (
                    submission_id, verdict, passed_count, total_count, failed_index,
                    compile_output, stderr_summary, judge_engine, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (submission_id) DO UPDATE SET
                    verdict = EXCLUDED.verdict,
                    passed_count = EXCLUDED.passed_count,
                    total_count = EXCLUDED.total_count,
                    failed_index = EXCLUDED.failed_index,
                    compile_output = EXCLUDED.compile_output,
                    stderr_summary = EXCLUDED.stderr_summary,
                    judge_engine = EXCLUDED.judge_engine
                """,
                submissionId,
                verdict.getVerdict(),
                verdict.getPassedCount(),
                verdict.getTotalCount(),
                verdict.getFailedTestIndex(),
                compileOutput,
                stderrSummary,
                verdict.getEngine(),
                Timestamp.from(Instant.now()));
    }

    public SubmissionDiagnostic findBySubmissionId(Integer submissionId) {
        return jdbcTemplate.query(
                """
                SELECT submission_id, verdict, passed_count, total_count, failed_index,
                       compile_output, stderr_summary, judge_engine
                FROM submission_diagnostics
                WHERE submission_id = ?
                """,
                rs -> {
                    if (!rs.next()) {
                        return null;
                    }
                    SubmissionDiagnostic d = new SubmissionDiagnostic();
                    d.setSubmissionId(rs.getInt("submission_id"));
                    d.setVerdict(rs.getString("verdict"));
                    d.setPassedCount(rs.getInt("passed_count"));
                    d.setTotalCount(rs.getInt("total_count"));
                    int failed = rs.getInt("failed_index");
                    d.setFailedIndex(rs.wasNull() ? null : failed);
                    d.setCompileOutput(rs.getString("compile_output"));
                    d.setStderrSummary(rs.getString("stderr_summary"));
                    d.setJudgeEngine(rs.getString("judge_engine"));
                    return d;
                },
                submissionId);
    }
}
