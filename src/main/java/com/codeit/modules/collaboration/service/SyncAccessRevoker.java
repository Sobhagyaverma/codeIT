package com.codeit.modules.collaboration.service;

import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Notifies the Yjs sync-server to drop sockets and deny reconnect for a user/room.
 * Failures are logged; REST authz still blocks new sync-token minting.
 */
@Component
public class SyncAccessRevoker {

    private static final Logger log = LoggerFactory.getLogger(SyncAccessRevoker.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final String revokeUrl;
    private final String internalSecret;
    private final boolean enabled;

    public SyncAccessRevoker(
            @Value("${codeit.sync.base-url:http://localhost:1234}") String syncBaseUrl,
            @Value("${codeit.sync.internal-secret:}") String internalSecret) {
        String base = syncBaseUrl == null ? "" : syncBaseUrl.trim().replaceAll("/$", "");
        this.revokeUrl = base + "/internal/revoke";
        this.internalSecret = internalSecret == null ? "" : internalSecret.trim();
        this.enabled = !base.isBlank() && !this.internalSecret.isBlank();
        if (!enabled) {
            log.warn(
                    "SyncAccessRevoker disabled (set codeit.sync.base-url + codeit.sync.internal-secret)");
        }
    }

    /** Revoke one user in a room (kick / leave / demote). */
    public void revokeUser(UUID roomId, Integer userId) {
        if (!enabled || roomId == null || userId == null) {
            return;
        }
        post(Map.of("roomId", roomId.toString(), "userId", userId));
    }

    /** Revoke every connection for a room (archive). */
    public void revokeRoom(UUID roomId) {
        if (!enabled || roomId == null) {
            return;
        }
        post(Map.of("roomId", roomId.toString()));
    }

    private void post(Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Sync-Internal-Secret", internalSecret);
            restTemplate.postForEntity(revokeUrl, new HttpEntity<>(body, headers), Void.class);
        } catch (RestClientException ex) {
            log.warn("Failed to revoke sync access {}: {}", body, ex.toString());
        }
    }
}
