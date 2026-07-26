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

import com.codeit.modules.collaboration.RoomMember;
import com.codeit.modules.collaboration.UserRoomMembership;

@Repository
public class RoomMemberRepository {

    private final JdbcTemplate jdbcTemplate;

    public RoomMemberRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public RoomMember insert(RoomMember member) {
        Timestamp now = Timestamp.from(Instant.now());
        if (member.getJoinedAt() == null) {
            member.setJoinedAt(now);
        }
        if (member.getLastSeenAt() == null) {
            member.setLastSeenAt(now);
        }

        jdbcTemplate.update(
                """
                INSERT INTO room_members (room_id, user_id, role, joined_at, last_seen_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                member.getRoomId(),
                member.getUserId(),
                member.getRole(),
                member.getJoinedAt(),
                member.getLastSeenAt());

        return member;
    }

    public List<RoomMember> findByRoomId(UUID roomId) {
        return jdbcTemplate.query(
                """
                SELECT room_id, user_id, role, joined_at, last_seen_at
                FROM room_members
                WHERE room_id = ?
                ORDER BY joined_at ASC
                """,
                (rs, rowNum) -> mapMember(rs),
                roomId);
    }

    public Optional<RoomMember> findByRoomIdAndUserId(UUID roomId, Integer userId) {
        List<RoomMember> members = jdbcTemplate.query(
                """
                SELECT room_id, user_id, role, joined_at, last_seen_at
                FROM room_members
                WHERE room_id = ? AND user_id = ?
                """,
                (rs, rowNum) -> mapMember(rs),
                roomId,
                userId);
        return members.stream().findFirst();
    }

    public boolean exists(UUID roomId, Integer userId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM room_members
                WHERE room_id = ? AND user_id = ?
                """,
                Integer.class,
                roomId,
                userId);
        return count != null && count > 0;
    }

    public int updateRole(UUID roomId, Integer userId, String role) {
        return jdbcTemplate.update(
                """
                UPDATE room_members
                SET role = ?
                WHERE room_id = ? AND user_id = ?
                """,
                role,
                roomId,
                userId);
    }

    public int delete(UUID roomId, Integer userId) {
        return jdbcTemplate.update(
                """
                DELETE FROM room_members
                WHERE room_id = ? AND user_id = ?
                """,
                roomId,
                userId);
    }

    public int updateLastSeen(UUID roomId, Integer userId) {
        return jdbcTemplate.update(
                """
                UPDATE room_members
                SET last_seen_at = ?
                WHERE room_id = ? AND user_id = ?
                """,
                Timestamp.from(Instant.now()),
                roomId,
                userId);
    }

    public List<UserRoomMembership> findMembershipsByUserId(
            Integer userId, String status, String type, int limit) {
        return jdbcTemplate.query(
                """
                SELECT r.id, r.type, r.language, r.status, r.active_workspace,
                       r.invite_token, r.updated_at,
                       m.role, m.joined_at, m.last_seen_at
                FROM room_members m
                JOIN rooms r ON r.id = m.room_id
                WHERE m.user_id = ?
                  AND r.status = ?
                  AND (? IS NULL OR r.type = ?)
                ORDER BY m.last_seen_at DESC
                LIMIT ?
                """,
                (rs, rowNum) -> mapUserRoomMembership(rs),
                userId,
                status,
                type,
                type,
                limit);
    }

    private UserRoomMembership mapUserRoomMembership(ResultSet rs) throws SQLException {
        UserRoomMembership row = new UserRoomMembership();
        row.setId((UUID) rs.getObject("id"));
        row.setType(rs.getString("type"));
        row.setLanguage(rs.getString("language"));
        row.setStatus(rs.getString("status"));
        row.setActiveWorkspace(rs.getString("active_workspace"));
        row.setInviteToken(rs.getString("invite_token"));
        row.setUpdatedAt(rs.getTimestamp("updated_at"));
        row.setRole(rs.getString("role"));
        row.setJoinedAt(rs.getTimestamp("joined_at"));
        row.setLastSeenAt(rs.getTimestamp("last_seen_at"));
        return row;
    }

    private RoomMember mapMember(ResultSet rs) throws SQLException {
        RoomMember member = new RoomMember();
        member.setRoomId((UUID) rs.getObject("room_id"));
        member.setUserId(rs.getInt("user_id"));
        member.setRole(rs.getString("role"));
        member.setJoinedAt(rs.getTimestamp("joined_at"));
        member.setLastSeenAt(rs.getTimestamp("last_seen_at"));
        return member;
    }
}