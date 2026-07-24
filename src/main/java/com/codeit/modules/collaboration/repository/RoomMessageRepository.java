package com.codeit.modules.collaboration.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.codeit.modules.collaboration.RoomMessage;

@Repository
public class RoomMessageRepository {

    private final JdbcTemplate jdbcTemplate;

    public RoomMessageRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public RoomMessage insert(UUID roomId, Integer userId, String content) {
        Timestamp now = Timestamp.from(Instant.now());
        Long id = jdbcTemplate.queryForObject(
                """
                INSERT INTO room_messages (room_id, user_id, content, created_at)
                VALUES (?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                roomId,
                userId,
                content,
                now);

        RoomMessage message = new RoomMessage();
        message.setId(id);
        message.setRoomId(roomId);
        message.setUserId(userId);
        message.setContent(content);
        message.setCreatedAt(now);
        return message;
    }

    /**
     * Returns messages in chronological order (oldest first).
     */
    public List<RoomMessage> findRecentByRoomId(UUID roomId, int limit) {
        List<RoomMessage> newestFirst = jdbcTemplate.query(
                """
                SELECT id, room_id, user_id, content, created_at
                FROM room_messages
                WHERE room_id = ?
                ORDER BY created_at DESC, id DESC
                LIMIT ?
                """,
                (rs, rowNum) -> mapMessage(rs),
                roomId,
                limit);

        List<RoomMessage> chronological = new ArrayList<>(newestFirst);
        Collections.reverse(chronological);
        return chronological;
    }

    private RoomMessage mapMessage(ResultSet rs) throws SQLException {
        RoomMessage message = new RoomMessage();
        message.setId(rs.getLong("id"));
        message.setRoomId((UUID) rs.getObject("room_id"));
        message.setUserId(rs.getInt("user_id"));
        message.setContent(rs.getString("content"));
        message.setCreatedAt(rs.getTimestamp("created_at"));
        return message;
    }
}