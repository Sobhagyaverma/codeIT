package com.codeit.modules.admin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditService {

    private static final Logger log = LoggerFactory.getLogger(AdminAuditService.class);

    private final AdminAuditRepository repository;

    public AdminAuditService(AdminAuditRepository repository) {
        this.repository = repository;
    }

    public void log(
            Integer adminUserId,
            String action,
            String entityType,
            String entityId,
            String detail,
            String ip,
            boolean success) {
        if (adminUserId == null) {
            log.warn("admin audit skipped (no admin id) action={}", action);
            return;
        }
        try {
            repository.insert(
                    adminUserId,
                    action,
                    entityType,
                    entityId,
                    detail,
                    ip,
                    success);
        } catch (Exception ex) {
            log.error("Failed to write admin audit action={}: {}", action, ex.toString());
        }
    }
}
