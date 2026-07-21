package com.codeit.modules.ai;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AiSessionRepository {

    private final JdbcTemplate jdbcTemplate;

    public AiSessionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long getOrCreateSession(Integer userId, Integer problemId) {
        Long existing = jdbcTemplate.query(
                """
                SELECT id FROM ai_sessions
                WHERE user_id = ? AND problem_id = ?
                """,
                rs -> rs.next() ? rs.getLong("id") : null,
                userId,
                problemId);
        if (existing != null) {
            jdbcTemplate.update(
                    "UPDATE ai_sessions SET updated_at = ? WHERE id = ?",
                    Timestamp.from(Instant.now()),
                    existing);
            return existing;
        }

        Timestamp now = Timestamp.from(Instant.now());
        Long id = jdbcTemplate.queryForObject(
                """
                INSERT INTO ai_sessions (user_id, problem_id, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                userId,
                problemId,
                now,
                now);
        if (id == null) {
            throw new IllegalStateException("Failed to create AI session");
        }
        return id;
    }

    public void saveMessage(long sessionId, String role, String action, String content) {
        jdbcTemplate.update(
                """
                INSERT INTO ai_messages (session_id, role, action, content, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                sessionId,
                role,
                action,
                content,
                Timestamp.from(Instant.now()));
    }

    public List<Map<String, Object>> getHistory(Integer userId, Integer problemId) {
        return jdbcTemplate.queryForList(
                """
                SELECT m.role, m.action, m.content, m.created_at
                FROM ai_messages m
                JOIN ai_sessions s ON s.id = m.session_id
                WHERE s.user_id = ? AND s.problem_id = ?
                ORDER BY m.created_at ASC, m.id ASC
                """,
                userId,
                problemId);
    }
}
