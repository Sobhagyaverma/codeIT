package com.codeit.modules.friends;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class FriendRepository {

    private final JdbcTemplate jdbc;

    private final RowMapper<FriendRequest> requestMapper = (rs, rowNum) -> {
        FriendRequest r = new FriendRequest();
        r.setId(rs.getLong("id"));
        r.setFromUserId(rs.getInt("from_user_id"));
        r.setToUserId(rs.getInt("to_user_id"));
        r.setStatus(rs.getString("status"));
        Timestamp created = rs.getTimestamp("created_at");
        r.setCreatedAt(created != null ? created.toInstant() : null);
        Timestamp responded = rs.getTimestamp("responded_at");
        r.setRespondedAt(responded != null ? responded.toInstant() : null);
        return r;
    };

    public FriendRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public long insertRequest(int fromUserId, int toUserId) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    """
                            INSERT INTO friend_requests (from_user_id, to_user_id, status)
                            VALUES (?, ?, 'PENDING')
                            """,
                    new String[] {"id"});
            ps.setInt(1, fromUserId);
            ps.setInt(2, toUserId);
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null && keyHolder.getKeys() != null) {
            Object id = keyHolder.getKeys().get("id");
            if (id instanceof Number n) {
                key = n;
            }
        }
        return key != null ? key.longValue() : 0L;
    }

    public Optional<FriendRequest> findRequestById(long id) {
        List<FriendRequest> list = jdbc.query(
                "SELECT * FROM friend_requests WHERE id = ?", requestMapper, id);
        return list.stream().findFirst();
    }

    public boolean hasPending(int fromUserId, int toUserId) {
        Integer count = jdbc.queryForObject(
                """
                        SELECT COUNT(*) FROM friend_requests
                        WHERE from_user_id = ? AND to_user_id = ? AND status = 'PENDING'
                        """,
                Integer.class,
                fromUserId,
                toUserId);
        return count != null && count > 0;
    }

    public boolean areFriends(int a, int b) {
        int low = Math.min(a, b);
        int high = Math.max(a, b);
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM friends WHERE user_id_low = ? AND user_id_high = ?",
                Integer.class,
                low,
                high);
        return count != null && count > 0;
    }

    public int countFriends(int userId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM friends WHERE user_id_low = ? OR user_id_high = ?",
                Integer.class,
                userId,
                userId);
        return count == null ? 0 : count;
    }

    public int updateRequestStatus(long id, String status) {
        return jdbc.update(
                """
                        UPDATE friend_requests
                        SET status = ?, responded_at = ?
                        WHERE id = ? AND status = 'PENDING'
                        """,
                status,
                Timestamp.from(Instant.now()),
                id);
    }

    public void insertFriendship(int a, int b) {
        int low = Math.min(a, b);
        int high = Math.max(a, b);
        jdbc.update(
                """
                        INSERT INTO friends (user_id_low, user_id_high)
                        VALUES (?, ?)
                        ON CONFLICT DO NOTHING
                        """,
                low,
                high);
    }

    public void removeFriendship(int a, int b) {
        int low = Math.min(a, b);
        int high = Math.max(a, b);
        jdbc.update(
                "DELETE FROM friends WHERE user_id_low = ? AND user_id_high = ?",
                low,
                high);
    }

    public List<Map<String, Object>> listFriends(int userId) {
        return jdbc.queryForList(
                """
                        SELECT u.id AS user_id,
                               u.name,
                               u.uniqueuserid AS unique_user_id,
                               u.avatar_url,
                               f.created_at AS friends_since,
                               (
                                 SELECT COUNT(DISTINCT s.problem_id)
                                 FROM submissions s
                                 WHERE s.user_id = u.id
                                   AND s.status = 'Accepted'
                               ) AS solved_count
                        FROM friends f
                        JOIN users u ON u.id = CASE
                            WHEN f.user_id_low = ? THEN f.user_id_high
                            ELSE f.user_id_low
                        END
                        WHERE f.user_id_low = ? OR f.user_id_high = ?
                        ORDER BY u.name ASC
                        """,
                userId,
                userId,
                userId);
    }

    public List<Map<String, Object>> listIncoming(int userId) {
        return jdbc.queryForList(
                """
                        SELECT fr.id AS request_id,
                               fr.created_at,
                               u.id AS user_id,
                               u.name,
                               u.uniqueuserid AS unique_user_id,
                               u.avatar_url,
                               (
                                 SELECT COUNT(DISTINCT s.problem_id)
                                 FROM submissions s
                                 WHERE s.user_id = u.id
                                   AND s.status = 'Accepted'
                               ) AS solved_count
                        FROM friend_requests fr
                        JOIN users u ON u.id = fr.from_user_id
                        WHERE fr.to_user_id = ? AND fr.status = 'PENDING'
                        ORDER BY fr.created_at DESC
                        """,
                userId);
    }

    public List<Map<String, Object>> listOutgoing(int userId) {
        return jdbc.queryForList(
                """
                        SELECT fr.id AS request_id,
                               fr.created_at,
                               u.id AS user_id,
                               u.name,
                               u.uniqueuserid AS unique_user_id,
                               u.avatar_url,
                               (
                                 SELECT COUNT(DISTINCT s.problem_id)
                                 FROM submissions s
                                 WHERE s.user_id = u.id
                                   AND s.status = 'Accepted'
                               ) AS solved_count
                        FROM friend_requests fr
                        JOIN users u ON u.id = fr.to_user_id
                        WHERE fr.from_user_id = ? AND fr.status = 'PENDING'
                        ORDER BY fr.created_at DESC
                        """,
                userId);
    }

    public Optional<Map<String, Object>> previewByUniqueUserId(String uniqueUserId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                """
                        SELECT u.id AS user_id,
                               u.name,
                               u.uniqueuserid AS unique_user_id,
                               u.avatar_url,
                               (
                                 SELECT COUNT(DISTINCT s.problem_id)
                                 FROM submissions s
                                 WHERE s.user_id = u.id
                                   AND s.status = 'Accepted'
                               ) AS solved_count
                        FROM users u
                        WHERE LOWER(u.uniqueuserid) = LOWER(?)
                        LIMIT 1
                        """,
                uniqueUserId);
        return rows.stream().findFirst();
    }
}
