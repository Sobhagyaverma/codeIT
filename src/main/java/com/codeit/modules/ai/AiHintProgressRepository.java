package com.codeit.modules.ai;

import java.sql.Timestamp;
import java.time.Instant;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AiHintProgressRepository {

    private final JdbcTemplate jdbcTemplate;

    public AiHintProgressRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public int getMaxUnlockedLevel(Integer userId, Integer problemId) {
        Integer level = jdbcTemplate.query(
                """
                SELECT max_unlocked_level
                FROM ai_hint_progress
                WHERE user_id = ? AND problem_id = ?
                """,
                rs -> rs.next() ? rs.getInt("max_unlocked_level") : null,
                userId,
                problemId);
        return level == null ? 0 : level;
    }

    public void unlockLevel(Integer userId, Integer problemId, int level) {
        int current = getMaxUnlockedLevel(userId, problemId);
        int next = Math.max(current, level);
        jdbcTemplate.update(
                """
                INSERT INTO ai_hint_progress (user_id, problem_id, max_unlocked_level, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (user_id, problem_id)
                DO UPDATE SET
                    max_unlocked_level = GREATEST(ai_hint_progress.max_unlocked_level, EXCLUDED.max_unlocked_level),
                    updated_at = EXCLUDED.updated_at
                """,
                userId,
                problemId,
                next,
                Timestamp.from(Instant.now()));
    }
}
