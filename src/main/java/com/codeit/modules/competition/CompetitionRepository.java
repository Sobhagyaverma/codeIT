package com.codeit.modules.competition;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CompetitionRepository {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public int createCompetition(Competition competition) {
        String sql = """
                INSERT INTO competitions ( title , description ,start_time , end_time , created_by , status)
                VALUES(?,?,?,?,?,?)
                """;
        try {
            int result = jdbcTemplate.update(
                    sql,
                    competition.getTitle(),
                    competition.getDescription(),
                    competition.getStartTime(),
                    competition.getEndTime(),
                    competition.getCreatedBy(),
                    competition.getStatus());
            return result;
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return 0;
        }
    }

    public List<Competition> getAllCompetitions() {
        String sql = """
                SELECT * FROM competitions;
                """;
        try {
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                Competition competition = new Competition();
                competition.setId(rs.getInt("id"));
                competition.setTitle(rs.getString("title"));
                competition.setDescription(rs.getString("description"));
                competition.setStartTime(rs.getTimestamp("start_time"));
                competition.setEndTime(rs.getTimestamp("end_time"));
                competition.setCreatedBy(rs.getInt("created_by"));
                competition.setStatus(rs.getString("status"));
                return competition;
            });
        } catch (DataAccessException e) {
            throw new RuntimeException("Failed to fetch users", e);
        }
    }

    public Competition getCompetitionById(Integer id) {
        String sql = """
                SELECT * FROM competitions WHERE id = ?
                """;
        try {
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
                Competition competition = new Competition();
                competition.setId(rs.getInt("id"));
                competition.setTitle(rs.getString("title"));
                competition.setDescription(rs.getString("description"));
                competition.setStartTime(rs.getTimestamp("start_time"));
                competition.setEndTime(rs.getTimestamp("end_time"));
                competition.setCreatedBy(rs.getInt("created_by"));
                competition.setStatus(rs.getString("status"));
                return competition;

            }, id);
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return null;
        }
    }

    public int addProblemsToCompetitions(Integer competitionId, Integer problemId) {
        String sql = """
                INSERT INTO competition_problems(competition_id, problem_id)
                VALUES (?, ?)
                ON CONFLICT DO NOTHING
                """;
        try {
            return jdbcTemplate.update(sql, competitionId, problemId);
        } catch (DataAccessException e) {
            throw new RuntimeException("Failed to add problem to competition", e);
        }
    }

    public List<Integer> getCompetitionProblems(Integer competitionId) {
        String sql = """
                SELECT problem_id
                FROM competition_problems
                WHERE competition_id = ?
                """;

        return jdbcTemplate.queryForList(sql, Integer.class, competitionId);
    }

    public int joinCompetition(Integer competitionId, Integer userId) {
        String sql = """
                INSERT INTO competition_participants(competition_id,user_id)
                VALUES (?, ?)
                """;
        return jdbcTemplate.update(sql, competitionId, userId);
    }

    public Integer alreadyJoined(Integer competitionId, Integer userId) {
        String sql = """
                SELECT COUNT (*) FROM competition_participants
                WHERE competition_id = ?
                AND user_id = ?
                """;

        return jdbcTemplate.queryForObject(sql, Integer.class, competitionId, userId);
    }

    public List<Integer> getParticipants(Integer competitionId){
        String sql = """
                SELECT user_id
                FROM competition_participants
                WHERE competition_id = ? 
                """;
        return jdbcTemplate.queryForList(sql,Integer.class,competitionId);
    }

}
