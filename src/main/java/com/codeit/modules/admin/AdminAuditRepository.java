package com.codeit.modules.admin;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AdminAuditRepository {

    private final JdbcTemplate jdbc;

    public AdminAuditRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(
            int adminUserId,
            String action,
            String entityType,
            String entityId,
            String detail,
            String ip,
            boolean success) {
        jdbc.update(
                """
                        INSERT INTO admin_audit_logs
                            (admin_user_id, action, entity_type, entity_id, detail, ip, success)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                adminUserId,
                action,
                entityType,
                entityId,
                detail,
                ip,
                success);
    }
}
