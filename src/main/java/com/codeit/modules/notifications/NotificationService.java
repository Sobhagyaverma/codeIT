package com.codeit.modules.notifications;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.codeit.modules.auth.SecurityUtils;
import com.codeit.security.ratelimit.RateLimitProperties;
import com.codeit.security.ratelimit.RateLimitService;

@Service
public class NotificationService {

    public static final String TYPE_FRIEND_REQUEST = "FRIEND_REQUEST";
    public static final String TYPE_FRIEND_ACCEPTED = "FRIEND_ACCEPTED";
    public static final String TYPE_QUICK_CONTEST_INVITE = "QUICK_CONTEST_INVITE";
    public static final String TYPE_QUICK_CONTEST_STARTING = "QUICK_CONTEST_STARTING";
    public static final String TYPE_QUICK_CONTEST_ENDED = "QUICK_CONTEST_ENDED";

    private final NotificationRepository repository;
    private final NotificationEventPublisher eventPublisher;
    private final RateLimitService rateLimitService;
    private final RateLimitProperties rateLimitProperties;

    public NotificationService(
            NotificationRepository repository,
            NotificationEventPublisher eventPublisher,
            RateLimitService rateLimitService,
            RateLimitProperties rateLimitProperties) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
        this.rateLimitService = rateLimitService;
        this.rateLimitProperties = rateLimitProperties;
    }

    /**
     * Persist a notification and push it to the recipient in realtime. Delivery failures
     * never break the caller's transaction — the row is already durable and will show up
     * on the next fetch.
     */
    public long notify(int userId, String type, Map<String, Object> payload) {
        long id = repository.insert(userId, type, payload);
        try {
            Map<String, Object> row = repository.findById(userId, id).orElseGet(() -> {
                Map<String, Object> fallback = new HashMap<>();
                fallback.put("id", id);
                fallback.put("type", type);
                fallback.put("payload", payload == null ? Map.of() : payload);
                fallback.put("read_at", null);
                fallback.put("created_at", Instant.now().toString());
                return fallback;
            });
            eventPublisher.publishCreated(userId, row, repository.countUnread(userId));
        } catch (RuntimeException ignored) {
            // Realtime is best-effort; the notification is already persisted.
        }
        return id;
    }

    public Map<String, Object> listMine(int limit) {
        int userId = SecurityUtils.currentUserId();
        rateLimitService.checkTieredOrThrow(
                "notification-read", String.valueOf(userId), rateLimitProperties.getNotificationRead());
        List<Map<String, Object>> items = repository.listForUser(userId, limit);
        Map<String, Object> body = new HashMap<>();
        body.put("items", items);
        body.put("unreadCount", repository.countUnread(userId));
        return body;
    }

    public Map<String, Object> unreadCount() {
        int userId = SecurityUtils.currentUserId();
        return Map.of("unreadCount", repository.countUnread(userId));
    }

    public Map<String, Object> markRead(long id) {
        int userId = SecurityUtils.currentUserId();
        rateLimitService.checkTieredOrThrow(
                "notification-read", String.valueOf(userId), rateLimitProperties.getNotificationRead());
        repository.markRead(userId, id);
        int unread = repository.countUnread(userId);
        eventPublisher.publishUnreadCount(userId, unread);
        return Map.of("ok", true, "unreadCount", unread);
    }

    public Map<String, Object> markAllRead() {
        int userId = SecurityUtils.currentUserId();
        rateLimitService.checkTieredOrThrow(
                "notification-read", String.valueOf(userId), rateLimitProperties.getNotificationRead());
        int updated = repository.markAllRead(userId);
        eventPublisher.publishUnreadCount(userId, 0);
        return Map.of("ok", true, "updated", updated, "unreadCount", 0);
    }

    /**
     * Remove FRIEND_REQUEST inbox rows for a resolved request and push an unread sync
     * so clients drop the card immediately.
     */
    public void dismissFriendRequest(int userId, long requestId, String status) {
        repository.deleteFriendRequestNotifications(userId, requestId);
        int unread = repository.countUnread(userId);
        eventPublisher.publishFriendRequestResolved(userId, requestId, status);
        eventPublisher.publishUnreadCount(userId, unread);
    }
}
