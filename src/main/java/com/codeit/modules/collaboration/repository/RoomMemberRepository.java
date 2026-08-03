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
                        SELECT m.room_id, m.user_id, m.role, m.joined_at, m.last_seen_at,
                               u.uniqueuserid AS username,
                               u.name AS display_name
                        FROM room_members m
                        LEFT JOIN users u ON u.id = m.user_id
                        WHERE m.room_id = ?
                        ORDER BY m.joined_at ASC
                        """,
                (rs, rowNum) -> mapMember(rs),
                roomId);
    }

    public Optional<RoomMember> findByRoomIdAndUserId(UUID roomId, Integer userId) {
        List<RoomMember> members = jdbcTemplate.query(
                """
                        SELECT m.room_id, m.user_id, m.role, m.joined_at, m.last_seen_at,
                               u.uniqueuserid AS username,
                               u.name AS display_name
                        FROM room_members m
                        LEFT JOIN users u ON u.id = m.user_id
                        WHERE m.room_id = ? AND m.user_id = ?
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

    public int countByRoomId(UUID roomId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*) FROM room_members
                        WHERE room_id = ?
                        """,
                Integer.class,
                roomId);
        return count == null ? 0 : count;
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

    public List<UserRoomMembership> findActiveMembershipsByUserId(Integer userId) {
        return jdbcTemplate.query(
                """
                        SELECT r.id, r.type, r.language, r.status, r.active_workspace,
                               r.invite_token, r.updated_at, r.created_at, r.host_user_id, r.host_note,
                               m.role, m.joined_at, m.last_seen_at,
                               u.name AS host_name,
                               u.uniqueuserid AS host_username,
                               (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id = r.id) AS member_count
                        FROM room_members m
                        JOIN rooms r ON r.id = m.room_id
                        LEFT JOIN users u ON u.id = r.host_user_id
                        WHERE m.user_id = ?
                          AND r.status = 'ACTIVE'
                        ORDER BY m.last_seen_at DESC
                        """,
                (rs, rowNum) -> mapUserRoomMembership(rs),
                userId);
    }

    /**
     * Leave every ACTIVE room membership except {@code keepRoomId}.
     * Hosts are never removed this way — caller must end/transfer first.
     */
    public int deleteNonHostActiveMembershipsExcept(Integer userId, UUID keepRoomId) {
        if (keepRoomId == null) {
            return jdbcTemplate.update(
                    """
                            DELETE FROM room_members m
                            USING rooms r
                            WHERE m.room_id = r.id
                              AND m.user_id = ?
                              AND r.status = 'ACTIVE'
                              AND m.role <> 'HOST'
                            """,
                    userId);
        }
        return jdbcTemplate.update(
                """
                        DELETE FROM room_members m
                        USING rooms r
                        WHERE m.room_id = r.id
                          AND m.user_id = ?
                          AND r.status = 'ACTIVE'
                          AND m.role <> 'HOST'
                          AND m.room_id <> ?
                        """,
                userId,
                keepRoomId);
    }

    public int deleteAllMembers(UUID roomId) {
        return jdbcTemplate.update(
                """
                        DELETE FROM room_members
                        WHERE room_id = ?
                        """,
                roomId);
    }

    public List<UserRoomMembership> findMembershipsByUserId(
            Integer userId, String status, String type, int limit) {
        return jdbcTemplate.query(
                """
                        SELECT r.id, r.type, r.language, r.status, r.active_workspace,
                               r.invite_token, r.updated_at, r.created_at, r.host_user_id, r.host_note,
                               m.role, m.joined_at, m.last_seen_at,
                               u.name AS host_name,
                               u.uniqueuserid AS host_username,
                               (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id = r.id) AS member_count
                        FROM room_members m
                        JOIN rooms r ON r.id = m.room_id
                        LEFT JOIN users u ON u.id = r.host_user_id
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
        row.setCreatedAt(rs.getTimestamp("created_at"));
        row.setRole(rs.getString("role"));
        row.setJoinedAt(rs.getTimestamp("joined_at"));
        row.setLastSeenAt(rs.getTimestamp("last_seen_at"));
        Object hostId = rs.getObject("host_user_id");
        row.setHostUserId(hostId != null ? rs.getInt("host_user_id") : null);
        row.setHostName(rs.getString("host_name"));
        row.setHostUsername(rs.getString("host_username"));
        row.setHostNote(rs.getString("host_note"));
        row.setMemberCount(rs.getInt("member_count"));
        return row;
    }

    private RoomMember mapMember(ResultSet rs) throws SQLException {
        RoomMember member = new RoomMember();
        member.setRoomId((UUID) rs.getObject("room_id"));
        member.setUserId(rs.getInt("user_id"));
        member.setRole(rs.getString("role"));
        member.setJoinedAt(rs.getTimestamp("joined_at"));
        member.setLastSeenAt(rs.getTimestamp("last_seen_at"));
        try {
            String username = rs.getString("username");
            if (username != null && !username.isBlank()) {
                member.setUsername(username);
            }
            String displayName = rs.getString("display_name");
            if (displayName != null && !displayName.isBlank()) {
                member.setDisplayName(displayName.trim());
            }
        } catch (SQLException ignored) {
            // Column absent on older SELECT shapes
        }
        return member;
    }
}