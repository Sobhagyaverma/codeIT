package com.codeit.modules.beta;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class BetaInviteRepository {

    private final JdbcTemplate jdbc;

    public BetaInviteRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public long insert(
            String codeHash,
            String codePrefix,
            String email,
            Long requestId,
            Instant expiresAt,
            Integer createdBy) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(
                con -> {
                    var ps = con.prepareStatement(
                            """
                                    INSERT INTO beta_invites
                                        (code_hash, code_prefix, email, request_id, status, expires_at, created_by)
                                    VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
                                    """,
                            new String[] {"id"});
                    ps.setString(1, codeHash);
                    ps.setString(2, codePrefix);
                    ps.setString(3, email);
                    if (requestId != null) {
                        ps.setLong(4, requestId);
                    } else {
                        ps.setNull(4, java.sql.Types.BIGINT);
                    }
                    ps.setTimestamp(5, Timestamp.from(expiresAt));
                    if (createdBy != null) {
                        ps.setInt(6, createdBy);
                    } else {
                        ps.setNull(6, java.sql.Types.INTEGER);
                    }
                    return ps;
                },
                keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to insert beta invite");
        }
        return key.longValue();
    }

    public Optional<BetaInvite> findByHash(String codeHash) {
        List<BetaInvite> rows = jdbc.query(
                "SELECT * FROM beta_invites WHERE code_hash = ?",
                (rs, i) -> map(rs),
                codeHash);
        return rows.stream().findFirst();
    }

    public Optional<BetaInvite> findById(long id) {
        List<BetaInvite> rows = jdbc.query(
                "SELECT * FROM beta_invites WHERE id = ?",
                (rs, i) -> map(rs),
                id);
        return rows.stream().findFirst();
    }

    public List<BetaInvite> list(int limit) {
        int safe = Math.min(Math.max(limit, 1), 200);
        return jdbc.query(
                """
                        SELECT * FROM beta_invites
                        ORDER BY created_at DESC
                        LIMIT ?
                        """,
                (rs, i) -> map(rs),
                safe);
    }

    public int markUsed(long id, int userId) {
        return jdbc.update(
                """
                        UPDATE beta_invites
                        SET status = 'USED', used_at = NOW(), used_by_user_id = ?
                        WHERE id = ? AND status = 'ACTIVE' AND expires_at > NOW()
                        """,
                userId,
                id);
    }

    public int revoke(long id) {
        return jdbc.update(
                """
                        UPDATE beta_invites
                        SET status = 'REVOKED'
                        WHERE id = ? AND status = 'ACTIVE'
                        """,
                id);
    }

    public int expireStale() {
        return jdbc.update(
                """
                        UPDATE beta_invites
                        SET status = 'EXPIRED'
                        WHERE status = 'ACTIVE' AND expires_at <= NOW()
                        """);
    }

    public int countByStatus(String status) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM beta_invites WHERE status = ?",
                Integer.class,
                status);
        return n == null ? 0 : n;
    }

    public Map<String, Object> analyticsBundle() {
        return jdbc.queryForMap(
                """
                        SELECT
                          (SELECT COUNT(*) FROM users) AS registered_users,
                          (SELECT COUNT(*) FROM beta_access_requests WHERE status = 'PENDING') AS pending_requests,
                          (SELECT COUNT(*) FROM beta_access_requests WHERE status = 'APPROVED') AS approved_requests,
                          (SELECT COUNT(*) FROM beta_access_requests WHERE status = 'REJECTED') AS rejected_requests,
                          (SELECT COUNT(*) FROM beta_invites WHERE status = 'ACTIVE' AND expires_at > NOW()) AS active_invites,
                          (SELECT COUNT(*) FROM beta_invites WHERE status = 'USED') AS used_invites,
                          (SELECT COUNT(*) FROM beta_invites WHERE status = 'EXPIRED'
                              OR (status = 'ACTIVE' AND expires_at <= NOW())) AS expired_invites,
                          (SELECT COUNT(DISTINCT user_id) FROM submissions
                              WHERE created_at::date = CURRENT_DATE) AS dau_submissions,
                          (SELECT COUNT(*) FROM submissions WHERE status = 'Accepted') AS accepted_submissions,
                          (SELECT COUNT(*) FROM quick_contests) AS quick_clash_count,
                          (SELECT COUNT(*) FROM competitions) AS competition_count,
                          (SELECT COUNT(*) FROM rooms) AS rooms_created,
                          (SELECT COUNT(*) FROM ai_sessions) AS ai_requests
                        """);
    }

    private static BetaInvite map(java.sql.ResultSet rs) throws java.sql.SQLException {
        BetaInvite inv = new BetaInvite();
        inv.setId(rs.getLong("id"));
        inv.setCodeHash(rs.getString("code_hash"));
        inv.setCodePrefix(rs.getString("code_prefix"));
        inv.setEmail(rs.getString("email"));
        long requestId = rs.getLong("request_id");
        inv.setRequestId(rs.wasNull() ? null : requestId);
        inv.setStatus(rs.getString("status"));
        Timestamp exp = rs.getTimestamp("expires_at");
        inv.setExpiresAt(exp != null ? exp.toInstant() : null);
        Timestamp created = rs.getTimestamp("created_at");
        inv.setCreatedAt(created != null ? created.toInstant() : null);
        int createdBy = rs.getInt("created_by");
        inv.setCreatedBy(rs.wasNull() ? null : createdBy);
        Timestamp used = rs.getTimestamp("used_at");
        inv.setUsedAt(used != null ? used.toInstant() : null);
        int usedBy = rs.getInt("used_by_user_id");
        inv.setUsedByUserId(rs.wasNull() ? null : usedBy);
        return inv;
    }
}
