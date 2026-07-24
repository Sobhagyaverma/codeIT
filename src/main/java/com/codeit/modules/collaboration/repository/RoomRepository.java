package com.codeit.modules.collaboration.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.codeit.modules.collaboration.Room;

@Repository
public class RoomRepository {

    private final JdbcTemplate jdbcTemplate;

    public RoomRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Room insert(Room room) {
        Timestamp now = Timestamp.from(Instant.now());
        if (room.getCreatedAt() == null) {
            room.setCreatedAt(now);
        }
        if (room.getUpdatedAt() == null) {
            room.setUpdatedAt(now);
        }

        jdbcTemplate.update(
                """
                INSERT INTO rooms (
                    id, type, problem_id, host_user_id, invite_token,
                    active_workspace, language, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                room.getId(),
                room.getType(),
                room.getProblemId(),
                room.getHostUserId(),
                room.getInviteToken(),
                room.getActiveWorkspace(),
                room.getLanguage(),
                room.getStatus(),
                room.getCreatedAt(),
                room.getUpdatedAt());

        return room;
    }

    public Optional<Room> findById(UUID id) {
        List<Room> rooms = jdbcTemplate.query(
                """
                SELECT id, type, problem_id, host_user_id, invite_token,
                       active_workspace, language, status, created_at, updated_at
                FROM rooms
                WHERE id = ?
                """,
                (rs, rowNum) -> mapRoom(rs),
                id);
        return rooms.stream().findFirst();
    }

    public Optional<Room> findByInviteToken(String inviteToken) {
        List<Room> rooms = jdbcTemplate.query(
                """
                SELECT id, type, problem_id, host_user_id, invite_token,
                       active_workspace, language, status, created_at, updated_at
                FROM rooms
                WHERE invite_token = ?
                """,
                (rs, rowNum) -> mapRoom(rs),
                inviteToken);
        return rooms.stream().findFirst();
    }

    public int updateWorkspace(UUID roomId, String workspace) {
        return jdbcTemplate.update(
                """
                UPDATE rooms
                SET active_workspace = ?, updated_at = ?
                WHERE id = ?
                """,
                workspace,
                Timestamp.from(Instant.now()),
                roomId);
    }

    public int updateHost(UUID roomId, Integer newHostUserId) {
        return jdbcTemplate.update(
                """
                UPDATE rooms
                SET host_user_id = ?, updated_at = ?
                WHERE id = ?
                """,
                newHostUserId,
                Timestamp.from(Instant.now()),
                roomId);
    }

    public int updateStatus(UUID roomId, String status) {
        return jdbcTemplate.update(
                """
                UPDATE rooms
                SET status = ?, updated_at = ?
                WHERE id = ?
                """,
                status,
                Timestamp.from(Instant.now()),
                roomId);
    }

    private Room mapRoom(ResultSet rs) throws SQLException {
        Room room = new Room();
        room.setId((UUID) rs.getObject("id"));
        room.setType(rs.getString("type"));

        Object problemId = rs.getObject("problem_id");
        room.setProblemId(problemId != null ? rs.getInt("problem_id") : null);

        room.setHostUserId(rs.getInt("host_user_id"));
        room.setInviteToken(rs.getString("invite_token"));
        room.setActiveWorkspace(rs.getString("active_workspace"));
        room.setLanguage(rs.getString("language"));
        room.setStatus(rs.getString("status"));
        room.setCreatedAt(rs.getTimestamp("created_at"));
        room.setUpdatedAt(rs.getTimestamp("updated_at"));
        return room;
    }
}