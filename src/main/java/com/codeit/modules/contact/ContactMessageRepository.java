package com.codeit.modules.contact;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class ContactMessageRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<ContactMessage> mapper = (rs, rowNum) -> {
        ContactMessage m = new ContactMessage();
        m.setId(rs.getLong("id"));
        m.setUsername(rs.getString("username"));
        Object userId = rs.getObject("user_id");
        m.setUserId(userId == null ? null : ((Number) userId).intValue());
        m.setUserEmail(rs.getString("user_email"));
        m.setSubject(rs.getString("subject"));
        m.setMessage(rs.getString("message"));
        m.setStatus(rs.getString("status"));
        m.setClientIp(rs.getString("client_ip"));
        m.setUserAgent(rs.getString("user_agent"));
        m.setAttemptCount(rs.getInt("attempt_count"));
        m.setLastError(rs.getString("last_error"));
        Timestamp created = rs.getTimestamp("created_at");
        m.setCreatedAt(created != null ? created.toInstant() : null);
        Timestamp sent = rs.getTimestamp("sent_at");
        m.setSentAt(sent != null ? sent.toInstant() : null);
        return m;
    };

    public ContactMessageRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long insert(
            String username,
            Integer userId,
            String userEmail,
            String subject,
            String message,
            String status,
            String clientIp,
            String userAgent) {
        String sql = """
                INSERT INTO contact_messages
                    (username, user_id, user_email, subject, message, status, client_ip, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            // PostgreSQL returns the full row for RETURN_GENERATED_KEYS; request only id.
            PreparedStatement ps = con.prepareStatement(sql, new String[] {"id"});
            ps.setString(1, username);
            if (userId == null) {
                ps.setObject(2, null);
            } else {
                ps.setInt(2, userId);
            }
            ps.setString(3, userEmail);
            ps.setString(4, subject);
            ps.setString(5, message);
            ps.setString(6, status);
            ps.setString(7, clientIp);
            ps.setString(8, userAgent);
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

    public Optional<ContactMessage> findById(long id) {
        List<ContactMessage> list = jdbcTemplate.query(
                "SELECT * FROM contact_messages WHERE id = ?", mapper, id);
        return list.stream().findFirst();
    }

    public void markSent(long id) {
        jdbcTemplate.update(
                """
                        UPDATE contact_messages
                        SET status = 'SENT', sent_at = NOW(), last_error = NULL,
                            attempt_count = attempt_count + 1
                        WHERE id = ?
                        """,
                id);
    }

    public void markFailed(long id, String error) {
        jdbcTemplate.update(
                """
                        UPDATE contact_messages
                        SET status = 'FAILED', last_error = ?, attempt_count = attempt_count + 1
                        WHERE id = ?
                        """,
                truncate(error, 2000),
                id);
    }

    public List<ContactMessage> findFailedForRetry(int maxAttempts, int olderThanSeconds, int limit) {
        Instant cutoff = Instant.now().minusSeconds(olderThanSeconds);
        return jdbcTemplate.query(
                """
                        SELECT * FROM contact_messages
                        WHERE status = 'FAILED'
                          AND attempt_count < ?
                          AND created_at < ?
                        ORDER BY created_at ASC
                        LIMIT ?
                        """,
                mapper,
                maxAttempts,
                Timestamp.from(cutoff),
                limit);
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max);
    }
}
