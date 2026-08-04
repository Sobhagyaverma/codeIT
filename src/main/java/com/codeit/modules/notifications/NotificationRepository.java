package com.codeit.modules.notifications;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Repository
public class NotificationRepository {

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public NotificationRepository(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public long insert(int userId, String type, Map<String, Object> payload) {
        String json;
        try {
            json = objectMapper.writeValueAsString(payload == null ? Map.of() : payload);
        } catch (JsonProcessingException e) {
            json = "{}";
        }
        KeyHolder keyHolder = new GeneratedKeyHolder();
        String payloadJson = json;
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    """
                            INSERT INTO notifications (user_id, type, payload)
                            VALUES (?, ?, CAST(? AS jsonb))
                            """,
                    new String[] {"id"});
            ps.setInt(1, userId);
            ps.setString(2, type);
            ps.setString(3, payloadJson);
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

    public List<Map<String, Object>> listForUser(int userId, int limit) {
        return jdbc.query(
                """
                        SELECT id, type, payload, read_at, created_at
                        FROM notifications
                        WHERE user_id = ?
                        ORDER BY created_at DESC
                        LIMIT ?
                        """,
                (rs, rowNum) -> toRow(
                        rs.getLong("id"),
                        rs.getString("type"),
                        rs.getString("payload"),
                        rs.getTimestamp("read_at"),
                        rs.getTimestamp("created_at")),
                userId,
                Math.min(Math.max(limit, 1), 100));
    }

    public Optional<Map<String, Object>> findById(int userId, long notificationId) {
        List<Map<String, Object>> rows = jdbc.query(
                """
                        SELECT id, type, payload, read_at, created_at
                        FROM notifications
                        WHERE id = ? AND user_id = ?
                        """,
                (rs, rowNum) -> toRow(
                        rs.getLong("id"),
                        rs.getString("type"),
                        rs.getString("payload"),
                        rs.getTimestamp("read_at"),
                        rs.getTimestamp("created_at")),
                notificationId,
                userId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    /**
     * JSONB comes back from the driver as a PGobject; without decoding it here the
     * payload reaches clients as {"type":"jsonb","value":"..."} instead of the object.
     */
    private Map<String, Object> toRow(
            long id, String type, String payloadJson, Timestamp readAt, Timestamp createdAt) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", id);
        row.put("type", type);
        row.put("payload", parsePayload(payloadJson));
        row.put("read_at", readAt == null ? null : readAt.toInstant().toString());
        row.put("created_at", createdAt == null ? null : createdAt.toInstant().toString());
        return row;
    }

    private Map<String, Object> parsePayload(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }

    public int countUnread(int userId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read_at IS NULL",
                Integer.class,
                userId);
        return count == null ? 0 : count;
    }

    public int markRead(int userId, long notificationId) {
        return jdbc.update(
                """
                        UPDATE notifications
                        SET read_at = ?
                        WHERE id = ? AND user_id = ? AND read_at IS NULL
                        """,
                Timestamp.from(Instant.now()),
                notificationId,
                userId);
    }

    public int markAllRead(int userId) {
        return jdbc.update(
                """
                        UPDATE notifications
                        SET read_at = ?
                        WHERE user_id = ? AND read_at IS NULL
                        """,
                Timestamp.from(Instant.now()),
                userId);
    }

    /**
     * Drop inbox cards for a friend request once it has been accepted/rejected so they
     * do not linger as actionable items.
     */
    public int deleteFriendRequestNotifications(int userId, long requestId) {
        return jdbc.update(
                """
                        DELETE FROM notifications
                        WHERE user_id = ?
                          AND type = 'FRIEND_REQUEST'
                          AND (payload->>'requestId')::bigint = ?
                        """,
                userId,
                requestId);
    }
}
