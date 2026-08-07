package com.codeit.modules.quickclash;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class QuickContestRepository {

    private final JdbcTemplate jdbc;

    public QuickContestRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public long createContest(
            int hostUserId,
            String name,
            String description,
            String tier,
            int durationMinutes,
            int maxPlayers) {
        String token = UUID.randomUUID().toString().replace("-", "");
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    """
                            INSERT INTO quick_contests
                                (host_user_id, name, description, difficulty_tier,
                                 duration_minutes, max_players, status, invite_token)
                            VALUES (?, ?, ?, ?, ?, ?, 'LOBBY', ?)
                            """,
                    new String[] {"id"});
            ps.setInt(1, hostUserId);
            ps.setString(2, name);
            ps.setString(3, description);
            ps.setString(4, tier);
            ps.setInt(5, durationMinutes);
            ps.setInt(6, maxPlayers);
            ps.setString(7, token);
            return ps;
        }, keyHolder);
        return extractId(keyHolder);
    }

    public void addHostParticipant(long contestId, int hostUserId) {
        jdbc.update(
                """
                        INSERT INTO quick_contest_participants
                            (contest_id, user_id, role, status, ready, joined_at)
                        VALUES (?, ?, 'HOST', 'JOINED', TRUE, NOW())
                        """,
                contestId,
                hostUserId);
    }

    public void addProblems(long contestId, List<Integer> problemIds) {
        for (int i = 0; i < problemIds.size(); i++) {
            jdbc.update(
                    """
                            INSERT INTO quick_contest_problems (contest_id, problem_id, ordinal)
                            VALUES (?, ?, ?)
                            """,
                    contestId,
                    problemIds.get(i),
                    i + 1);
        }
    }

    public List<Integer> pickRandomProblemIds(String difficulty, int count, List<Integer> exclude) {
        if (count <= 0) {
            return List.of();
        }
        if (exclude == null || exclude.isEmpty()) {
            return jdbc.query(
                    """
                            SELECT id FROM problems
                            WHERE UPPER(difficulty) = UPPER(?)
                            ORDER BY RANDOM()
                            LIMIT ?
                            """,
                    (rs, rowNum) -> rs.getInt("id"),
                    difficulty,
                    count);
        }
        String placeholders = String.join(",", exclude.stream().map(id -> "?").toList());
        Object[] args = new Object[exclude.size() + 2];
        args[0] = difficulty;
        for (int i = 0; i < exclude.size(); i++) {
            args[i + 1] = exclude.get(i);
        }
        args[args.length - 1] = count;
        return jdbc.query(
                """
                        SELECT id FROM problems
                        WHERE UPPER(difficulty) = UPPER(?)
                          AND id NOT IN (%s)
                        ORDER BY RANDOM()
                        LIMIT ?
                        """
                        .formatted(placeholders),
                (rs, rowNum) -> rs.getInt("id"),
                args);
    }

    public Optional<Map<String, Object>> findContest(long id) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM quick_contests WHERE id = ?", id);
        return rows.stream().findFirst();
    }

    /** Row lock for capacity-safe join (call inside @Transactional). */
    public Optional<Map<String, Object>> lockContestForUpdate(long id) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM quick_contests WHERE id = ? FOR UPDATE", id);
        return rows.stream().findFirst();
    }

    public Optional<Map<String, Object>> findByInviteToken(String token) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM quick_contests WHERE invite_token = ?", token);
        return rows.stream().findFirst();
    }

    public List<Map<String, Object>> listProblems(long contestId) {
        return jdbc.queryForList(
                """
                        SELECT qcp.ordinal, p.id AS problem_id, p.title, p.difficulty
                        FROM quick_contest_problems qcp
                        JOIN problems p ON p.id = qcp.problem_id
                        WHERE qcp.contest_id = ?
                        ORDER BY qcp.ordinal
                        """,
                contestId);
    }

    public boolean isContestProblem(long contestId, int problemId) {
        Integer count = jdbc.queryForObject(
                """
                        SELECT COUNT(*) FROM quick_contest_problems
                        WHERE contest_id = ? AND problem_id = ?
                        """,
                Integer.class,
                contestId,
                problemId);
        return count != null && count > 0;
    }

    public List<Map<String, Object>> listParticipants(long contestId) {
        return jdbc.queryForList(
                """
                        SELECT qp.*, u.name, u.uniqueuserid AS unique_user_id, u.avatar_url
                        FROM quick_contest_participants qp
                        JOIN users u ON u.id = qp.user_id
                        WHERE qp.contest_id = ?
                        ORDER BY qp.role DESC, qp.joined_at NULLS LAST, qp.created_at
                        """,
                contestId);
    }

    public Optional<Map<String, Object>> findParticipant(long contestId, int userId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                """
                        SELECT * FROM quick_contest_participants
                        WHERE contest_id = ? AND user_id = ?
                        """,
                contestId,
                userId);
        return rows.stream().findFirst();
    }

    public int countJoined(long contestId) {
        Integer count = jdbc.queryForObject(
                """
                        SELECT COUNT(*) FROM quick_contest_participants
                        WHERE contest_id = ? AND status = 'JOINED'
                        """,
                Integer.class,
                contestId);
        return count == null ? 0 : count;
    }

    public void inviteUser(long contestId, int userId) {
        jdbc.update(
                """
                        INSERT INTO quick_contest_participants
                            (contest_id, user_id, role, status, ready)
                        VALUES (?, ?, 'PLAYER', 'INVITED', FALSE)
                        ON CONFLICT (contest_id, user_id) DO NOTHING
                        """,
                contestId,
                userId);
    }

    public void markJoined(long contestId, int userId) {
        jdbc.update(
                """
                        UPDATE quick_contest_participants
                        SET status = 'JOINED', joined_at = COALESCE(joined_at, NOW())
                        WHERE contest_id = ? AND user_id = ?
                        """,
                contestId,
                userId);
    }

    public void setReady(long contestId, int userId, boolean ready) {
        jdbc.update(
                """
                        UPDATE quick_contest_participants
                        SET ready = ?
                        WHERE contest_id = ? AND user_id = ? AND status = 'JOINED'
                        """,
                ready,
                contestId,
                userId);
    }

    public void leave(long contestId, int userId) {
        jdbc.update(
                """
                        UPDATE quick_contest_participants
                        SET status = 'LEFT', ready = FALSE
                        WHERE contest_id = ? AND user_id = ?
                        """,
                contestId,
                userId);
    }

    public int startContest(long contestId, Instant endsAt) {
        return jdbc.update(
                """
                        UPDATE quick_contests
                        SET status = 'LIVE', started_at = NOW(), ends_at = ?
                        WHERE id = ? AND status = 'LOBBY'
                        """,
                Timestamp.from(endsAt),
                contestId);
    }

    public void endContest(long contestId) {
        jdbc.update(
                """
                        UPDATE quick_contests
                        SET status = 'ENDED'
                        WHERE id = ? AND status = 'LIVE'
                        """,
                contestId);
    }

    public void cancelContest(long contestId) {
        jdbc.update(
                """
                        UPDATE quick_contests
                        SET status = 'CANCELLED'
                        WHERE id = ? AND status = 'LOBBY'
                        """,
                contestId);
    }

    public List<Long> findExpiredLiveContestIds() {
        return jdbc.query(
                """
                        SELECT id FROM quick_contests
                        WHERE status = 'LIVE' AND ends_at IS NOT NULL AND ends_at <= NOW()
                        """,
                (rs, rowNum) -> rs.getLong("id"));
    }

    public long saveSubmission(
            long contestId,
            int userId,
            int problemId,
            String language,
            int languageId,
            String code,
            String verdict,
            Double runtime,
            Float memory) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    """
                            INSERT INTO quick_contest_submissions
                                (contest_id, user_id, problem_id, language, language_id,
                                 code, verdict, runtime_ms, memory_kb)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                    new String[] {"id"});
            ps.setLong(1, contestId);
            ps.setInt(2, userId);
            ps.setInt(3, problemId);
            ps.setString(4, language);
            ps.setInt(5, languageId);
            ps.setString(6, code);
            ps.setString(7, verdict);
            if (runtime == null) {
                ps.setObject(8, null);
            } else {
                ps.setDouble(8, runtime);
            }
            if (memory == null) {
                ps.setObject(9, null);
            } else {
                ps.setFloat(9, memory);
            }
            return ps;
        }, keyHolder);
        return extractId(keyHolder);
    }

    public List<Map<String, Object>> leaderboard(long contestId) {
        return jdbc.queryForList(
                """
                        WITH joined AS (
                            SELECT user_id FROM quick_contest_participants
                            WHERE contest_id = ? AND status = 'JOINED'
                        ),
                        accepted AS (
                            SELECT DISTINCT ON (user_id, problem_id)
                                   user_id, problem_id, created_at
                            FROM quick_contest_submissions
                            WHERE contest_id = ? AND verdict = 'Accepted'
                            ORDER BY user_id, problem_id, created_at ASC
                        ),
                        wrongs AS (
                            SELECT user_id, problem_id, COUNT(*) AS wrong_count
                            FROM quick_contest_submissions
                            WHERE contest_id = ? AND verdict <> 'Accepted'
                            GROUP BY user_id, problem_id
                        ),
                        scored AS (
                            SELECT j.user_id,
                                   COUNT(a.problem_id) AS solved,
                                   COALESCE(SUM(
                                       EXTRACT(EPOCH FROM (a.created_at - c.started_at))::int
                                       + COALESCE(w.wrong_count, 0) * 300
                                   ), 0) AS penalty
                            FROM joined j
                            JOIN quick_contests c ON c.id = ?
                            LEFT JOIN accepted a ON a.user_id = j.user_id
                            LEFT JOIN wrongs w
                              ON w.user_id = a.user_id AND w.problem_id = a.problem_id
                            GROUP BY j.user_id
                        )
                        SELECT s.user_id, u.name, u.uniqueuserid AS unique_user_id,
                               s.solved, s.penalty,
                               RANK() OVER (ORDER BY s.solved DESC, s.penalty ASC) AS placement
                        FROM scored s
                        JOIN users u ON u.id = s.user_id
                        ORDER BY s.solved DESC, s.penalty ASC
                        """,
                contestId,
                contestId,
                contestId,
                contestId);
    }

    public void replaceResults(long contestId, List<Map<String, Object>> board) {
        jdbc.update("DELETE FROM quick_contest_results WHERE contest_id = ?", contestId);
        for (Map<String, Object> row : board) {
            jdbc.update(
                    """
                            INSERT INTO quick_contest_results
                                (contest_id, user_id, placement, solved_count, penalty)
                            VALUES (?, ?, ?, ?, ?)
                            """,
                    contestId,
                    ((Number) row.get("user_id")).intValue(),
                    ((Number) row.get("placement")).intValue(),
                    ((Number) row.get("solved")).intValue(),
                    ((Number) row.get("penalty")).intValue());
        }
    }

    public List<Map<String, Object>> historyForUser(int userId) {
        return jdbc.queryForList(
                """
                        SELECT c.id, c.name, c.difficulty_tier, c.duration_minutes, c.status,
                               c.started_at, c.ends_at, c.created_at,
                               r.placement, r.solved_count, r.penalty,
                               (SELECT COUNT(*) FROM quick_contest_participants p
                                  WHERE p.contest_id = c.id AND p.status = 'JOINED') AS player_count
                        FROM quick_contest_participants qp
                        JOIN quick_contests c ON c.id = qp.contest_id
                        LEFT JOIN quick_contest_results r
                          ON r.contest_id = c.id AND r.user_id = qp.user_id
                        WHERE qp.user_id = ?
                          AND (
                            qp.status IN ('JOINED', 'INVITED')
                            OR (qp.status = 'LEFT' AND c.status IN ('LOBBY', 'LIVE'))
                          )
                        ORDER BY c.created_at DESC
                        LIMIT 50
                        """,
                userId);
    }

    /** Contests the user can enter or rejoin right now (lobby / live). */
    public List<Map<String, Object>> activeForUser(int userId) {
        return jdbc.queryForList(
                """
                        SELECT c.id, c.name, c.difficulty_tier, c.duration_minutes, c.status,
                               c.started_at, c.ends_at, c.max_players, qp.status AS my_status,
                               u.name AS host_name
                        FROM quick_contest_participants qp
                        JOIN quick_contests c ON c.id = qp.contest_id
                        JOIN users u ON u.id = c.host_user_id
                        WHERE qp.user_id = ?
                          AND c.status IN ('LOBBY', 'LIVE')
                          AND qp.status IN ('JOINED', 'INVITED', 'LEFT')
                        ORDER BY
                          CASE c.status WHEN 'LIVE' THEN 0 ELSE 1 END,
                          c.started_at DESC NULLS LAST,
                          c.created_at DESC
                        LIMIT 20
                        """,
                userId);
    }

    public List<Map<String, Object>> invitedForUser(int userId) {
        return jdbc.queryForList(
                """
                        SELECT c.id, c.name, c.difficulty_tier, c.duration_minutes, c.status,
                               c.max_players, c.created_at, u.name AS host_name
                        FROM quick_contest_participants qp
                        JOIN quick_contests c ON c.id = qp.contest_id
                        JOIN users u ON u.id = c.host_user_id
                        WHERE qp.user_id = ? AND qp.status = 'INVITED' AND c.status = 'LOBBY'
                        ORDER BY c.created_at DESC
                        """,
                userId);
    }

    private static long extractId(KeyHolder keyHolder) {
        Number key = keyHolder.getKey();
        if (key == null && keyHolder.getKeys() != null) {
            Object id = keyHolder.getKeys().get("id");
            if (id instanceof Number n) {
                key = n;
            }
        }
        return key != null ? key.longValue() : 0L;
    }
}
