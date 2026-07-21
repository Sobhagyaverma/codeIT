package com.codeit.modules.submission;

import org.springframework.jdbc.core.RowMapper;

import java.sql.Timestamp;
import java.sql.ResultSet;
import java.sql.SQLException;

public class SubmissionRowMapper implements RowMapper<Submission> {

        @Override
        public Submission mapRow(ResultSet rs, int rowNum)
                        throws SQLException {

                Submission submission = new Submission();

                submission.setId(rs.getInt("id"));
                submission.setUserId(rs.getInt("user_id"));
                submission.setProblemId(rs.getInt("problem_id"));
                submission.setLanguage(rs.getString("language"));
                submission.setCode(rs.getString("code"));

                submission.setVerdict(
                                rs.getString("status"));

                Number runtime = (Number) rs.getObject("runtime");
                if (runtime != null) {
                        submission.setExecutionTime(runtime.doubleValue());
                } else {
                        submission.setExecutionTime(null);
                }

                Number memory = (Number) rs.getObject("memory");
                if (memory != null) {
                        submission.setMemoryUsed(memory.intValue());
                } else {
                        submission.setMemoryUsed(null);
                }
                submission.setCompetitionId((Integer) rs.getObject("competition_id"));

                Timestamp createdAt = rs.getTimestamp("created_at");
                if (createdAt != null) {
                        submission.setCreatedAt(createdAt.toInstant());
                } else {
                        submission.setCreatedAt(null);
                }
                return submission;
        }
}