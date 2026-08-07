package com.codeit.modules.beta;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class BetaAccessRequestRepository {

    private final JdbcTemplate jdbc;

    public BetaAccessRequestRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public long insert(String fullName, String email, String college, String year, String reason) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(
                con -> {
                    var ps = con.prepareStatement(
                            """
                                    INSERT INTO beta_access_requests
                                        (full_name, email, college, year, reason, status)
                                    VALUES (?, ?, ?, ?, ?, 'PENDING')
                                    """,
                            new String[] {"id"});
                    ps.setString(1, fullName);
                    ps.setString(2, email);
                    ps.setString(3, college);
                    ps.setString(4, year);
                    ps.setString(5, reason);
                    return ps;
                },
                keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to insert beta access request");
        }
        return key.longValue();
    }

    public boolean hasPending(String email) {
        Integer n = jdbc.queryForObject(
                """
                        SELECT COUNT(*) FROM beta_access_requests
                        WHERE LOWER(email) = LOWER(?) AND status = 'PENDING'
                        """,
                Integer.class,
                email);
        return n != null && n > 0;
    }

    public Optional<BetaAccessRequest> findById(long id) {
        List<BetaAccessRequest> rows = jdbc.query(
                "SELECT * FROM beta_access_requests WHERE id = ?",
                (rs, i) -> map(rs),
                id);
        return rows.stream().findFirst();
    }

    public List<BetaAccessRequest> list(String status, int limit) {
        int safe = Math.min(Math.max(limit, 1), 200);
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return jdbc.query(
                    """
                            SELECT * FROM beta_access_requests
                            ORDER BY created_at DESC
                            LIMIT ?
                            """,
                    (rs, i) -> map(rs),
                    safe);
        }
        return jdbc.query(
                """
                        SELECT * FROM beta_access_requests
                        WHERE status = ?
                        ORDER BY created_at DESC
                        LIMIT ?
                        """,
                (rs, i) -> map(rs),
                status.trim().toUpperCase(),
                safe);
    }

    public int markApproved(long id, int adminId) {
        return jdbc.update(
                """
                        UPDATE beta_access_requests
                        SET status = 'APPROVED', reviewed_at = NOW(), reviewed_by = ?, reject_reason = NULL
                        WHERE id = ? AND status = 'PENDING'
                        """,
                adminId,
                id);
    }

    public int markRejected(long id, int adminId, String reason) {
        return jdbc.update(
                """
                        UPDATE beta_access_requests
                        SET status = 'REJECTED', reviewed_at = NOW(), reviewed_by = ?, reject_reason = ?
                        WHERE id = ? AND status = 'PENDING'
                        """,
                adminId,
                reason,
                id);
    }

    public int countByStatus(String status) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM beta_access_requests WHERE status = ?",
                Integer.class,
                status);
        return n == null ? 0 : n;
    }

    private static BetaAccessRequest map(java.sql.ResultSet rs) throws java.sql.SQLException {
        BetaAccessRequest r = new BetaAccessRequest();
        r.setId(rs.getLong("id"));
        r.setFullName(rs.getString("full_name"));
        r.setEmail(rs.getString("email"));
        r.setCollege(rs.getString("college"));
        r.setYear(rs.getString("year"));
        r.setReason(rs.getString("reason"));
        r.setStatus(rs.getString("status"));
        Timestamp created = rs.getTimestamp("created_at");
        r.setCreatedAt(created != null ? created.toInstant() : null);
        Timestamp reviewed = rs.getTimestamp("reviewed_at");
        r.setReviewedAt(reviewed != null ? reviewed.toInstant() : null);
        int reviewedBy = rs.getInt("reviewed_by");
        r.setReviewedBy(rs.wasNull() ? null : reviewedBy);
        r.setRejectReason(rs.getString("reject_reason"));
        return r;
    }
}
