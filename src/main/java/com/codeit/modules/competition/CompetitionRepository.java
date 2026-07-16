package com.codeit.modules.competition;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.codeit.modules.competition.dto.LeaderboardEntry;

@Repository
public class CompetitionRepository {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public int createCompetition(Competition competition) {
        String sql = """
                INSERT INTO competitions (title, description, start_time, end_time, created_by, status, duration_minutes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;
        try {
            int durationMinutes = competition.getDurationMinutes() != null
                    ? competition.getDurationMinutes()
                    : 120;
            return jdbcTemplate.update(
                    sql,
                    competition.getTitle(),
                    competition.getDescription(),
                    competition.getStartTime(),
                    competition.getEndTime(),
                    competition.getCreatedBy(),
                    competition.getStatus(),
                    durationMinutes);
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
            return jdbcTemplate.query(sql, (rs, rowNum) -> mapCompetition(rs));
        } catch (DataAccessException e) {
            throw new RuntimeException("Failed to fetch competitions", e);
        }
    }

    public Competition getCompetitionById(Integer id) {
        String sql = """
                SELECT * FROM competitions WHERE id = ?
                """;
        try {
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> mapCompetition(rs), id);
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
                INSERT INTO competition_participants (competition_id, user_id, session_status, joined_at)
                VALUES (?, ?, 'JOINED', NOW())
                """;
        return jdbcTemplate.update(sql, competitionId, userId);
    }

    public Integer alreadyJoined(Integer competitionId, Integer userId) {
        String sql = """
                SELECT COUNT(*) FROM competition_participants
                WHERE competition_id = ?
                AND user_id = ?
                """;

        return jdbcTemplate.queryForObject(sql, Integer.class, competitionId, userId);
    }

    public List<Integer> getParticipants(Integer competitionId) {
        String sql = """
                SELECT user_id
                FROM competition_participants
                WHERE competition_id = ?
                """;
        return jdbcTemplate.queryForList(sql, Integer.class, competitionId);
    }

    public CompetitionParticipant getParticipantSession(Integer competitionId, Integer userId) {
        String sql = """
                SELECT id, competition_id, user_id, joined_at, started_at, session_status
                FROM competition_participants
                WHERE competition_id = ?
                AND user_id = ?
                """;
        try {
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> mapParticipant(rs), competitionId, userId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public int startSession(Integer competitionId, Integer userId) {
        String sql = """
                UPDATE competition_participants
                SET started_at = NOW(), session_status = 'IN_PROGRESS'
                WHERE competition_id = ?
                AND user_id = ?
                AND session_status = 'JOINED'
                """;
        return jdbcTemplate.update(sql, competitionId, userId);
    }

    public int endSession(Integer competitionId, Integer userId) {
        String sql = """
                UPDATE competition_participants
                SET session_status = 'ENDED'
                WHERE competition_id = ?
                AND user_id = ?
                AND session_status = 'IN_PROGRESS'
                """;
        return jdbcTemplate.update(sql, competitionId, userId);
    }

    public List<CompetitionParticipant> findExpiredInProgressSessions() {
        String sql = """
                SELECT cp.id, cp.competition_id, cp.user_id, cp.joined_at, cp.started_at, cp.session_status
                FROM competition_participants cp
                JOIN competitions c ON c.id = cp.competition_id
                WHERE cp.session_status = 'IN_PROGRESS'
                AND NOW() >= LEAST(
                    cp.started_at + (c.duration_minutes * INTERVAL '1 minute'),
                    c.end_time
                )
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> mapParticipant(rs));
    }

    public List<LeaderboardEntry> getLeaderboard(Integer competitionId) {
        String sql = """
                SELECT
                    s.user_id,
                    u.name,
                    COUNT(DISTINCT s.problem_id) AS solved,
                    COALESCE(SUM(s.runtime), 0) AS total_time
                FROM submissions s
                JOIN users u ON u.id = s.user_id
                WHERE s.competition_id = ?
                  AND s.status = 'Accepted'
                GROUP BY s.user_id, u.name
                ORDER BY solved DESC, total_time ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            LeaderboardEntry entry = new LeaderboardEntry();
            entry.setUserId(rs.getInt("user_id"));
            entry.setUserName(rs.getString("name"));
            entry.setSolved(rs.getInt("solved"));
            entry.setTotalTime(rs.getDouble("total_time"));
            entry.setRank(rowNum + 1);
            return entry;
        }, competitionId);
    }

    public int syncAllCompetitionStatuses() {
        String sql = """
                UPDATE competitions
                SET status = CASE
                    WHEN start_time > NOW() THEN 'UPCOMING'
                    WHEN end_time < NOW() THEN 'ENDED'
                    ELSE 'ACTIVE'
                END
                WHERE status IS DISTINCT FROM CASE
                    WHEN start_time > NOW() THEN 'UPCOMING'
                    WHEN end_time < NOW() THEN 'ENDED'
                    ELSE 'ACTIVE'
                END
                """;
        return jdbcTemplate.update(sql);
    }

    public int updateCompetitionTimes(Integer id, Timestamp startTime, Timestamp endTime, String status) {
        String sql = """
                UPDATE competitions
                SET start_time = ?, end_time = ?, status = ?
                WHERE id = ?
                """;
        return jdbcTemplate.update(sql, startTime, endTime, status, id);
    }

    private Competition mapCompetition(ResultSet rs) throws SQLException {
        Competition competition = new Competition();
        competition.setId(rs.getInt("id"));
        competition.setTitle(rs.getString("title"));
        competition.setDescription(rs.getString("description"));
        competition.setStartTime(rs.getTimestamp("start_time"));
        competition.setEndTime(rs.getTimestamp("end_time"));
        competition.setCreatedBy(rs.getInt("created_by"));
        competition.setStatus(rs.getString("status"));
        competition.setDurationMinutes(rs.getInt("duration_minutes"));
        return competition;
    }

    private CompetitionParticipant mapParticipant(ResultSet rs) throws SQLException {
        CompetitionParticipant participant = new CompetitionParticipant();
        participant.setId(rs.getInt("id"));
        participant.setCompetitionId(rs.getInt("competition_id"));
        participant.setUserId(rs.getInt("user_id"));
        participant.setJoinedAt(rs.getTimestamp("joined_at"));
        participant.setStartedAt(rs.getTimestamp("started_at"));
        participant.setSessionStatus(rs.getString("session_status"));
        return participant;
    }
}
