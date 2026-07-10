package com.codeit.modules.submission;

import org.springframework.jdbc.core.RowMapper;

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
                rs.getString("status")
        );

        submission.setExecutionTime(
                (double) rs.getFloat("runtime")
        );

        submission.setMemoryUsed(
                (int) rs.getFloat("memory")
        );
        submission.setCompetitionId((Integer) rs.getObject("competition_id"));
        return submission;
    }
}