package com.codeit.modules.notifications;

import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Pushes user-scoped notification events over STOMP so clients do not have to poll.
 *
 * <p>Uses a per-user topic rather than {@code convertAndSendToUser} because the STOMP
 * principal name in this app resolves to the account email, while every other publisher
 * here keys destinations by numeric user id.
 */
@Component
public class NotificationEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public static String userTopic(int userId) {
        return "/topic/users/" + userId + "/notifications";
    }

    /** A notification row was created for this user. */
    public void publishCreated(int userId, Map<String, Object> notification, int unreadCount) {
        send(
                userId,
                Map.of(
                        "event", "notification:created",
                        "notification", notification,
                        "unreadCount", unreadCount));
    }

    /** Unread total changed (read, read-all, or a request was resolved elsewhere). */
    public void publishUnreadCount(int userId, int unreadCount) {
        send(userId, Map.of("event", "notification:unread", "unreadCount", unreadCount));
    }

    /**
     * The user's friend graph changed (request accepted/rejected, friend removed) so
     * open Friends/Profile views can refresh without a reload.
     */
    public void publishFriendsChanged(int userId, Map<String, Object> detail) {
        send(userId, Map.of("event", "friends:changed", "detail", detail));
    }

    /** A pending friend request no longer needs an answer — drop any open toast/card. */
    public void publishFriendRequestResolved(int userId, long requestId, String status) {
        send(
                userId,
                Map.of(
                        "event", "friend-request:resolved",
                        "requestId", requestId,
                        "status", status));
    }

    private void send(int userId, Map<String, Object> payload) {
        messagingTemplate.convertAndSend(userTopic(userId), (Object) payload);
    }
}
