package com.codeit.modules.ai;

import java.util.concurrent.atomic.AtomicBoolean;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Creates AI coach tables if they are missing.
 * Safe to call repeatedly; runs DDL at most once per JVM.
 */
@Component
public class AiSchemaInitializer {

    private static final Logger log = LoggerFactory.getLogger(AiSchemaInitializer.class);

    private final JdbcTemplate jdbcTemplate;
    private final AtomicBoolean initialized = new AtomicBoolean(false);

    public AiSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void ensureSchema() {
        if (initialized.get()) {
            return;
        }
        synchronized (this) {
            if (initialized.get()) {
                return;
            }
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS ai_sessions (
                        id          BIGSERIAL PRIMARY KEY,
                        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        problem_id  INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
                        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        UNIQUE (user_id, problem_id)
                    )
                    """);
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS ai_messages (
                        id          BIGSERIAL PRIMARY KEY,
                        session_id  BIGINT NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
                        role        VARCHAR(20) NOT NULL,
                        action      VARCHAR(64),
                        content     TEXT NOT NULL,
                        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """);
            jdbcTemplate.execute("""
                    CREATE INDEX IF NOT EXISTS idx_ai_messages_session
                        ON ai_messages(session_id, created_at ASC)
                    """);
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS ai_hint_progress (
                        user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        problem_id          INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
                        max_unlocked_level  INTEGER NOT NULL DEFAULT 0 CHECK (max_unlocked_level BETWEEN 0 AND 3),
                        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        PRIMARY KEY (user_id, problem_id)
                    )
                    """);
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS submission_diagnostics (
                        submission_id    INTEGER PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
                        verdict          VARCHAR(50) NOT NULL,
                        passed_count     INTEGER NOT NULL DEFAULT 0,
                        total_count      INTEGER NOT NULL DEFAULT 0,
                        failed_index     INTEGER,
                        compile_output   TEXT,
                        stderr_summary   TEXT,
                        judge_engine     VARCHAR(40),
                        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """);
            initialized.set(true);
            log.info("AI coach schema verified (tables present)");
        }
    }
}
